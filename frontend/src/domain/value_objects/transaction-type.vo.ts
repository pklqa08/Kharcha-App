export type TxnType = "debit" | "credit";

export const TRANSACTION_TYPES: TxnType[] = ["debit", "credit"];

export const isTxnType = (value: string): value is TxnType =>
  TRANSACTION_TYPES.includes(value as TxnType);
