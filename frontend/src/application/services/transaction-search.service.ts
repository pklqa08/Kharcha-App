import { SearchCriteria } from "@/src/application/models/search-criteria";
import { SearchResult } from "@/src/application/models/search-result";
import { Transaction } from "@/src/domain/entities/models";
import { ITransactionRepository } from "@/src/domain/interfaces/repositories";

export interface TransactionSearchService {
  search(criteria: SearchCriteria): Promise<SearchResult<Transaction>>;
}

const validateSearchCriteria = (criteria: SearchCriteria): void => {
  if (typeof criteria.minAmount === "number" && criteria.minAmount < 0) {
    throw new Error("minAmount must be greater than or equal to 0");
  }

  if (typeof criteria.maxAmount === "number" && criteria.maxAmount < 0) {
    throw new Error("maxAmount must be greater than or equal to 0");
  }

  if (
    typeof criteria.minAmount === "number" &&
    typeof criteria.maxAmount === "number" &&
    criteria.minAmount > criteria.maxAmount
  ) {
    throw new Error("minAmount cannot be greater than maxAmount");
  }

  if (criteria.startDate && Number.isNaN(Date.parse(criteria.startDate))) {
    throw new Error("startDate must be a valid date string");
  }

  if (criteria.endDate && Number.isNaN(Date.parse(criteria.endDate))) {
    throw new Error("endDate must be a valid date string");
  }

  if (criteria.startDate && criteria.endDate) {
    const start = Date.parse(criteria.startDate);
    const end = Date.parse(criteria.endDate);
    if (start > end) {
      throw new Error("startDate cannot be after endDate");
    }
  }
};

export const createTransactionSearchService = (
  transactionRepository: ITransactionRepository
): TransactionSearchService => {
  const search = async (criteria: SearchCriteria): Promise<SearchResult<Transaction>> => {
    validateSearchCriteria(criteria);
    const items = await transactionRepository.search(criteria);
    return {
      items,
      totalCount: items.length,
    };
  };

  return {
    search,
  };
};
