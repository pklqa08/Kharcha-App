import * as SQLite from "expo-sqlite";

import { getDb } from "@/src/infrastructure/database/db";

export type SyncOperation = "create" | "update" | "delete";
export type SyncEntity =
  | "settings"
  | "transaction_sources"
  | "banks"
  | "accounts"
  | "upis"
  | "merchants"
  | "categories"
  | "transactions"
  | "budgets"
  | "rules"
  | "duplicate_logs"
  | "notifications"
  | "sms_messages"
  | "analytics_cache";

export interface SyncOutboxRow {
  id: string;
  entity: SyncEntity;
  entity_id: string;
  operation: SyncOperation;
  payload: string;
  created_at: string;
  synced_at: string | null;
}

export const getRequiredDb = async (): Promise<SQLite.SQLiteDatabase> => {
  const db = await getDb();
  if (db) {
    return db;
  }

  const retried = await getDb();
  if (retried) {
    return retried;
  }

  throw new Error("SQLite database is not available");
};

export const enqueueSyncOperation = async (
  db: SQLite.SQLiteDatabase,
  operation: {
    entity: SyncEntity;
    entityId: string;
    action: SyncOperation;
    payload: unknown;
  }
): Promise<void> => {
  const now = new Date().toISOString();
  const outboxId = `${operation.entity}_${operation.entityId}_${now}`;
  await db.runAsync(
    `INSERT INTO sync_outbox (id, entity, entity_id, operation, payload, created_at, synced_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [outboxId, operation.entity, operation.entityId, operation.action, JSON.stringify(operation.payload), now]
  );
};
