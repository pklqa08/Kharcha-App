import { CategoryBreakdownItem, MerchantAggregate, TotalsSummary } from "@/src/domain/interfaces/analytics.types";

export type AnalyticsPeriod = "today" | "weekly" | "monthly" | "yearly";

export interface PeriodRange {
  from: string;
  to: string;
}

export interface PeriodFinancialSummary extends TotalsSummary {
  period: AnalyticsPeriod;
  range: PeriodRange;
  balance: number;
}

export interface MerchantAnalysisRow extends MerchantAggregate {
  avgTicket: number;
  shareOfExpensePct: number;
}

export interface CategoryAnalysisRow extends CategoryBreakdownItem {
  shareOfExpensePct: number;
}

export type BudgetHealth = "on_track" | "near_limit" | "over_budget";

export interface BudgetAnalysisRow {
  budgetId: string;
  categoryId: string | null;
  period: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPct: number;
  health: BudgetHealth;
}

export type InsightKind = "spike" | "anomaly" | "trend" | "budget" | "merchant" | "category" | "forecast";

export interface InsightAction {
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface AnalyticsInsight {
  id: string;
  kind: InsightKind;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  confidence?: number;
  period?: AnalyticsPeriod;
  actions?: InsightAction[];
  metadata?: Record<string, unknown>;
}

export interface AnalyticsSnapshot {
  today: PeriodFinancialSummary;
  weekly: PeriodFinancialSummary;
  monthly: PeriodFinancialSummary;
  yearly: PeriodFinancialSummary;
  merchants: MerchantAnalysisRow[];
  categories: CategoryAnalysisRow[];
  budgets: BudgetAnalysisRow[];
}

export interface AnalyticsDashboard {
  summary: {
    today: PeriodFinancialSummary;
    weekly: PeriodFinancialSummary;
    monthly: PeriodFinancialSummary;
    yearly: PeriodFinancialSummary;
  };
  merchantAnalysis: MerchantAnalysisRow[];
  categoryAnalysis: CategoryAnalysisRow[];
  budgetAnalysis: BudgetAnalysisRow[];
  insights: AnalyticsInsight[];
}

export interface IAnalyticsInsightProvider {
  generate(snapshot: AnalyticsSnapshot): Promise<AnalyticsInsight[]>;
}

export interface IAnalyticsTransactionQueryPort {
  totalsBetween(from: string, to: string): Promise<TotalsSummary>;
  topMerchants(from: string, to: string, limit?: number): Promise<MerchantAggregate[]>;
  categoryBreakdown(
    from: string,
    to: string,
    type: "debit" | "credit"
  ): Promise<Array<{ category_id: string | null; name: string; color: string; icon: string; total: number }>>;
}

export interface IAnalyticsBudgetQueryPort {
  list(): Promise<Array<{ id: string; category_id: string | null; amount: number; period: string }>>;
}

export interface AnalyticsEngineDependencies {
  transactions: IAnalyticsTransactionQueryPort;
  budgets: IAnalyticsBudgetQueryPort;
  insightProvider?: IAnalyticsInsightProvider;
}

export interface IAnalyticsEngine {
  getPeriodSummary(period: AnalyticsPeriod, asOf?: Date): Promise<PeriodFinancialSummary>;
  getMerchantAnalysis(period: AnalyticsPeriod, options?: { asOf?: Date; limit?: number }): Promise<MerchantAnalysisRow[]>;
  getCategoryAnalysis(period: AnalyticsPeriod, options?: { asOf?: Date; type?: "debit" | "credit" }): Promise<CategoryAnalysisRow[]>;
  getBudgetAnalysis(asOf?: Date): Promise<BudgetAnalysisRow[]>;
  getInsights(asOf?: Date): Promise<AnalyticsInsight[]>;
  getDashboard(asOf?: Date): Promise<AnalyticsDashboard>;
}
