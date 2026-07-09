import {
  CategoryType,
  EntityId,
  Money,
  PaymentMode,
  TransactionStatus,
  TxnType,
} from "../value_objects";

export type { CategoryType, PaymentMode, TxnType };

export interface CategoryEntity {
  id: EntityId;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_custom: number;
  sort_order: number;
}

export interface TransactionEntity {
  id: EntityId;
  amount: Money;
  type: TxnType;
  category_id: EntityId | null;
  merchant: string | null;
  description: string | null;
  date: string;
  payment_mode: PaymentMode | null;
  bank_name: string | null;
  account_number: string | null;
  upi_id: string | null;
  reference_number: string | null;
  utr: string | null;
  rrn: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  tags: string | null;
  notes: string | null;
  attachment: string | null;
  status: TransactionStatus | string;
}

export interface TransactionDraft {
  amount: Money;
  type: TxnType;
  category_id: EntityId | null;
  merchant?: string | null;
  description?: string | null;
  date: string;
  payment_mode?: PaymentMode | null;
  notes?: string | null;
  tags?: string | null;
  upi_id?: string | null;
  reference_number?: string | null;
}

export interface BudgetEntity {
  id: EntityId;
  category_id: EntityId | null;
  amount: Money;
  period: string;
  created_at: string;
}

// Backward-compatible aliases for current app/infrastructure usage.
export type Category = CategoryEntity;
export type Transaction = TransactionEntity;
export type TransactionInput = TransactionDraft;
export type Budget = BudgetEntity;
