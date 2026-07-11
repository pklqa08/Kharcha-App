import {
  CategoryType,
  EntityId,
  Money,
  PaymentMode,
  TransactionStatus,
  TxnType,
} from "../value_objects";

export type { CategoryType, PaymentMode, TxnType };

export type CurrencyCode = "INR" | "USD" | "EUR" | "GBP" | "AED" | "JPY";

export interface CategoryEntity {
  id: EntityId;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_custom: number;
  sort_order: number;
}

export type TransactionSource =
  | "manual"
  | "sms"
  | "notification"
  | "csv"
  | "pdf"
  | "ocr"
  | "api"
  | "cloud";

export type TransactionLifecycleStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "reversed";

export type TransactionProcessingStatus =
  | "pending"
  | "parsed"
  | "categorized"
  | "validated"
  | "duplicated"
  | "synced";

// Universal transaction contract for long-term extensibility.
export interface UniversalTransactionEntity {
  id: EntityId;
  // Stable cross-system identifier for deduplication/correlation.
  // Optional for backward compatibility because existing persisted rows may not have this value.
  uuid?: string;
  amount: Money;
  type: TxnType;
  // Origin channel where this transaction was captured.
  source: TransactionSource;
  // External identifier from upstream systems (SMS/notification/CSV/PDF/OCR/API/cloud).
  externalSourceId?: string | null;
  // Backward-compatible alias for externalSourceId.
  sourceId?: string | null;
  // Business lifecycle state of the transaction.
  transactionStatus?: TransactionStatus;
  // Pipeline processing state after capture.
  processingStatus?: TransactionProcessingStatus;
  paymentMethod?: PaymentMode | null;
  // Normalized merchant identity reference.
  merchantId?: EntityId | null;
  // Temporary display merchant name before merchantId resolution.
  merchantName?: string | null;
  categoryId?: EntityId | null;
  // Temporary display category name before categoryId resolution.
  categoryName?: string | null;
  // Bank identity reference for linked account institutions.
  bankId?: EntityId | null;
  // Temporary display bank name before bankId resolution.
  bankName?: string | null;
  // Account identity reference where the transaction occurred.
  accountId?: EntityId | null;
  // Temporary display account name before accountId resolution.
  accountName?: string | null;
  // Bank or network reference/trace number.
  referenceNumber?: string | null;
  currency: CurrencyCode;
  notes?: string | null;
  tags?: string[] | null;
  // Entity creation timestamp (ISO 8601).
  // Optional for backward compatibility because persisted fields are created_at/updated_at.
  createdAt?: string;
  // Last update timestamp (ISO 8601).
  // Optional for backward compatibility because persisted fields are created_at/updated_at.
  updatedAt?: string;
}

// Legacy persisted fields retained for full backward compatibility.
export interface LegacyTransactionFields {
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

export type TransactionEntity = LegacyTransactionFields & Omit<
  UniversalTransactionEntity,
  "source" | "notes" | "tags" | "currency"
> & {
  // Keep legacy source shape while allowing normalized source as optional metadata.
  source: string;
  currency?: CurrencyCode;
};

export interface TransactionDraft {
  amount: Money;
  type: TxnType;
  uuid?: string;
  source?: TransactionSource;
  sourceId?: string | null;
  transactionStatus?: TransactionStatus;
  paymentMethod?: PaymentMode | null;
  merchantId?: EntityId | null;
  merchantName?: string | null;
  categoryId?: EntityId | null;
  categoryName?: string | null;
  bankId?: EntityId | null;
  bankName?: string | null;
  accountId?: EntityId | null;
  accountName?: string | null;
  referenceNumber?: string | null;
  currency?: CurrencyCode | null;
  createdAt?: string;
  updatedAt?: string;
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
