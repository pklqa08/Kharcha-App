import {
  Transaction,
  TransactionInput,
  TxnType,
} from "@/src/domain/entities/models";
import { TransactionStatus } from "@/src/domain/value_objects/transaction-status.vo";
import {
  enqueueSyncOperation,
  getRequiredDb,
} from "@/src/infrastructure/repositories/sqlite.helpers";

type TransactionListOptions = {
  search?: string;
  type?: TxnType;
  categoryId?: string;
  merchantId?: string;
  bankId?: string;
  accountId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
};

type DuplicateLookup = {
  amount: number;
  type: TxnType;
  date: string;
  referenceNumber?: string | null;
  excludeId?: string;
};

type TransactionPersistenceRow = {
  id: string;
  amount: number;
  type: TxnType;
  category_id: string | null;
  merchant_id?: string | null;
  merchant: string | null;
  description: string | null;
  date: string;
  payment_mode: Transaction["payment_mode"];
  bank_id?: string | null;
  account_id?: string | null;
  bank_name: string | null;
  account_number: string | null;
  upi_id: string | null;
  reference_number: string | null;
  utr: string | null;
  rrn: string | null;
  source: string;
  external_ref?: string | null;
  created_at: string;
  updated_at: string;
  tags: string | null;
  notes: string | null;
  attachment: string | null;
  status: string;
};

const isTransactionStatus = (value: string | null | undefined): value is TransactionStatus =>
  value === "pending" || value === "completed" || value === "failed";

const toTagsValue = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return typeof value === "string" ? value : null;
};

const mapRowToTransaction = (row: TransactionPersistenceRow | null): Transaction | null => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    uuid: row.id,
    amount: row.amount,
    type: row.type,
    source: row.source ?? "manual",
    externalSourceId: row.external_ref ?? null,
    sourceId: row.external_ref ?? null,
    transactionStatus: isTransactionStatus(row.status) ? row.status : undefined,
    processingStatus: undefined,
    paymentMethod: row.payment_mode ?? null,
    merchantId: row.merchant_id ?? null,
    merchantName: row.merchant ?? null,
    categoryId: row.category_id ?? null,
    categoryName: null,
    bankId: row.bank_id ?? null,
    bankName: row.bank_name ?? null,
    accountId: row.account_id ?? null,
    accountName: row.account_number ?? null,
    referenceNumber: row.reference_number ?? null,
    currency: undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    category_id: row.category_id ?? null,
    merchant: row.merchant ?? null,
    description: row.description ?? null,
    date: row.date,
    payment_mode: row.payment_mode ?? null,
    bank_name: row.bank_name ?? null,
    account_number: row.account_number ?? null,
    upi_id: row.upi_id ?? null,
    reference_number: row.reference_number ?? null,
    utr: row.utr ?? null,
    rrn: row.rrn ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    tags: row.tags ?? null,
    notes: row.notes ?? null,
    attachment: row.attachment ?? null,
    status: row.status ?? "completed",
  };
};

const mapRowsToTransactions = (rows: TransactionPersistenceRow[]): Transaction[] =>
  rows
    .map((row) => mapRowToTransaction(row))
    .filter((row): row is Transaction => row !== null);

