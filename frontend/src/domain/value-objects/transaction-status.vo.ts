export type TransactionStatus = "completed" | "pending" | "failed";

export const TRANSACTION_STATUSES: TransactionStatus[] = ["completed", "pending", "failed"];

export const isTransactionStatus = (value: string): value is TransactionStatus =>
  TRANSACTION_STATUSES.includes(value as TransactionStatus);
