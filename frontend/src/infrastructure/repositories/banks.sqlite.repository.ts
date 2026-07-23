import {
  Bank,
  BankCreateInput,
  BankUpdateInput,
  IBankRepository,
} from "@/src/domain/interfaces/repositories/bank.repository.interface";
import {
  enqueueSyncOperation,
  getRequiredDb,
} from "@/src/infrastructure/repositories/sqlite.helpers";

type BankPersistenceRow = {
  id: string;
  name: string;
  short_code: string | null;
  created_at: string;
  updated_at: string;
};

const nowIso = (): string => new Date().toISOString();
const createId = (): string => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const mapRowToBank = (row: BankPersistenceRow | null): Bank | null => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    shortCode: row.short_code ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapRowsToBanks = (rows: BankPersistenceRow[]): Bank[] =>
  rows
    .map((row) => mapRowToBank(row))
    .filter((row): row is Bank => row !== null);

export const bankRepo: IBankRepository = {
  list: async (): Promise<Bank[]> => {
    const db = await getRequiredDb();
    const rows = await db.getAllAsync<BankPersistenceRow>(
      "SELECT id, name, short_code, created_at, updated_at FROM banks ORDER BY name ASC"
    );
    return mapRowsToBanks(rows);
  },

  get: async (id: string): Promise<Bank | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<BankPersistenceRow>(
      "SELECT id, name, short_code, created_at, updated_at FROM banks WHERE id = ?",
      [id]
    );
    return mapRowToBank(row ?? null);
  },

  create: async (input: BankCreateInput): Promise<Bank | null> => {
    const db = await getRequiredDb();
    const name = input.name.trim();
    if (!name) {
      return null;
    }

    const id = createId();
    const now = nowIso();

    await db.runAsync(
      `INSERT INTO banks (id, name, short_code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, name, input.shortCode ?? null, now, now]
    );

    await enqueueSyncOperation(db, {
      entity: "banks",
      entityId: id,
      action: "create",
      payload: {
        id,
        name,
        short_code: input.shortCode ?? null,
        created_at: now,
        updated_at: now,
      },
    });

    return mapRowToBank({
      id,
      name,
      short_code: input.shortCode ?? null,
      created_at: now,
      updated_at: now,
    });
  },

  update: async (id: string, patch: BankUpdateInput): Promise<void> => {
    const db = await getRequiredDb();
    const now = nowIso();
    const updates: string[] = ["updated_at = ?"];
    const params: Array<string | null> = [now];

    if (patch.name !== undefined) {
      updates.push("name = ?");
      params.push(patch.name.trim());
    }

    if (patch.shortCode !== undefined) {
      updates.push("short_code = ?");
      params.push(patch.shortCode ?? null);
    }

    if (updates.length === 1) {
      return;
    }

    params.push(id);
    await db.runAsync(`UPDATE banks SET ${updates.join(", ")} WHERE id = ?`, params);

    await enqueueSyncOperation(db, {
      entity: "banks",
      entityId: id,
      action: "update",
      payload: {
        id,
        ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
        ...(patch.shortCode !== undefined ? { short_code: patch.shortCode ?? null } : {}),
        updated_at: now,
      },
    });
  },

  remove: async (id: string): Promise<void> => {
    const db = await getRequiredDb();
    await db.runAsync("DELETE FROM banks WHERE id = ?", [id]);

    await enqueueSyncOperation(db, {
      entity: "banks",
      entityId: id,
      action: "delete",
      payload: { id },
    });
  },
};