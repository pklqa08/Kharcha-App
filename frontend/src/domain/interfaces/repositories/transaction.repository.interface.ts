import { Transaction, TransactionInput } from "@/src/domain/entities/models";

export interface TransactionFindOptions {
  search?: string;
  type?: "debit" | "credit";
  categoryId?: string;
  merchantId?: string;
  bankId?: string;
  accountId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionSearchCriteria {
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
  limit?: number;
  offset?: number;
}

export interface TransactionDuplicateLookup {
  amount: number;
  type: "debit" | "credit";
  date: string;
  referenceNumber?: string | null;
  excludeId?: string;
}

export interface ITransactionRepository {
  create(input: TransactionInput): Promise<Transaction | null>;
  update(id: string, patch: Partial<TransactionInput>): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findByUUID(uuid: string): Promise<Transaction | null>;
  findAll(opts?: TransactionFindOptions): Promise<Transaction[]>;
  findByDateRange(from: string, to: string): Promise<Transaction[]>;
  findByMerchant(merchant: string): Promise<Transaction[]>;
  findByCategory(categoryId: string): Promise<Transaction[]>;
  findByBank(bankId: string): Promise<Transaction[]>;
  findByAccount(accountId: string): Promise<Transaction[]>;
  search(criteria: TransactionSearchCriteria): Promise<Transaction[]>;
  exists(idOrUuid: string): Promise<boolean>;
  count(opts?: Omit<TransactionFindOptions, "limit" | "offset">): Promise<number>;
  findPossibleDuplicate(lookup: TransactionDuplicateLookup): Promise<Transaction | null>;

  // Backward-compatible method aliases used in current app code.
  list(opts?: TransactionFindOptions): Promise<Transaction[]>;
  get(id: string): Promise<Transaction | null>;
  remove(id: string): Promise<void>;
  clearAll(): Promise<void>;
}
