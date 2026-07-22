import { Merchant, MerchantInput } from "@/src/domain/entities/merchant";
import { IMerchantRepository } from "@/src/domain/interfaces/repositories/merchant.repository.interface";
import { getRequiredDb } from "@/src/infrastructure/repositories/sqlite.helpers";

type MerchantPersistenceRow = {
  id: string;
  canonical_name: string;
  display_name: string | null;
  category_hint_id: string | null;
  confidence: number | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
};

const nowIso = (): string => new Date().toISOString();
const createId = (): string => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const mapRowToMerchant = (row: MerchantPersistenceRow | null): Merchant | null => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    canonicalName: row.canonical_name,
    displayName: row.display_name ?? null,
    normalizedName: row.canonical_name.toLowerCase(),
    aliases: [],
    categoryHintId: row.category_hint_id ?? null,
    confidence: row.confidence ?? null,
    metadata: row.metadata ?? null,
    transactionCount: null,
    isActive: true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapRowsToMerchants = (rows: MerchantPersistenceRow[]): Merchant[] =>
  rows
    .map((row) => mapRowToMerchant(row))
    .filter((row): row is Merchant => row !== null);

export const merchantRepo: IMerchantRepository = {
  create: async (input: MerchantInput): Promise<Merchant | null> => {
    const db = await getRequiredDb();
    const id = createId();
    const now = nowIso();

    const canonicalName = input.canonicalName.trim();
    if (!canonicalName) {
      return null;
    }

    await db.runAsync(
      `INSERT INTO merchants (id, canonical_name, display_name, category_hint_id, confidence, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        canonicalName,
        input.displayName ?? null,
        input.categoryHintId ?? null,
        input.confidence ?? null,
        input.metadata ?? null,
        now,
        now,
      ]
    );

    return mapRowToMerchant({
      id,
      canonical_name: canonicalName,
      display_name: input.displayName ?? null,
      category_hint_id: input.categoryHintId ?? null,
      confidence: input.confidence ?? null,
      metadata: input.metadata ?? null,
      created_at: now,
      updated_at: now,
    });
  },

  update: async (id: string, patch: Partial<MerchantInput>): Promise<void> => {
    const db = await getRequiredDb();
    const now = nowIso();
    const updates: string[] = ["updated_at = ?"];
    const params: Array<string | number | null> = [now];

    if (patch.canonicalName !== undefined) {
      updates.push("canonical_name = ?");
      params.push(patch.canonicalName.trim());
    }
    if (patch.displayName !== undefined) {
      updates.push("display_name = ?");
      params.push(patch.displayName ?? null);
    }
    if (patch.categoryHintId !== undefined) {
      updates.push("category_hint_id = ?");
      params.push(patch.categoryHintId ?? null);
    }
    if (patch.confidence !== undefined) {
      updates.push("confidence = ?");
      params.push(patch.confidence ?? null);
    }
    if (patch.metadata !== undefined) {
      updates.push("metadata = ?");
      params.push(patch.metadata ?? null);
    }

    if (updates.length === 1) {
      return;
    }

    params.push(id);
    await db.runAsync(`UPDATE merchants SET ${updates.join(", ")} WHERE id = ?`, params);
  },

  delete: async (id: string): Promise<void> => {
    const db = await getRequiredDb();
    await db.runAsync("DELETE FROM merchants WHERE id = ?", [id]);
  },

  findById: async (id: string): Promise<Merchant | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<MerchantPersistenceRow>(
      "SELECT id, canonical_name, display_name, category_hint_id, confidence, metadata, created_at, updated_at FROM merchants WHERE id = ?",
      [id]
    );
    return mapRowToMerchant(row ?? null);
  },

  findByCanonicalName: async (canonicalName: string): Promise<Merchant | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<MerchantPersistenceRow>(
      "SELECT id, canonical_name, display_name, category_hint_id, confidence, metadata, created_at, updated_at FROM merchants WHERE canonical_name = ?",
      [canonicalName]
    );
    return mapRowToMerchant(row ?? null);
  },

  findByNormalizedName: async (normalizedName: string): Promise<Merchant | null> => {
    const db = await getRequiredDb();
    const rows = await db.getAllAsync<MerchantPersistenceRow>(
      "SELECT id, canonical_name, display_name, category_hint_id, confidence, metadata, created_at, updated_at FROM merchants"
    );
    const merchant = rows.find((row) => row.canonical_name.toLowerCase() === normalizedName.toLowerCase());
    return mapRowToMerchant(merchant ?? null);
  },

  findAll: async (limit?: number): Promise<Merchant[]> => {
    const db = await getRequiredDb();
    const rows = await db.getAllAsync<MerchantPersistenceRow>(
      `SELECT id, canonical_name, display_name, category_hint_id, confidence, metadata, created_at, updated_at FROM merchants ORDER BY canonical_name ASC${typeof limit === "number" && limit > 0 ? ` LIMIT ${Math.floor(limit)}` : ""}`
    );
    return mapRowsToMerchants(rows);
  },

  search: async (query: string, limit?: number): Promise<Merchant[]> => {
    const db = await getRequiredDb();
    const whereQuery = `%${query}%`;
    const rows = await db.getAllAsync<MerchantPersistenceRow>(
      `SELECT id, canonical_name, display_name, category_hint_id, confidence, metadata, created_at, updated_at FROM merchants WHERE canonical_name LIKE ? OR display_name LIKE ? ORDER BY canonical_name ASC${typeof limit === "number" && limit > 0 ? ` LIMIT ${Math.floor(limit)}` : ""}`,
      [whereQuery, whereQuery]
    );
    return mapRowsToMerchants(rows);
  },

  count: async (): Promise<number> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM merchants");
    return row?.count ?? 0;
  },
};
