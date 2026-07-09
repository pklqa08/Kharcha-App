import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

const openTimeoutMs = 8000;

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p, new Promise<null>((res) => setTimeout(() => res(null), ms))]);

export const getDb = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (_db) return _db;

  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        const opened =
          Platform.OS === "web"
            ? await SQLite.openDatabaseAsync("kharcha.db")
            : await withTimeout(SQLite.openDatabaseAsync("kharcha.db"), openTimeoutMs);
        if (!opened) return null;

        _db = opened as SQLite.SQLiteDatabase;
        await migrate(_db);
        return _db;
      } catch (error) {
        console.error("[db] Failed to initialize SQLite", error);
        return null;
      } finally {
        // Allow callers to retry initialization after transient failures.
        if (!_db) {
          _initPromise = null;
        }
      }
    })();
  }

  return _initPromise;
};

const migrate = async (db: SQLite.SQLiteDatabase) => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);
  } catch {
    // Some web/embedded sqlite engines do not support WAL mode.
    await db.execAsync("PRAGMA foreign_keys = ON;");
  }

  const versionRow = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < 1) {
    await migrationV1(db);
  }
  if (currentVersion < 2) {
    await migrationV2(db);
  }
  if (currentVersion < 3) {
    await migrationV3(db);
  }

  await seedTransactionSources(db);
  await seedCategories(db);
};

