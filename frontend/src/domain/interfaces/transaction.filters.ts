import { EntityId, TxnType } from "../value-objects";

export interface TransactionFilters {
  search?: string;
  type?: TxnType;
  categoryId?: EntityId;
  from?: string;
  to?: string;
  limit?: number;
}
