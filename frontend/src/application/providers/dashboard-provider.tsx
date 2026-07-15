import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { Category, Transaction } from "@/src/domain/entities/models";
import { categoryRepo, transactionRepo } from "@/src/infrastructure/repositories/repos";
import { useTransactionProvider } from "@/src/application/providers/transaction-provider";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "@/src/domain/services/format";

interface DashboardContextValue {
  today: { income: number; expense: number };
  month: { income: number; expense: number };
  recent: Transaction[];
  categoriesMap: Record<string, Category>;
  loading: boolean;
  loadDashboard: () => Promise<void>;
}

const defaultCtx: DashboardContextValue = {
  today: { income: 0, expense: 0 },
  month: { income: 0, expense: 0 },
  recent: [],
  categoriesMap: {},
  loading: false,
  loadDashboard: async () => {},
};

const DashboardContext = createContext<DashboardContextValue>(defaultCtx);
export const useDashboardProvider = () => useContext(DashboardContext);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { totalsBetween } = useTransactionProvider();
  const [today, setToday] = useState({ income: 0, expense: 0 });
  const [month, setMonth] = useState({ income: 0, expense: 0 });
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, Category>>({});
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [todayTotals, monthTotals, cats, latest] = await Promise.all([
        totalsBetween(startOfDay(), endOfDay()),
        totalsBetween(startOfMonth(), endOfMonth()),
        categoryRepo.list(),
        transactionRepo.list({ limit: 6 }),
      ]);

      setToday(todayTotals);
      setMonth(monthTotals);
      setRecent(latest.slice(0, 6));

      const map: Record<string, Category> = {};
      cats.forEach((c) => {
        map[c.id] = c;
      });
      setCategoriesMap(map);
    } catch (error) {
      console.warn("[dashboard-provider] Failed to load dashboard", error);
      setToday({ income: 0, expense: 0 });
      setMonth({ income: 0, expense: 0 });
      setRecent([]);
      setCategoriesMap({});
    } finally {
      setLoading(false);
    }
  }, [totalsBetween]);

  const value = useMemo(
    () => ({ today, month, recent, categoriesMap, loading, loadDashboard }),
    [today, month, recent, categoriesMap, loading, loadDashboard]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};
