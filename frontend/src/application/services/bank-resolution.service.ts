import {
  Bank,
  IBankRepository,
} from "@/src/domain/interfaces/repositories/bank.repository.interface";
import { normalizeBankName } from "@/src/domain/services/bank-normalization";

export interface BankResolutionService {
  resolve(bankText: string | null | undefined): Promise<Bank | null>;
}

export const createBankResolutionService = (
  bankRepository: IBankRepository
): BankResolutionService => ({
  resolve: async (bankText: string | null | undefined): Promise<Bank | null> => {
    const normalizedInput = normalizeBankName(bankText);

    if (!normalizedInput.normalizedName) {
      return null;
    }

    const existingBanks = await bankRepository.list();
    for (const bank of existingBanks) {
      const normalizedExisting = normalizeBankName(bank.name);
      if (normalizedExisting.normalizedName === normalizedInput.normalizedName) {
        return bank;
      }
    }

    return bankRepository.create({
      name: normalizedInput.normalizedName,
      shortCode: null,
    });
  },
});