const migrationV1 = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS transaction_sources (
      id TEXT PRIMARY KEY NOT NULL,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      parser_version TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      short_code TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      bank_id TEXT,
      label TEXT NOT NULL,
      account_number TEXT,
      account_masked TEXT,
      account_type TEXT,
      holder_name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS upis (
      id TEXT PRIMARY KEY NOT NULL,
      upi_handle TEXT NOT NULL UNIQUE,
      account_id TEXT,
      provider TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY NOT NULL,
      canonical_name TEXT NOT NULL UNIQUE,
      display_name TEXT,
      category_hint_id TEXT,
      confidence REAL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (category_hint_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id TEXT,
      merchant_id TEXT,
      merchant TEXT,
      description TEXT,
      date TEXT NOT NULL,
      payment_mode TEXT,
      bank_id TEXT,
      account_id TEXT,
      upi_ref_id TEXT,
      bank_name TEXT,
      account_number TEXT,
      upi_id TEXT,
      reference_number TEXT,
      utr TEXT,
      rrn TEXT,
      transaction_source_id TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      external_ref TEXT,
      fingerprint TEXT,
      is_duplicate INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      tags TEXT,
      notes TEXT,
      attachment TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (upi_ref_id) REFERENCES upis(id) ON DELETE SET NULL,
      FOREIGN KEY (transaction_source_id) REFERENCES transaction_sources(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT,
      amount REAL NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      start_date TEXT,
      end_date TEXT,
      rollover INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rules (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      source_kind TEXT,
      pattern_json TEXT NOT NULL,
      action_json TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 100,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS duplicate_logs (
      id TEXT PRIMARY KEY NOT NULL,
      transaction_id TEXT,
      matched_transaction_id TEXT,
      score REAL NOT NULL,
      decision TEXT NOT NULL,
      reason TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
      FOREIGN KEY (matched_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY NOT NULL,
      provider TEXT,
      title TEXT,
      body TEXT NOT NULL,
      payload_json TEXT,
      status TEXT NOT NULL DEFAULT 'received',
      transaction_id TEXT,
      received_at TEXT NOT NULL,
      processed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sms_messages (
      id TEXT PRIMARY KEY NOT NULL,
      sender TEXT,
      body TEXT NOT NULL,
      received_at TEXT NOT NULL,
      parse_status TEXT NOT NULL DEFAULT 'pending',
      is_parsed INTEGER NOT NULL DEFAULT 0,
      linked_transaction_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (linked_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS analytics_cache (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_outbox (
      id TEXT PRIMARY KEY NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced_at TEXT
    );

    PRAGMA user_version = 1;
  `);
};

const migrationV2 = async (db: SQLite.SQLiteDatabase) => {
  // Legacy compatibility migration: rebuild transactions table with foreign keys if old schema is detected.
  const hasLegacyTransactions = await tableExists(db, "transactions");
  if (!hasLegacyTransactions) {
    await db.execAsync("PRAGMA user_version = 2;");
    return;
  }

  const hasSourceId = await columnExists(db, "transactions", "transaction_source_id");
  if (hasSourceId) {
    await db.execAsync("PRAGMA user_version = 2;");
    return;
  }

  await db.execAsync(`
    PRAGMA foreign_keys = OFF;

    CREATE TABLE IF NOT EXISTS transactions_v2 (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id TEXT,
      merchant_id TEXT,
      merchant TEXT,
      description TEXT,
      date TEXT NOT NULL,
      payment_mode TEXT,
      bank_id TEXT,
      account_id TEXT,
      upi_ref_id TEXT,
      bank_name TEXT,
      account_number TEXT,
      upi_id TEXT,
      reference_number TEXT,
      utr TEXT,
      rrn TEXT,
      transaction_source_id TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      external_ref TEXT,
      fingerprint TEXT,
      is_duplicate INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      tags TEXT,
      notes TEXT,
      attachment TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL,
      FOREIGN KEY (upi_ref_id) REFERENCES upis(id) ON DELETE SET NULL,
      FOREIGN KEY (transaction_source_id) REFERENCES transaction_sources(id) ON DELETE SET NULL
    );

    INSERT INTO transactions_v2 (
      id, amount, type, category_id, merchant, description, date, payment_mode,
      bank_name, account_number, upi_id, reference_number, utr, rrn,
      source, created_at, updated_at, tags, notes, attachment, status
    )
    SELECT
      id, amount, type, category_id, merchant, description, date, payment_mode,
      bank_name, account_number, upi_id, reference_number, utr, rrn,
      source, created_at, updated_at, tags, notes, attachment, status
    FROM transactions;

    DROP TABLE transactions;
    ALTER TABLE transactions_v2 RENAME TO transactions;

    PRAGMA foreign_keys = ON;
    PRAGMA user_version = 2;
  `);
};

const migrationV3 = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category_id);
    CREATE INDEX IF NOT EXISTS idx_txn_merchant_id ON transactions(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_txn_source_id ON transactions(transaction_source_id);
    CREATE INDEX IF NOT EXISTS idx_txn_account_id ON transactions(account_id);
    CREATE INDEX IF NOT EXISTS idx_txn_upi_ref_id ON transactions(upi_ref_id);
    CREATE INDEX IF NOT EXISTS idx_txn_fingerprint ON transactions(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_txn_type_date ON transactions(type, date DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_txn_source_external_ref
      ON transactions(transaction_source_id, external_ref)
      WHERE external_ref IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_accounts_bank_id ON accounts(bank_id);
    CREATE INDEX IF NOT EXISTS idx_upis_account_id ON upis(account_id);
    CREATE INDEX IF NOT EXISTS idx_merchants_category_hint_id ON merchants(category_hint_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_category_period ON budgets(category_id, period);
    CREATE INDEX IF NOT EXISTS idx_rules_enabled_priority ON rules(is_enabled, priority);
    CREATE INDEX IF NOT EXISTS idx_duplicate_logs_txn ON duplicate_logs(transaction_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_notifications_status_received ON notifications(status, received_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sms_received_status ON sms_messages(received_at DESC, parse_status);
    CREATE INDEX IF NOT EXISTS idx_sync_outbox_unsynced ON sync_outbox(synced_at, created_at);

    PRAGMA user_version = 3;
  `);

  await db.runAsync(
    `UPDATE transactions
     SET transaction_source_id = (
       SELECT ts.id FROM transaction_sources ts WHERE ts.code = transactions.source LIMIT 1
     )
     WHERE transaction_source_id IS NULL`
  );
};

const tableExists = async (db: SQLite.SQLiteDatabase, tableName: string): Promise<boolean> => {
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sqlite_master WHERE type = 'table' AND name = ?",
    [tableName]
  );
  return (row?.count ?? 0) > 0;
};

const columnExists = async (
  db: SQLite.SQLiteDatabase,
  tableName: string,
  columnName: string
): Promise<boolean> => {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName})`);
  return columns.some((c) => c.name === columnName);
};

const DEFAULT_CATEGORIES: Array<{ name: string; type: "expense" | "income"; icon: string; color: string }> = [
  // Expense
  { name: "Food & Dining", type: "expense", icon: "coffee", color: "#FF6B35" },
  { name: "Groceries", type: "expense", icon: "shopping-cart", color: "#00B359" },
  { name: "Transport", type: "expense", icon: "truck", color: "#4A90E2" },
  { name: "Shopping", type: "expense", icon: "shopping-bag", color: "#E91E63" },
  { name: "Entertainment", type: "expense", icon: "film", color: "#9C27B0" },
  { name: "Bills & Utilities", type: "expense", icon: "zap", color: "#FFC200" },
  { name: "Health", type: "expense", icon: "heart", color: "#F44336" },
  { name: "Education", type: "expense", icon: "book", color: "#3F51B5" },
  { name: "Rent", type: "expense", icon: "home", color: "#795548" },
  { name: "Travel", type: "expense", icon: "map", color: "#009688" },
  { name: "Fuel", type: "expense", icon: "droplet", color: "#607D8B" },
  { name: "Other", type: "expense", icon: "more-horizontal", color: "#8C7366" },
  // Income
  { name: "Salary", type: "income", icon: "briefcase", color: "#00B359" },
  { name: "Business", type: "income", icon: "trending-up", color: "#FF5E00" },
  { name: "Investments", type: "income", icon: "activity", color: "#4A90E2" },
  { name: "Freelance", type: "income", icon: "edit", color: "#9C27B0" },
  { name: "Gifts", type: "income", icon: "gift", color: "#E91E63" },
  { name: "Other Income", type: "income", icon: "plus-circle", color: "#607D8B" },
];

const seedCategories = async (db: SQLite.SQLiteDatabase) => {
  const row = await db.getFirstAsync<{ count: number }>("SELECT COUNT(*) as count FROM categories");
  if (row && row.count > 0) return;
  const stmt = await db.prepareAsync(
    "INSERT INTO categories (id, name, type, icon, color, is_custom, sort_order) VALUES (?, ?, ?, ?, ?, 0, ?)"
  );
  try {
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      const c = DEFAULT_CATEGORIES[i];
      await stmt.executeAsync([`cat_${i}`, c.name, c.type, c.icon, c.color, i]);
    }
  } finally {
    await stmt.finalizeAsync();
  }
};

const DEFAULT_TRANSACTION_SOURCES: Array<{ code: string; name: string; sourceType: string; status: string }> = [
  { code: "manual", name: "Manual Entry", sourceType: "manual", status: "active" },
  { code: "sms", name: "SMS", sourceType: "sms", status: "planned" },
  { code: "notification", name: "Notification", sourceType: "notification", status: "planned" },
  { code: "csv", name: "CSV Import", sourceType: "csv", status: "planned" },
  { code: "pdf", name: "PDF Import", sourceType: "pdf", status: "planned" },
  { code: "api", name: "Future APIs", sourceType: "api", status: "planned" },
  { code: "cloud", name: "Cloud Sync", sourceType: "cloud", status: "planned" },
];

const seedTransactionSources = async (db: SQLite.SQLiteDatabase) => {
  const exists = await tableExists(db, "transaction_sources");
  if (!exists) return;

  const now = new Date().toISOString();
  const stmt = await db.prepareAsync(
    `INSERT OR IGNORE INTO transaction_sources
      (id, code, name, source_type, status, parser_version, metadata, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)`
  );

  try {
    for (const source of DEFAULT_TRANSACTION_SOURCES) {
      await stmt.executeAsync([
        `src_${source.code}`,
        source.code,
        source.name,
        source.sourceType,
        source.status,
        now,
        now,
      ]);
    }
  } finally {
    await stmt.finalizeAsync();
  }
};

// utility to generate ids
export const uid = (): string => {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};
