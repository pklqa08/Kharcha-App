import { ValidationResult } from "@/src/application/models/validation-result";
import { TransactionInput } from "@/src/domain/entities/models";

export interface TransactionValidationService {
  validate(transaction: TransactionInput): ValidationResult;
}

const hasValue = (value: string | null | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

const hasValidResolvedId = (value: string | null | undefined): boolean =>
  value == null || hasValue(value);

export const createTransactionValidationService = (): TransactionValidationService => ({
  validate: (transaction: TransactionInput): ValidationResult => {
    const errors: string[] = [];

    if (!(typeof transaction.amount === "number" && Number.isFinite(transaction.amount) && transaction.amount > 0)) {
      errors.push("amount must be greater than zero");
    }

    if (!hasValue(transaction.date)) {
      errors.push("transaction date is required");
    }

    if (!hasValue(transaction.type)) {
      errors.push("transaction type is required");
    }

    if (!hasValidResolvedId(transaction.merchantId)) {
      errors.push("merchantId must be a valid resolved id when provided");
    }

    if (!hasValidResolvedId(transaction.categoryId)) {
      errors.push("categoryId must be a valid resolved id when provided");
    }

    if (!hasValidResolvedId(transaction.bankId)) {
      errors.push("bankId must be a valid resolved id when provided");
    }

    if (!hasValidResolvedId(transaction.accountId)) {
      errors.push("accountId must be a valid resolved id when provided");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
});
