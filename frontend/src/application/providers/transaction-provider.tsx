import React, { createContext, useContext, useMemo, useState } from "react";

import { Transaction, TransactionInput, TxnType } from "@/src/domain/entities/models";
import { transactionRepo } from "@/src/infrastructure/repositories/repos";
import { transactionService } from "@/src/application/services";

interface TransactionContextValue {
  transactions: Transaction[];
  loading: boolean;
  loadTransactions: (opts?: {
    search?: string;
    type?: TxnType;
    categoryId?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) => Promise<void>;
  getTransactionById: (id: string) => Promise<Transaction | null>;
  saveTransaction: (input: TransactionInput, existingId?: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  clearTransactions: () => Promise<void>;
  totalsBetween: (from: string, to: string) => Promise<{ income: number; expense: number }>;
  categoryBreakdown: (from: string, to: string, type: TxnType) => Promise<Array<{ category_id: string | null; name: string; color: string; icon: string; total: number }>>;
  topMerchants: (from: string, to: string, limit?: number) => Promise<Array<{ merchant: string; total: number; count: number }>>;
  dailySeries: (from: string, to: string) => Promise<Array<{ date: string; income: number; expense: number }>>;
}

const defaultCtx: TransactionContextValue = {
  transactions: [],
  loading: false,
  loadTransactions: async () => {},
  getTransactionById: async () => null,
  saveTransaction: async () => {},
  deleteTransaction: async () => {},
  clearTransactions: async () => {},
  totalsBetween: async () => ({ income: 0, expense: 0 }),
  categoryBreakdown: async () => [],
  topMerchants: async () => [],
  dailySeries: async () => [],
};

const TransactionContext = createContext<TransactionContextValue>(defaultCtx);
export const useTransactionProvider = () => useContext(TransactionContext);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = async (opts?: {
    search?: string;
    type?: TxnType;
    categoryId?: string;
    from?: string;
    to?: string;
    limit?: number;
  }) => {
    setLoading(true);
    try {
      const list = await transactionRepo.list(opts);
      setTransactions(list);
    } catch (error) {
      console.warn("[transaction-provider] Failed to load transactions", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionById = async (id: string): Promise<Transaction | null> => {
    try {
      return await transactionRepo.get(id);
    } catch (error) {
      console.warn("[transaction-provider] Failed to get transaction by id", error);
      return null;
    }
  };

  const saveTransaction = async (input: TransactionInput, existingId?: string) => {
    try {
      await transactionService.save(input, existingId);
    } catch (error) {
      console.warn("[transaction-provider] Failed to save transaction", error);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionService.deleteById(id);
    } catch (error) {
      console.warn("[transaction-provider] Failed to delete transaction", error);
    }
  };

  const clearTransactions = async () => {
    try {
      await transactionService.clearAll();
      setTransactions([]);
    } catch (error) {
      console.warn("[transaction-provider] Failed to clear transactions", error);
    }
  };

  const totalsBetween = async (from: string, to: string) => {
    try {
      return await transactionRepo.totalsBetween(from, to);
    } catch (error) {
      console.warn("[transaction-provider] Failed to load totals", error);
      return { income: 0, expense: 0 };
    }
  };

  const categoryBreakdown = async (from: string, to: string, type: TxnType) => {
    try {
      return await transactionRepo.categoryBreakdown(from, to, type);
    } catch (error) {
      console.warn("[transaction-provider] Failed to load category breakdown", error);
      return [];
    }
  };

  const topMerchants = async (from: string, to: string, limit?: number) => {
    try {
      return await transactionRepo.topMerchants(from, to, limit);
    } catch (error) {
      console.warn("[transaction-provider] Failed to load top merchants", error);
      return [];
    }
  };

  const dailySeries = async (from: string, to: string) => {
    try {
      return await transactionRepo.dailySeries(from, to);
    } catch (error) {
      console.warn("[transaction-provider] Failed to load daily series", error);
      return [];
    }
  };

  const value = useMemo(
    () => ({
      transactions,
      loading,
      loadTransactions,
      getTransactionById,
      saveTransaction,
      deleteTransaction,
      clearTransactions,
      totalsBetween,
      categoryBreakdown,
      topMerchants,
      dailySeries,
    }),
    [transactions, loading]
  );

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
};
