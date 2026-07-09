import dayjs from "dayjs";

import {
  AnalyticsDashboard,
  AnalyticsEngineDependencies,
  AnalyticsInsight,
  AnalyticsPeriod,
  BudgetAnalysisRow,
  CategoryAnalysisRow,
  IAnalyticsEngine,
  MerchantAnalysisRow,
  PeriodFinancialSummary,
  PeriodRange,
} from "@/src/domain/interfaces";
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfYear,
} from "@/src/domain/services/format";

const resolveRange = (period: AnalyticsPeriod, asOf = new Date()): PeriodRange => {
  const anchor = dayjs(asOf);

  if (period === "today") {
    return { from: startOfDay(anchor.toDate()), to: endOfDay(anchor.toDate()) };
  }

  if (period === "weekly") {
    return {
      from: anchor.startOf("week").toISOString(),
      to: anchor.endOf("week").toISOString(),
    };
  }

  if (period === "monthly") {
    return { from: startOfMonth(anchor.toDate()), to: endOfMonth(anchor.toDate()) };
  }

  return { from: startOfYear(anchor.toDate()), to: endOfYear(anchor.toDate()) };
};

const toPeriodSummary = (
  period: AnalyticsPeriod,
  range: PeriodRange,
  totals: { income: number; expense: number }
): PeriodFinancialSummary => ({
  period,
  range,
  income: totals.income,
  expense: totals.expense,
  balance: totals.income - totals.expense,
});

export const createAnalyticsEngine = (
  dependencies: AnalyticsEngineDependencies
): IAnalyticsEngine => {
  const getPeriodSummary = async (
    period: AnalyticsPeriod,
    asOf = new Date()
  ): Promise<PeriodFinancialSummary> => {
    const range = resolveRange(period, asOf);
    const totals = await dependencies.transactions.totalsBetween(range.from, range.to);
    return toPeriodSummary(period, range, totals);
  };

  const getMerchantAnalysis = async (
    period: AnalyticsPeriod,
    options?: { asOf?: Date; limit?: number }
  ): Promise<MerchantAnalysisRow[]> => {
    const range = resolveRange(period, options?.asOf);
    const rows = await dependencies.transactions.topMerchants(range.from, range.to, options?.limit ?? 10);
    const expenseTotal = rows.reduce((sum, row) => sum + row.total, 0);

    return rows.map((row) => ({
      ...row,
      avgTicket: row.count > 0 ? row.total / row.count : 0,
      shareOfExpensePct: expenseTotal > 0 ? (row.total / expenseTotal) * 100 : 0,
    }));
  };

  const getCategoryAnalysis = async (
    period: AnalyticsPeriod,
    options?: { asOf?: Date; type?: "debit" | "credit" }
  ): Promise<CategoryAnalysisRow[]> => {
    const range = resolveRange(period, options?.asOf);
    const type = options?.type ?? "debit";
    const rows = await dependencies.transactions.categoryBreakdown(range.from, range.to, type);
    const total = rows.reduce((sum, row) => sum + row.total, 0);

    return rows.map((row) => ({
      categoryId: row.category_id,
      name: row.name,
      color: row.color,
      icon: row.icon,
      total: row.total,
      shareOfExpensePct: total > 0 ? (row.total / total) * 100 : 0,
    }));
  };

  const getBudgetAnalysis = async (asOf = new Date()): Promise<BudgetAnalysisRow[]> => {
    const monthlyRange = resolveRange("monthly", asOf);
    const [budgets, monthlyCategories] = await Promise.all([
      dependencies.budgets.list(),
      dependencies.transactions.categoryBreakdown(monthlyRange.from, monthlyRange.to, "debit"),
    ]);

    const spentByCategory = new Map<string | null, number>();
    monthlyCategories.forEach((row) => {
      spentByCategory.set(row.category_id, row.total);
    });

    return budgets.map((budget) => {
      const spent = spentByCategory.get(budget.category_id) ?? 0;
      const remaining = budget.amount - spent;
      const utilization = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const health = utilization >= 100 ? "over_budget" : utilization >= 80 ? "near_limit" : "on_track";

      return {
        budgetId: budget.id,
        categoryId: budget.category_id,
        period: budget.period,
        budgetAmount: budget.amount,
        spentAmount: spent,
        remainingAmount: remaining,
        utilizationPct: utilization,
        health,
      };
    });
  };

  const getInsights = async (asOf = new Date()): Promise<AnalyticsInsight[]> => {
    if (!dependencies.insightProvider) {
      return [];
    }

    const [today, weekly, monthly, yearly, merchants, categories, budgets] = await Promise.all([
      getPeriodSummary("today", asOf),
      getPeriodSummary("weekly", asOf),
      getPeriodSummary("monthly", asOf),
      getPeriodSummary("yearly", asOf),
      getMerchantAnalysis("monthly", { asOf, limit: 10 }),
      getCategoryAnalysis("monthly", { asOf, type: "debit" }),
      getBudgetAnalysis(asOf),
    ]);

    return dependencies.insightProvider.generate({
      today,
      weekly,
      monthly,
      yearly,
      merchants,
      categories,
      budgets,
    });
  };

  const getDashboard = async (asOf = new Date()): Promise<AnalyticsDashboard> => {
    const [today, weekly, monthly, yearly, merchantAnalysis, categoryAnalysis, budgetAnalysis, insights] =
      await Promise.all([
        getPeriodSummary("today", asOf),
        getPeriodSummary("weekly", asOf),
        getPeriodSummary("monthly", asOf),
        getPeriodSummary("yearly", asOf),
        getMerchantAnalysis("monthly", { asOf, limit: 10 }),
        getCategoryAnalysis("monthly", { asOf, type: "debit" }),
        getBudgetAnalysis(asOf),
        getInsights(asOf),
      ]);

    return {
      summary: {
        today,
        weekly,
        monthly,
        yearly,
      },
      merchantAnalysis,
      categoryAnalysis,
      budgetAnalysis,
      insights,
    };
  };

  return {
    getPeriodSummary,
    getMerchantAnalysis,
    getCategoryAnalysis,
    getBudgetAnalysis,
    getInsights,
    getDashboard,
  };
};
