import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

let _db: SQLite.SQLiteDatabase | null = null;
let _initPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([p, new Promise<null>((res) => setTimeout(() => res(null), ms))]);

export const getDb = async (): Promise<SQLite.SQLiteDatabase | null> => {
  if (_db) return _db;
  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        const opened = await withTimeout(SQLite.openDatabaseAsync("kharcha.db"), Platform.OS === "web" ? 1500 : 8000);
        if (!opened) return null;
        _db = opened as SQLite.SQLiteDatabase;
        await migrate(_db);
        return _db;
      } catch {
        return null;
      }
    })();
  }
  return _initPromise;
};

const migrate = async (db: SQLite.SQLiteDatabase) => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,          -- 'expense' | 'income'
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_custom INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banks (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY NOT NULL,
      bank_id TEXT,
      label TEXT NOT NULL,
      account_number TEXT,
      FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,          -- 'debit' | 'credit'
      category_id TEXT,
      merchant TEXT,
      description TEXT,
      date TEXT NOT NULL,          -- ISO string
      payment_mode TEXT,           -- 'cash' | 'upi' | 'card' | 'netbanking' | 'wallet' | 'other'
      bank_name TEXT,
      account_number TEXT,
      upi_id TEXT,
      reference_number TEXT,
      utr TEXT,
      rrn TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      tags TEXT,
      notes TEXT,
      attachment TEXT,
      status TEXT NOT NULL DEFAULT 'completed',
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category_id);

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY NOT NULL,
      category_id TEXT,
      amount REAL NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS analytics_cache (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await seedCategories(db);
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

// utility to generate ids
export const uid = (): string => {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
};
