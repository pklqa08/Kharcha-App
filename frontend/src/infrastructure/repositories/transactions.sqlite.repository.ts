import {
  Transaction,
  TransactionInput,
  TxnType,
} from "@/src/domain/entities/models";
import {
  enqueueSyncOperation,
  getRequiredDb,
} from "@/src/infrastructure/repositories/sqlite.helpers";

export const transactionRepo = {
  list: async (opts?: {
    search?: string;
    type?: TxnType;
    categoryId?: string;
    from?: string;
    to?: string;
    limit?: number;
  }): Promise<Transaction[]> => {
    const db = await getRequiredDb();
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
    if (opts?.from) {
      clauses.push("date >= ?");
      params.push(opts.from);
    }
    if (opts?.to) {
      clauses.push("date <= ?");
      params.push(opts.to);
    }
    if (opts?.search) {
      clauses.push("(merchant LIKE ? OR description LIKE ? OR notes LIKE ?)");
      const q = `%${opts.search}%`;
      params.push(q, q, q);
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = opts?.limit ? `LIMIT ${opts.limit}` : "";

    return db.getAllAsync<Transaction>(
      `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC ${limit}`,
      params
    );
  },

  get: async (id: string): Promise<Transaction | null> => {
    const db = await getRequiredDb();
    const row = await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ?",
      [id]
    );
    return row ?? null;
  },

  create: async (input: TransactionInput): Promise<Transaction | null> => {
    const db = await getRequiredDb();
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO transactions
       (id, amount, type, category_id, merchant, description, date, payment_mode,
        bank_name, account_number, upi_id, reference_number, utr, rrn,
        source, created_at, updated_at, tags, notes, attachment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, NULL, NULL, 'manual', ?, ?, ?, ?, NULL, 'completed')`,
      [
        id,
        input.amount,
        input.type,
        input.category_id,
        input.merchant ?? null,
        input.description ?? null,
        input.date,
        input.payment_mode ?? null,
        input.upi_id ?? null,
        input.reference_number ?? null,
        now,
        now,
        input.tags ?? null,
        input.notes ?? null,
      ]
    );

    await enqueueSyncOperation(db, {
      entity: "transactions",
      entityId: id,
      action: "create",
      payload: { id, ...input, created_at: now, updated_at: now },
    });

    const row = await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ?",
      [id]
    );
    return row ?? null;
  },

  update: async (id: string, patch: Partial<TransactionInput>): Promise<void> => {
    const db = await getRequiredDb();
    const current = await db.getFirstAsync<Transaction>(
      "SELECT * FROM transactions WHERE id = ?",
      [id]
    );
    if (!current) {
      return;
    }

    const now = new Date().toISOString();
    const next = {
      amount: patch.amount ?? current.amount,
      type: patch.type ?? current.type,
      category_id: patch.category_id ?? current.category_id,
      merchant: patch.merchant ?? current.merchant,
      description: patch.description ?? current.description,
      date: patch.date ?? current.date,
      payment_mode: patch.payment_mode ?? current.payment_mode,
      notes: patch.notes ?? current.notes,
      tags: patch.tags ?? current.tags,
    };

    await db.runAsync(
      `UPDATE transactions
       SET amount = ?, type = ?, category_id = ?, merchant = ?, description = ?, date = ?, payment_mode = ?, notes = ?, tags = ?, updated_at = ?
       WHERE id = ?`,
      [
        next.amount,
        next.type,
        next.category_id,
        next.merchant,
        next.description,
        next.date,
        next.payment_mode,
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

  remove: async (id: string): Promise<void> => {
    const db = await getRequiredDb();
    await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);

    await enqueueSyncOperation(db, {
      entity: "transactions",
      entityId: id,
      action: "delete",
      payload: { id },
    });
  },

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
