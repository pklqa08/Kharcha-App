export interface SearchCriteria {
  keyword?: string;
  merchantId?: string;
  categoryId?: string;
  bankId?: string;
  accountId?: string;
  transactionType?: "debit" | "credit";
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}
