import { TransactionInput } from "@/src/domain/entities/models";
import { ITransactionRepository } from "@/src/domain/interfaces/repositories";
import { MerchantResolutionService } from "@/src/application/services/merchant-resolution.service";

export interface TransactionService {
  save(input: TransactionInput, existingId?: string): Promise<void>;
  deleteById(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export const createTransactionService = (
  transactionRepository: ITransactionRepository,
  merchantResolutionService?: MerchantResolutionService
): TransactionService => {
  const save = async (input: TransactionInput, existingId?: string): Promise<void> => {
    const merchantInput = input.merchant ?? input.merchantName ?? null;
    const merchant = merchantResolutionService && merchantInput
      ? await merchantResolutionService.resolve(merchantInput)
      : null;

    const transactionDraft = {
      ...input,
      merchantId: merchant ? merchant.id : (input.merchantId ?? null),
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
