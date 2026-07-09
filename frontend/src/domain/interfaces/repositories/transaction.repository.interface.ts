import { Transaction, TransactionInput } from "@/src/domain/entities/models";

export interface ITransactionRepository {
  get(id: string): Promise<Transaction | null>;
  create(input: TransactionInput): Promise<Transaction | null>;
  update(id: string, patch: Partial<TransactionInput>): Promise<void>;
  remove(id: string): Promise<void>;
  clearAll(): Promise<void>;
}
