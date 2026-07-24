import { SearchCriteria } from "@/src/application/models/search-criteria";
import { SearchResult } from "@/src/application/models/search-result";
import { Transaction, TransactionInput } from "@/src/domain/entities/models";
import { ITransactionRepository } from "@/src/domain/interfaces/repositories";
import { MerchantResolutionService } from "@/src/application/services/merchant-resolution.service";
import { CategoryResolutionService } from "@/src/application/services/category-resolution.service";
import { BankResolutionService } from "@/src/application/services/bank-resolution.service";
import { AccountResolutionService } from "@/src/application/services/account-resolution.service";
import { TransactionValidationService } from "@/src/application/services/transaction-validation.service";
import { TransactionSearchService } from "@/src/application/services/transaction-search.service";
import { ValidationResult } from "@/src/application/models/validation-result";

export interface TransactionService {
  save(input: TransactionInput, existingId?: string): Promise<ValidationResult>;
  search(criteria: SearchCriteria): Promise<SearchResult<Transaction>>;
  deleteById(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export const createTransactionService = (
  transactionRepository: ITransactionRepository,
  merchantResolutionService?: MerchantResolutionService,
  categoryResolutionService?: CategoryResolutionService,
  bankResolutionService?: BankResolutionService,
  accountResolutionService?: AccountResolutionService,
  transactionValidationService?: TransactionValidationService,
  transactionSearchService?: TransactionSearchService
): TransactionService => {
  const save = async (input: TransactionInput, existingId?: string): Promise<ValidationResult> => {
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

    const validationResult = transactionValidationService
      ? transactionValidationService.validate(transactionDraft)
      : { valid: true, errors: [] };

    if (!validationResult.valid) {
      return validationResult;
    }

    if (existingId) {
      await transactionRepository.update(existingId, transactionDraft);
      return validationResult;
    }
    await transactionRepository.create(transactionDraft);
    return validationResult;
  };

  const deleteById = async (id: string): Promise<void> => {
    await transactionRepository.remove(id);
  };

  const search = async (criteria: SearchCriteria): Promise<SearchResult<Transaction>> => {
    if (!transactionSearchService) {
      throw new Error("TransactionSearchService is required for transaction search orchestration");
    }

    return transactionSearchService.search(criteria);
  };

  const clearAll = async (): Promise<void> => {
    await transactionRepository.clearAll();
  };

  return {
    save,
    search,
    deleteById,
    clearAll,
  };
};
