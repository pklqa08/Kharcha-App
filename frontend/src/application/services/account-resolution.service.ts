import {
  Account,
  IAccountRepository,
} from "@/src/domain/interfaces/repositories/account.repository.interface";
import { normalizeAccountName } from "@/src/domain/services/account-normalization";

export interface AccountResolutionService {
  resolve(accountText: string | null | undefined): Promise<Account | null>;
}

export const createAccountResolutionService = (
  accountRepository: IAccountRepository
): AccountResolutionService => ({
  resolve: async (accountText: string | null | undefined): Promise<Account | null> => {
    const normalizedInput = normalizeAccountName(accountText);

    if (!normalizedInput.normalizedName) {
      return null;
    }

    const existingAccounts = await accountRepository.list();
    for (const account of existingAccounts) {
      const normalizedExisting = normalizeAccountName(account.label);
      if (normalizedExisting.normalizedName === normalizedInput.normalizedName) {
        return account;
      }
    }

    return accountRepository.create({
      label: normalizedInput.normalizedName,
    });
  },
});