const buildFindAllQuery = (opts?: TransactionListOptions): {
  sql: string;
  params: Array<string | number>;
} => {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (opts?.type) {
    clauses.push("type = ?");
    params.push(opts.type);
  }
  if (opts?.categoryId) {
    clauses.push("category_id = ?");
    params.push(opts.categoryId);
  }
  if (opts?.merchantId) {
    clauses.push("merchant_id = ?");
    params.push(opts.merchantId);
  }
  if (opts?.bankId) {
    clauses.push("bank_id = ?");
    params.push(opts.bankId);
  }
  if (opts?.accountId) {
    clauses.push("account_id = ?");
    params.push(opts.accountId);
  }
  if (opts?.from) {
    clauses.push("date >= ?");
    params.push(opts.from);
  }
  if (opts?.to) {
    clauses.push("date <= ?");
    params.push(opts.to);
  }
  if (opts?.search) {
    clauses.push("(merchant LIKE ? OR description LIKE ? OR notes LIKE ? OR reference_number LIKE ?)");
    const q = `%${opts.search}%`;
    params.push(q, q, q, q);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limitValue = typeof opts?.limit === "number" ? Math.max(0, Math.floor(opts.limit)) : null;
  const offsetValue = typeof opts?.offset === "number" ? Math.max(0, Math.floor(opts.offset)) : null;
  const limit =
    limitValue !== null
      ? `LIMIT ${limitValue}${offsetValue !== null ? ` OFFSET ${offsetValue}` : ""}`
      : "";

  return {
    sql: `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC ${limit}`,
    params,
  };
};

const nowIso = (): string => new Date().toISOString();
const createId = (): string => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const transactionInputExt = (
  input: TransactionInput | Partial<TransactionInput>
): Partial<TransactionInput> & {
  externalSourceId?: string | null;
  transactionStatus?: TransactionStatus;
  paymentMethod?: Transaction["payment_mode"];
  referenceNumber?: string | null;
  merchantName?: string | null;
  categoryId?: string | null;
  bankId?: string | null;
  bankName?: string | null;
  accountId?: string | null;
  accountName?: string | null;
} => input as Partial<TransactionInput> & {
  externalSourceId?: string | null;
  transactionStatus?: TransactionStatus;
  paymentMethod?: Transaction["payment_mode"];
  referenceNumber?: string | null;
  merchantName?: string | null;
  categoryId?: string | null;
  bankId?: string | null;
  bankName?: string | null;
  accountId?: string | null;
  accountName?: string | null;
};

export const transactionRepo = {
  create: async (input: TransactionInput): Promise<Transaction | null> => {
    const db = await getRequiredDb();
    const ext = transactionInputExt(input);
    const id = createId();
    const now = nowIso();

    const categoryId = input.category_id ?? ext.categoryId ?? null;
    const merchant = input.merchant ?? ext.merchantName ?? null;
    const paymentMode = input.payment_mode ?? ext.paymentMethod ?? null;
    const referenceNumber = input.reference_number ?? ext.referenceNumber ?? null;
    const source = input.source ?? "manual";
    const externalRef = ext.externalSourceId ?? input.sourceId ?? null;
    const status = ext.transactionStatus ?? "completed";
    const tags = toTagsValue(input.tags);

    await db.runAsync(
      `INSERT INTO transactions
       (id, amount, type, category_id, merchant_id, merchant, description, date, payment_mode,
        bank_id, account_id, upi_ref_id, bank_name, account_number, upi_id, reference_number, utr, rrn,
        transaction_source_id, source, external_ref, fingerprint, is_duplicate,
        created_at, updated_at, tags, notes, attachment, status)
       VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?,
               ?, ?, NULL, ?, ?, ?, ?, NULL, NULL,
               NULL, ?, ?, NULL, 0,
               ?, ?, ?, ?, NULL, ?)`,
      [
        id,
        input.amount,
        input.type,
        categoryId,
        merchant,
        input.description ?? null,
        input.date,
        paymentMode,
        ext.bankId ?? null,
        ext.accountId ?? null,
        ext.bankName ?? null,
        ext.accountName ?? null,
        input.upi_id ?? null,
        referenceNumber,
        source,
        externalRef,
        now,
        now,
        tags,
        input.notes ?? null,
        status,
      ]
    );

    await enqueueSyncOperation(db, {
      entity: "transactions",
      entityId: id,
      action: "create",
      payload: {
        id,
        ...input,
        category_id: categoryId,
        merchant,
        payment_mode: paymentMode,
        reference_number: referenceNumber,
        source,
        external_ref: externalRef,
        status,
        created_at: now,
        updated_at: now,
      },
    });

    return transactionRepo.findById(id);
  },

  update: async (id: string, patch: Partial<TransactionInput>): Promise<void> => {
    const db = await getRequiredDb();
    const ext = transactionInputExt(patch);
    const current = await db.getFirstAsync<TransactionPersistenceRow>(
      "SELECT * FROM transactions WHERE id = ?",
      [id]
    );
    if (!current) {
      return;
    }

    const now = nowIso();
    const next = {
      amount: patch.amount ?? current.amount,
      type: patch.type ?? current.type,
      category_id: patch.category_id ?? ext.categoryId ?? current.category_id,
      merchant: patch.merchant ?? ext.merchantName ?? current.merchant,
      description: patch.description ?? current.description,
      date: patch.date ?? current.date,
      payment_mode: patch.payment_mode ?? ext.paymentMethod ?? current.payment_mode,
      bank_id: ext.bankId ?? current.bank_id ?? null,
      account_id: ext.accountId ?? current.account_id ?? null,
      bank_name: ext.bankName ?? current.bank_name,
      account_number: ext.accountName ?? current.account_number,
      reference_number: patch.reference_number ?? ext.referenceNumber ?? current.reference_number,
      source: patch.source ?? current.source,
      external_ref: ext.externalSourceId ?? patch.sourceId ?? current.external_ref ?? null,
      status: ext.transactionStatus ?? (current.status as TransactionStatus | string),
      notes: patch.notes ?? current.notes,
      tags: toTagsValue(patch.tags ?? current.tags),
    };

    await db.runAsync(
      `UPDATE transactions
       SET amount = ?, type = ?, category_id = ?, merchant = ?, description = ?, date = ?, payment_mode = ?,
           bank_id = ?, account_id = ?, bank_name = ?, account_number = ?, reference_number = ?,
           source = ?, external_ref = ?, status = ?, notes = ?, tags = ?, updated_at = ?
       WHERE id = ?`,
      [
        next.amount,
        next.type,
        next.category_id,
        next.merchant,
        next.description,
        next.date,
        next.payment_mode,
        next.bank_id,
        next.account_id,
        next.bank_name,
        next.account_number,
        next.reference_number,
        next.source,
        next.external_ref,
        next.status,
        next.notes,
        next.tags,
        now,
        id,
      ]
    );

    await enqueueSyncOperation(db, {
      entity: "transactions",
      entityId: id,
      action: "update",
      payload: { id, ...next, updated_at: now },
    });
  },

  delete: async (id: string): Promise<void> => {
    const db = await getRequiredDb();
    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);

    await enqueueSyncOperation(db, {
      entity: "transactions",
      entityId: id,
      action: "delete",
      payload: { id },
    });
  },

  findById: async (id: string): Promise<Transaction | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<TransactionPersistenceRow>(
      "SELECT * FROM transactions WHERE id = ?",
      [id]
    );
    return mapRowToTransaction(row);
  },

  findByUUID: async (uuid: string): Promise<Transaction | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<TransactionPersistenceRow>(
      "SELECT * FROM transactions WHERE id = ? OR external_ref = ? ORDER BY created_at DESC LIMIT 1",
      [uuid, uuid]
    );
    return mapRowToTransaction(row);
  },

  findAll: async (opts?: TransactionListOptions): Promise<Transaction[]> => {
    const db = await getRequiredDb();
    const query = buildFindAllQuery(opts);
    const rows = await db.getAllAsync<TransactionPersistenceRow>(query.sql, query.params);
    return mapRowsToTransactions(rows);
  },

  findByDateRange: async (from: string, to: string): Promise<Transaction[]> =>
    transactionRepo.findAll({ from, to }),

  findByMerchant: async (merchant: string): Promise<Transaction[]> =>
    transactionRepo.findAll({ search: merchant }),

  findByCategory: async (categoryId: string): Promise<Transaction[]> =>
    transactionRepo.findAll({ categoryId }),

  findByBank: async (bankId: string): Promise<Transaction[]> =>
    transactionRepo.findAll({ bankId }),

  findByAccount: async (accountId: string): Promise<Transaction[]> =>
    transactionRepo.findAll({ accountId }),

  search: async (query: string, limit = 100): Promise<Transaction[]> =>
    transactionRepo.findAll({ search: query, limit }),

  exists: async (idOrUuid: string): Promise<boolean> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM transactions WHERE id = ? OR external_ref = ?",
      [idOrUuid, idOrUuid]
    );
    return (row?.count ?? 0) > 0;
  },

  count: async (opts?: Omit<TransactionListOptions, "limit" | "offset">): Promise<number> => {
    const db = await getRequiredDb();
    const query = buildFindAllQuery(opts);
    const countSql = query.sql
      .replace("SELECT *", "SELECT COUNT(*) as count")
      .replace(/ORDER BY[\s\S]*$/, "");
    const row = await db.getFirstAsync<{ count: number }>(countSql, query.params);
    return row?.count ?? 0;
  },

  findPossibleDuplicate: async (
    lookup: DuplicateLookup
  ): Promise<Transaction | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<TransactionPersistenceRow>(
      `SELECT * FROM transactions
       WHERE amount = ? AND type = ? AND date = ?
         AND (? IS NULL OR id != ?)
         AND (? IS NULL OR reference_number = ?)
       ORDER BY created_at DESC
       LIMIT 1`,
      [
        lookup.amount,
        lookup.type,
        lookup.date,
        lookup.excludeId ?? null,
        lookup.excludeId ?? null,
        lookup.referenceNumber ?? null,
        lookup.referenceNumber ?? null,
      ]
    );
    return mapRowToTransaction(row);
  },

  // Backward-compatible aliases for current providers/services.
  list: async (opts?: TransactionListOptions): Promise<Transaction[]> =>
    transactionRepo.findAll(opts),

  get: async (id: string): Promise<Transaction | null> => transactionRepo.findById(id),

  remove: async (id: string): Promise<void> => transactionRepo.delete(id),

  clearAll: async (): Promise<void> => {
    const db = await getRequiredDb();
    await db.runAsync("DELETE FROM transactions");

    await enqueueSyncOperation(db, {
      entity: "transactions",
      entityId: "*",
      action: "delete",
      payload: { scope: "all" },
    });
  },

  totalsBetween: async (
    from: string,
    to: string
  ): Promise<{ income: number; expense: number }> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE date >= ? AND date <= ?`,
      [from, to]
    );
    return { income: row?.income ?? 0, expense: row?.expense ?? 0 };
  },

  categoryBreakdown: async (
    from: string,
    to: string,
    type: TxnType
  ): Promise<Array<{ category_id: string | null; name: string; color: string; icon: string; total: number }>> => {
    const db = await getRequiredDb();
    return db.getAllAsync<{
      category_id: string | null;
      name: string;
      color: string;
      icon: string;
      total: number;
    }>(
      `SELECT t.category_id, COALESCE(c.name, 'Uncategorized') as name,
              COALESCE(c.color, '#8C7366') as color,
              COALESCE(c.icon, 'circle') as icon,
              SUM(t.amount) as total
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.type = ? AND t.date >= ? AND t.date <= ?
       GROUP BY t.category_id
       ORDER BY total DESC`,
      [type, from, to]
    );
  },

  topMerchants: async (
    from: string,
    to: string,
    limit = 5
  ): Promise<Array<{ merchant: string; total: number; count: number }>> => {
    const db = await getRequiredDb();
    return db.getAllAsync<{ merchant: string; total: number; count: number }>(
      `SELECT COALESCE(merchant, 'Unknown') as merchant, SUM(amount) as total, COUNT(*) as count
       FROM transactions
       WHERE type='debit' AND date >= ? AND date <= ? AND merchant IS NOT NULL AND merchant != ''
       GROUP BY merchant
       ORDER BY total DESC
       LIMIT ?`,
      [from, to, limit]
    );
  },

  dailySeries: async (
    from: string,
    to: string
  ): Promise<Array<{ date: string; income: number; expense: number }>> => {
    const db = await getRequiredDb();
    return db.getAllAsync<{ date: string; income: number; expense: number }>(
      `SELECT substr(date, 1, 10) as date,
              COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) as income,
              COALESCE(SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END), 0) as expense
       FROM transactions
       WHERE date >= ? AND date <= ?
       GROUP BY substr(date, 1, 10)
       ORDER BY date ASC`,
      [from, to]
    );
  },
};
