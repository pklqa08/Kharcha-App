import { getRequiredDb } from "@/src/infrastructure/repositories/sqlite.helpers";
import { storage } from "@/src/infrastructure/storage";

export const settingsRepo = {
  get: async (key: string): Promise<string | null> => {
    try {
      const db = await getRequiredDb();
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = ?",
        [key]
      );
      return row?.value ?? null;
    } catch {
      return storage.getItem<string | null>(`settings:${key}`, null);
    }
  },

  set: async (key: string, value: string): Promise<void> => {
    try {
      const db = await getRequiredDb();
      await db.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [key, value]
      );
    } catch {
      await storage.setItem(`settings:${key}`, value);
    }
  },

  delete: async (key: string): Promise<void> => {
    try {
      const db = await getRequiredDb();
      await db.runAsync("DELETE FROM settings WHERE key = ?", [key]);
    } catch {
      await storage.removeItem(`settings:${key}`);
    }
  },
};
