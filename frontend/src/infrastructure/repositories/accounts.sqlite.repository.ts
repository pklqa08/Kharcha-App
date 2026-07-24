import {
  Account,
  AccountCreateInput,
  AccountUpdateInput,
  IAccountRepository,
} from "@/src/domain/interfaces/repositories/account.repository.interface";
import {
  enqueueSyncOperation,
  getRequiredDb,
} from "@/src/infrastructure/repositories/sqlite.helpers";

type AccountPersistenceRow = {
  id: string;
  bank_id: string | null;
  label: string;
  account_number: string | null;
  account_masked: string | null;
  account_type: string | null;
  holder_name: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
};

const nowIso = (): string => new Date().toISOString();
const createId = (): string => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const mapRowToAccount = (row: AccountPersistenceRow | null): Account | null => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    bankId: row.bank_id ?? null,
    label: row.label,
    accountNumber: row.account_number ?? null,
    accountMasked: row.account_masked ?? null,
    accountType: row.account_type ?? null,
    holderName: row.holder_name ?? null,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const mapRowsToAccounts = (rows: AccountPersistenceRow[]): Account[] =>
  rows
    .map((row) => mapRowToAccount(row))
    .filter((row): row is Account => row !== null);

export const accountRepo: IAccountRepository = {
  list: async (): Promise<Account[]> => {
    const db = await getRequiredDb();
    const rows = await db.getAllAsync<AccountPersistenceRow>(
      `SELECT id, bank_id, label, account_number, account_masked, account_type, holder_name, is_active, created_at, updated_at
       FROM accounts
       ORDER BY label ASC`
    );
    return mapRowsToAccounts(rows);
  },

  get: async (id: string): Promise<Account | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<AccountPersistenceRow>(
      `SELECT id, bank_id, label, account_number, account_masked, account_type, holder_name, is_active, created_at, updated_at
       FROM accounts
       WHERE id = ?`,
      [id]
    );
    return mapRowToAccount(row ?? null);
  },

  create: async (input: AccountCreateInput): Promise<Account | null> => {
    const db = await getRequiredDb();
    const label = input.label.trim();
    if (!label) {
      return null;
    }

    const id = createId();
    const now = nowIso();
    const isActive = input.isActive ?? true;

    await db.runAsync(
      `INSERT INTO accounts
       (id, bank_id, label, account_number, account_masked, account_type, holder_name, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.bankId ?? null,
        label,
        input.accountNumber ?? null,
        input.accountMasked ?? null,
        input.accountType ?? null,
        input.holderName ?? null,
        isActive ? 1 : 0,
        now,
        now,
      ]
    );

    await enqueueSyncOperation(db, {
      entity: "accounts",
      entityId: id,
      action: "create",
      payload: {
        id,
        bank_id: input.bankId ?? null,
        label,
        account_number: input.accountNumber ?? null,
        account_masked: input.accountMasked ?? null,
        account_type: input.accountType ?? null,
        holder_name: input.holderName ?? null,
        is_active: isActive ? 1 : 0,
        created_at: now,
        updated_at: now,
      },
    });

    return mapRowToAccount({
      id,
      bank_id: input.bankId ?? null,
      label,
      account_number: input.accountNumber ?? null,
      account_masked: input.accountMasked ?? null,
      account_type: input.accountType ?? null,
      holder_name: input.holderName ?? null,
      is_active: isActive ? 1 : 0,
      created_at: now,
      updated_at: now,
    });
  },

  update: async (id: string, patch: AccountUpdateInput): Promise<void> => {
    const db = await getRequiredDb();
    const now = nowIso();
    const updates: string[] = ["updated_at = ?"];
    const params: Array<string | number | null> = [now];

    if (patch.bankId !== undefined) {
      updates.push("bank_id = ?");
      params.push(patch.bankId ?? null);
    }
    if (patch.label !== undefined) {
      updates.push("label = ?");
      params.push(patch.label.trim());
    }
    if (patch.accountNumber !== undefined) {
      updates.push("account_number = ?");
      params.push(patch.accountNumber ?? null);
    }
    if (patch.accountMasked !== undefined) {
      updates.push("account_masked = ?");
      params.push(patch.accountMasked ?? null);
    }
    if (patch.accountType !== undefined) {
      updates.push("account_type = ?");
      params.push(patch.accountType ?? null);
    }
    if (patch.holderName !== undefined) {
      updates.push("holder_name = ?");
      params.push(patch.holderName ?? null);
    }
    if (patch.isActive !== undefined) {
      updates.push("is_active = ?");
      params.push(patch.isActive ? 1 : 0);
    }

    if (updates.length === 1) {
      return;
    }

    params.push(id);
    await db.runAsync(`UPDATE accounts SET ${updates.join(", ")} WHERE id = ?`, params);

    await enqueueSyncOperation(db, {
      entity: "accounts",
      entityId: id,
      action: "update",
      payload: {
        id,
        ...(patch.bankId !== undefined ? { bank_id: patch.bankId ?? null } : {}),
        ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
        ...(patch.accountNumber !== undefined ? { account_number: patch.accountNumber ?? null } : {}),
        ...(patch.accountMasked !== undefined ? { account_masked: patch.accountMasked ?? null } : {}),
        ...(patch.accountType !== undefined ? { account_type: patch.accountType ?? null } : {}),
        ...(patch.holderName !== undefined ? { holder_name: patch.holderName ?? null } : {}),
        ...(patch.isActive !== undefined ? { is_active: patch.isActive ? 1 : 0 } : {}),
        updated_at: now,
      },
    });
  },

  remove: async (id: string): Promise<void> => {
    const db = await getRequiredDb();
    await db.runAsync("DELETE FROM accounts WHERE id = ?", [id]);

    await enqueueSyncOperation(db, {
      entity: "accounts",
      entityId: id,
      action: "delete",
      payload: { id },
    });
  },
};