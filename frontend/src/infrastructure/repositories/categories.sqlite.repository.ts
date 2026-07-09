import { Category } from "@/src/domain/entities/models";
import {
  enqueueSyncOperation,
  getRequiredDb,
} from "@/src/infrastructure/repositories/sqlite.helpers";

export const categoryRepo = {
  list: async (type?: "expense" | "income"): Promise<Category[]> => {
    const db = await getRequiredDb();
    if (type) {
      return db.getAllAsync<Category>(
        "SELECT * FROM categories WHERE type = ? ORDER BY sort_order ASC, name ASC",
        [type]
      );
    }
    return db.getAllAsync<Category>(
      "SELECT * FROM categories ORDER BY type, sort_order, name"
    );
  },

  get: async (id: string): Promise<Category | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
    return row ?? null;
  },

  create: async (
    name: string,
    type: "expense" | "income",
    icon: string,
    color: string
  ): Promise<Category | null> => {
    const db = await getRequiredDb();
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await db.runAsync(
      "INSERT INTO categories (id, name, type, icon, color, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, 1, 999)",
      [id, name, type, icon, color]
    );

    await enqueueSyncOperation(db, {
      entity: "categories",
      entityId: id,
      action: "create",
      payload: { id, name, type, icon, color, is_custom: 1, sort_order: 999 },
    });

    const row = await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
    return row ?? null;
  },

  update: async (
    id: string,
    patch: Partial<Pick<Category, "name" | "icon" | "color">>
  ): Promise<void> => {
    const db = await getRequiredDb();
    const current = await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
    if (!current) {
      return;
    }

    const next = {
      name: patch.name ?? current.name,
      icon: patch.icon ?? current.icon,
      color: patch.color ?? current.color,
    };

    await db.runAsync(
      "UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?",
      [next.name, next.icon, next.color, id]
    );

    await enqueueSyncOperation(db, {
      entity: "categories",
      entityId: id,
      action: "update",
      payload: { id, ...next },
    });
  },

  remove: async (id: string): Promise<void> => {
    const db = await getRequiredDb();
    await db.runAsync("DELETE FROM categories WHERE id = ? AND is_custom = 1", [id]);

    await enqueueSyncOperation(db, {
      entity: "categories",
      entityId: id,
      action: "delete",
      payload: { id },
    });
  },
};
