export type TxnType = "debit" | "credit";
export type CategoryType = "expense" | "income";
export type PaymentMode = "cash" | "upi" | "card" | "netbanking" | "wallet" | "other";

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  is_custom: number;
  sort_order: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TxnType;
  category_id: string | null;
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
  status: string;
}

export interface TransactionInput {
  amount: number;
  type: TxnType;
  category_id: string | null;
  merchant?: string | null;
  description?: string | null;
  date: string;
  payment_mode?: PaymentMode | null;
  notes?: string | null;
  tags?: string | null;
  upi_id?: string | null;
  reference_number?: string | null;
}

export interface Budget {
  id: string;
  category_id: string | null;
  amount: number;
  period: string;
  created_at: string;
}
