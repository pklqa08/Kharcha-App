import { DateRange, EntityId, TxnType } from "../value_objects";

export interface TotalsSummary {
  income: number;
  expense: number;
}

export interface CategoryBreakdownItem {
  categoryId: EntityId | null;
  name: string;
  color: string;
  icon: string;
  total: number;
}

export interface MerchantAggregate {
  merchant: string;
  total: number;
  count: number;
}

export interface DailySeriesPoint {
  date: string;
  income: number;
  expense: number;
}

export interface AnalyticsQuery {
  range: DateRange;
  type?: TxnType;
}
