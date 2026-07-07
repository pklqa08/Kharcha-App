import { getDb, uid } from "./db";
import { Category, Transaction, TransactionInput, TxnType, Budget } from "./models";

const db = () => getDb();

/* ============ Settings ============ */
export const settingsRepo = {
  get: async (key: string): Promise<string | null> => {
    const d = await db(); if (!d) return null;
    const row = await d.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
    return row?.value ?? null;
  },
  set: async (key: string, value: string): Promise<void> => {
    const d = await db(); if (!d) return;
    await d.runAsync("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
  },
  delete: async (key: string): Promise<void> => {
    const d = await db(); if (!d) return;
    await d.runAsync("DELETE FROM settings WHERE key = ?", [key]);
  },
};

/* ============ Categories ============ */
export const categoryRepo = {
  list: async (type?: "expense" | "income"): Promise<Category[]> => {
    const d = await db(); if (!d) return [];
    if (type) {
      return await d.getAllAsync<Category>("SELECT * FROM categories WHERE type = ? ORDER BY sort_order ASC, name ASC", [type]);
    }
    return await d.getAllAsync<Category>("SELECT * FROM categories ORDER BY type, sort_order, name");
  },
  get: async (id: string): Promise<Category | null> => {
    const d = await db(); if (!d) return null;
    return (await d.getFirstAsync<Category>("SELECT * FROM categories WHERE id = ?", [id])) ?? null;
  },
  create: async (name: string, type: "expense" | "income", icon: string, color: string): Promise<Category | null> => {
    const d = await db(); if (!d) return null;
    const id = uid();
    await d.runAsync(
      "INSERT INTO categories (id, name, type, icon, color, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, 1, 999)",
      [id, name, type, icon, color]
    );
    return await categoryRepo.get(id);
  },
  update: async (id: string, patch: Partial<Pick<Category, "name" | "icon" | "color">>) => {
    const d = await db(); if (!d) return;
    const cur = await categoryRepo.get(id);
    if (!cur) return;
    await d.runAsync("UPDATE categories SET name=?, icon=?, color=? WHERE id=?", [
      patch.name ?? cur.name,
      patch.icon ?? cur.icon,
      patch.color ?? cur.color,
      id,
    ]);
  },
  remove: async (id: string) => {
    const d = await db(); if (!d) return;
    await d.runAsync("DELETE FROM categories WHERE id = ? AND is_custom = 1", [id]);
  },
};

/* ============ Transactions ============ */
export const transactionRepo = {
  list: async (opts?: { search?: string; type?: TxnType; categoryId?: string; from?: string; to?: string; limit?: number }): Promise<Transaction[]> => {
    const d = await db(); if (!d) return [];
    const clauses: string[] = [];
    const params: any[] = [];
    if (opts?.type) { clauses.push("type = ?"); params.push(opts.type); }
    if (opts?.categoryId) { clauses.push("category_id = ?"); params.push(opts.categoryId); }
    if (opts?.from) { clauses.push("date >= ?"); params.push(opts.from); }
    if (opts?.to) { clauses.push("date <= ?"); params.push(opts.to); }
    if (opts?.search) {
      clauses.push("(merchant LIKE ? OR description LIKE ? OR notes LIKE ?)");
      const q = `%${opts.search}%`;
      params.push(q, q, q);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = opts?.limit ? `LIMIT ${opts.limit}` : "";
    return await d.getAllAsync<Transaction>(
      `SELECT * FROM transactions ${where} ORDER BY date DESC, created_at DESC ${limit}`,
      params
    );
  },
  get: async (id: string): Promise<Transaction | null> => {
    const d = await db(); if (!d) return null;
    return (await d.getFirstAsync<Transaction>("SELECT * FROM transactions WHERE id = ?", [id])) ?? null;
  },
  create: async (input: TransactionInput): Promise<Transaction | null> => {
    const d = await db(); if (!d) return null;
    const id = uid();
    const now = new Date().toISOString();
    await d.runAsync(
      `INSERT INTO transactions
       (id, amount, type, category_id, merchant, description, date, payment_mode,
        bank_name, account_number, upi_id, reference_number, utr, rrn,
        source, created_at, updated_at, tags, notes, attachment, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, NULL, NULL, 'manual', ?, ?, ?, ?, NULL, 'completed')`,
      [
        id, input.amount, input.type,
        input.category_id, input.merchant ?? null, input.description ?? null,
        input.date, input.payment_mode ?? null,
        input.upi_id ?? null, input.reference_number ?? null,
        now, now, input.tags ?? null, input.notes ?? null,
      ]
    );
    return await transactionRepo.get(id);
  },
  update: async (id: string, patch: Partial<TransactionInput>) => {
    const d = await db(); if (!d) return;
    const cur = await transactionRepo.get(id);
    if (!cur) return;
    const now = new Date().toISOString();
    await d.runAsync(
      `UPDATE transactions SET amount=?, type=?, category_id=?, merchant=?, description=?, date=?, payment_mode=?, notes=?, tags=?, updated_at=? WHERE id=?`,
      [
        patch.amount ?? cur.amount,
        patch.type ?? cur.type,
        patch.category_id ?? cur.category_id,
        patch.merchant ?? cur.merchant,
        patch.description ?? cur.description,
        patch.date ?? cur.date,
        patch.payment_mode ?? cur.payment_mode,
        patch.notes ?? cur.notes,
        patch.tags ?? cur.tags,
        now,
        id,
      ]
    );
  },
  remove: async (id: string) => {
    const d = await db(); if (!d) return;
    await d.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
  },
  clearAll: async () => {
    const d = await db(); if (!d) return;
    await d.runAsync("DELETE FROM transactions");
  },
  totalsBetween: async (from: string, to: string): Promise<{ income: number; expense: number }> => {
    const d = await db(); if (!d) return { income: 0, expense: 0 };
    const row = await d.getFirstAsync<{ income: number; expense: number }>(
      `SELECT
        COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END), 0) as expense
       FROM transactions WHERE date >= ? AND date <= ?`,
      [from, to]
    );
    return { income: row?.income ?? 0, expense: row?.expense ?? 0 };
  },
  categoryBreakdown: async (from: string, to: string, type: TxnType): Promise<{ category_id: string | null; name: string; color: string; icon: string; total: number }[]> => {
    const d = await db(); if (!d) return [];
    return await d.getAllAsync<any>(
      `SELECT t.category_id, COALESCE(c.name, 'Uncategorized') as name,
              COALESCE(c.color, '#8C7366') as color,
              COALESCE(c.icon, 'circle') as icon,
              SUM(t.amount) as total
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.type = ? AND t.date >= ? AND t.date <= ?
       GROUP BY t.category_id ORDER BY total DESC`,
      [type, from, to]
    );
  },
  topMerchants: async (from: string, to: string, limit = 5): Promise<{ merchant: string; total: number; count: number }[]> => {
    const d = await db(); if (!d) return [];
    return await d.getAllAsync<any>(
      `SELECT COALESCE(merchant, 'Unknown') as merchant, SUM(amount) as total, COUNT(*) as count
       FROM transactions
       WHERE type='debit' AND date >= ? AND date <= ? AND merchant IS NOT NULL AND merchant != ''
       GROUP BY merchant ORDER BY total DESC LIMIT ?`,
      [from, to, limit]
    );
  },
  dailySeries: async (from: string, to: string): Promise<{ date: string; income: number; expense: number }[]> => {
    const d = await db(); if (!d) return [];
    return await d.getAllAsync<any>(
      `SELECT substr(date, 1, 10) as date,
              COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) as income,
              COALESCE(SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END), 0) as expense
       FROM transactions WHERE date >= ? AND date <= ?
       GROUP BY substr(date, 1, 10)
       ORDER BY date ASC`,
      [from, to]
    );
  },
};

/* ============ Budgets ============ */
export const budgetRepo = {
  list: async (): Promise<Budget[]> => {
    const d = await db(); if (!d) return [];
    return await d.getAllAsync<Budget>("SELECT * FROM budgets ORDER BY created_at DESC");
  },
  create: async (category_id: string | null, amount: number, period = "monthly"): Promise<Budget | null> => {
    const d = await db(); if (!d) return null;
    const id = uid();
    const now = new Date().toISOString();
    await d.runAsync(
      "INSERT INTO budgets (id, category_id, amount, period, created_at) VALUES (?, ?, ?, ?, ?)",
      [id, category_id, amount, period, now]
    );
    return { id, category_id, amount, period, created_at: now };
  },
  remove: async (id: string) => {
    const d = await db(); if (!d) return;
    await d.runAsync("DELETE FROM budgets WHERE id = ?", [id]);
  },
};
