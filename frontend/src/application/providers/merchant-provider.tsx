import React, { createContext, useContext, useMemo, useState } from "react";

import { useTransactionProvider } from "@/src/application/providers/transaction-provider";

interface MerchantRow {
  merchant: string;
  total: number;
  count: number;
}

interface MerchantContextValue {
  merchants: MerchantRow[];
  loading: boolean;
  loadTopMerchants: (from: string, to: string, limit?: number) => Promise<void>;
}

const defaultCtx: MerchantContextValue = {
  merchants: [],
  loading: false,
  loadTopMerchants: async () => {},
};

const MerchantContext = createContext<MerchantContextValue>(defaultCtx);
export const useMerchantProvider = () => useContext(MerchantContext);

export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { topMerchants } = useTransactionProvider();
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTopMerchants = async (from: string, to: string, limit = 5) => {
    setLoading(true);
    try {
      const rows = await topMerchants(from, to, limit);
      setMerchants(rows);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({ merchants, loading, loadTopMerchants }),
    [merchants, loading]
  );

  return <MerchantContext.Provider value={value}>{children}</MerchantContext.Provider>;
};
