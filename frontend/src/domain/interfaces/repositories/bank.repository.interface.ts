export interface Bank {
  id: string;
  name: string;
  shortCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankCreateInput {
  name: string;
  shortCode?: string | null;
}

export type BankUpdateInput = Partial<Pick<Bank, "name" | "shortCode">>;

export interface IBankRepository {
  list(): Promise<Bank[]>;
  get(id: string): Promise<Bank | null>;
  create(input: BankCreateInput): Promise<Bank | null>;
  update(id: string, patch: BankUpdateInput): Promise<void>;
  remove(id: string): Promise<void>;
}