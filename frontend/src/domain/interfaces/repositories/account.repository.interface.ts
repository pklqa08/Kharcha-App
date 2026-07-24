export interface Account {
  id: string;
  bankId?: string | null;
  label: string;
  accountNumber?: string | null;
  accountMasked?: string | null;
  accountType?: string | null;
  holderName?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccountCreateInput {
  bankId?: string | null;
  label: string;
  accountNumber?: string | null;
  accountMasked?: string | null;
  accountType?: string | null;
  holderName?: string | null;
  isActive?: boolean;
}

export type AccountUpdateInput = Partial<
  Pick<
    Account,
    "bankId" | "label" | "accountNumber" | "accountMasked" | "accountType" | "holderName" | "isActive"
  >
>;

export interface IAccountRepository {
  list(): Promise<Account[]>;
  get(id: string): Promise<Account | null>;
  create(input: AccountCreateInput): Promise<Account | null>;
  update(id: string, patch: AccountUpdateInput): Promise<void>;
  remove(id: string): Promise<void>;
}