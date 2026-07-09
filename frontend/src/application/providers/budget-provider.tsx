import React, { createContext, useContext, useMemo, useState } from "react";

import { Budget } from "@/src/domain/entities/models";
import { budgetRepo } from "@/src/infrastructure/repositories/repos";

interface BudgetContextValue {
  budgets: Budget[];
  loading: boolean;
  loadBudgets: () => Promise<void>;
  createBudget: (categoryId: string | null, amount: number, period?: string) => Promise<void>;
  removeBudget: (id: string) => Promise<void>;
}

const defaultCtx: BudgetContextValue = {
  budgets: [],
  loading: false,
  loadBudgets: async () => {},
  createBudget: async () => {},
  removeBudget: async () => {},
};

const BudgetContext = createContext<BudgetContextValue>(defaultCtx);
export const useBudgetProvider = () => useContext(BudgetContext);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const list = await budgetRepo.list();
      setBudgets(list);
    } finally {
      setLoading(false);
    }
  };

  const createBudget = async (categoryId: string | null, amount: number, period = "monthly") => {
    await budgetRepo.create(categoryId, amount, period);
    await loadBudgets();
  };

  const removeBudget = async (id: string) => {
    await budgetRepo.remove(id);
    await loadBudgets();
  };

  const value = useMemo(
    () => ({ budgets, loading, loadBudgets, createBudget, removeBudget }),
    [budgets, loading]
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};
