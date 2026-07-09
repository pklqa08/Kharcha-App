import { Budget } from "@/src/domain/entities/models";
import {
  enqueueSyncOperation,
  getRequiredDb,
} from "@/src/infrastructure/repositories/sqlite.helpers";

export const budgetRepo = {
  list: async (): Promise<Budget[]> => {
    const db = await getRequiredDb();
    return db.getAllAsync<Budget>(
      "SELECT * FROM budgets ORDER BY created_at DESC"
    );
  },

  create: async (
    category_id: string | null,
    amount: number,
    period = "monthly"
  ): Promise<Budget | null> => {
    const db = await getRequiredDb();
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    await db.runAsync(
      "INSERT INTO budgets (id, category_id, amount, period, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, category_id, amount, period, now]
    );

    await enqueueSyncOperation(db, {
      entity: "budgets",
      entityId: id,
      action: "create",
      payload: { id, category_id, amount, period, created_at: now },
    });

    return { id, category_id, amount, period, created_at: now };
  },

  remove: async (id: string): Promise<void> => {
    const db = await getRequiredDb();
    await db.runAsync("DELETE FROM budgets WHERE id = ?", [id]);

    await enqueueSyncOperation(db, {
      entity: "budgets",
      entityId: id,
      action: "delete",
      payload: { id },
    });
  },
};
