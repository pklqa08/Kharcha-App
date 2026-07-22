import { Category, CategoryType } from "@/src/domain/entities/models";
import {
  CategoryCreateInput,
  CategoryUpdateInput,
  ICategoryRepository,
} from "@/src/domain/interfaces/repositories/category.repository.interface";
import {
  enqueueSyncOperation,
  getRequiredDb,
} from "@/src/infrastructure/repositories/sqlite.helpers";

type CategoryCreateLegacySignature = (
  name: string,
  type: CategoryType,
  icon: string,
  color: string
) => Promise<Category | null>;

type CategoryRepoShape = ICategoryRepository & {
  create: ICategoryRepository["create"] & CategoryCreateLegacySignature;
};

const normalizeCreateInput = (
  inputOrName: CategoryCreateInput | string,
  type?: CategoryType,
  icon?: string,
  color?: string
): CategoryCreateInput => {
  if (typeof inputOrName === "string") {
    if (!type || icon == null || color == null) {
      throw new Error("Category create requires name, type, icon, and color");
    }

    return {
      name: inputOrName,
      type,
      icon,
      color,
    };
  }

  return inputOrName;
};

export const categoryRepo: CategoryRepoShape = {
  list: async (type?: CategoryType): Promise<Category[]> => {
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
    inputOrName: CategoryCreateInput | string,
    type?: CategoryType,
    icon?: string,
    color?: string
  ): Promise<Category | null> => {
    const db = await getRequiredDb();
    const input = normalizeCreateInput(inputOrName, type, icon, color);
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    await db.runAsync(
      "INSERT INTO categories (id, name, type, icon, color, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, 1, 999)",
      [id, input.name, input.type, input.icon, input.color]
    );

    await enqueueSyncOperation(db, {
      entity: "categories",
      entityId: id,
      action: "create",
      payload: {
        id,
        name: input.name,
        type: input.type,
        icon: input.icon,
        color: input.color,
        is_custom: 1,
        sort_order: 999,
      },
    });

    const row = await db.getFirstAsync<Category>(
      "SELECT * FROM categories WHERE id = ?",
      [id]
    );
    return row ?? null;
  },

  update: async (
    id: string,
    patch: CategoryUpdateInput
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
