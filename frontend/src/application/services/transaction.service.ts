import { TransactionInput } from "@/src/domain/entities/models";
import { ITransactionRepository } from "@/src/domain/interfaces/repositories";

export interface TransactionService {
  save(input: TransactionInput, existingId?: string): Promise<void>;
  deleteById(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export const createTransactionService = (
  transactionRepository: ITransactionRepository
): TransactionService => {
  const save = async (input: TransactionInput, existingId?: string): Promise<void> => {
    if (existingId) {
      await transactionRepository.update(existingId, input);
      return;
    }
    await transactionRepository.create(input);
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
