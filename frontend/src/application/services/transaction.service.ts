import { TransactionInput } from "@/src/domain/entities/models";
import { ITransactionRepository } from "@/src/domain/interfaces/repositories";
import { MerchantResolutionService } from "@/src/application/services/merchant-resolution.service";
import { CategoryResolutionService } from "@/src/application/services/category-resolution.service";
import { BankResolutionService } from "@/src/application/services/bank-resolution.service";
import { AccountResolutionService } from "@/src/application/services/account-resolution.service";

export interface TransactionService {
  save(input: TransactionInput, existingId?: string): Promise<void>;
  deleteById(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export const createTransactionService = (
  transactionRepository: ITransactionRepository,
  merchantResolutionService?: MerchantResolutionService,
  categoryResolutionService?: CategoryResolutionService,
  bankResolutionService?: BankResolutionService,
  accountResolutionService?: AccountResolutionService
): TransactionService => {
  const save = async (input: TransactionInput, existingId?: string): Promise<void> => {
    const merchantInput = input.merchant ?? input.merchantName ?? null;
    const merchant = merchantResolutionService && merchantInput
      ? await merchantResolutionService.resolve(merchantInput)
      : null;

    const categoryInput = input.categoryName ?? null;
    const hasCategoryText = typeof categoryInput === "string" && categoryInput.trim().length > 0;
    const category = categoryResolutionService && hasCategoryText
      ? await categoryResolutionService.resolve(categoryInput)
      : null;

    const bankInput = input.bankName ?? null;
    const hasBankText = typeof bankInput === "string" && bankInput.trim().length > 0;
    const bank = bankResolutionService && hasBankText
      ? await bankResolutionService.resolve(bankInput)
      : null;

    const accountInput = input.accountName ?? null;
    const hasAccountText = typeof accountInput === "string" && accountInput.trim().length > 0;
    const account = accountResolutionService && hasAccountText
      ? await accountResolutionService.resolve(accountInput)
      : null;

    const preservedBankId =
      typeof input.bankId === "string" && input.bankId.trim().length > 0
        ? input.bankId
        : undefined;

    const preservedAccountId =
      typeof input.accountId === "string" && input.accountId.trim().length > 0
        ? input.accountId
        : undefined;

    const transactionDraft = {
      ...input,
      merchantId: merchant ? merchant.id : (input.merchantId ?? null),
      categoryId: category ? category.id : (input.categoryId ?? null),
      ...(bank ? { bankId: bank.id } : {}),
      ...(!bank && preservedBankId ? { bankId: preservedBankId } : {}),
      ...(account ? { accountId: account.id } : {}),
      ...(!account && preservedAccountId ? { accountId: preservedAccountId } : {}),
    };

    if (existingId) {
      await transactionRepository.update(existingId, transactionDraft);
      return;
    }
    await transactionRepository.create(transactionDraft);
  };

  const deleteById = async (id: string): Promise<void> => {
    await transactionRepository.remove(id);
  };

  const clearAll = async (): Promise<void> => {
    await transactionRepository.clearAll();
  };

  return {
    save,
    deleteById,
    clearAll,
  };
};
