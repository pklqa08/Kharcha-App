import React from "react";

import { SettingsProvider, useSettings, SETTINGS_KEYS } from "@/src/application/providers/settings-provider";
import { TransactionProvider } from "@/src/application/providers/transaction-provider";
import { CategoryProvider } from "@/src/application/providers/category-provider";
import { MerchantProvider } from "@/src/application/providers/merchant-provider";
import { DashboardProvider } from "@/src/application/providers/dashboard-provider";
import { BudgetProvider } from "@/src/application/providers/budget-provider";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SettingsProvider>
      <TransactionProvider>
        <CategoryProvider>
          <MerchantProvider>
            <DashboardProvider>
              <BudgetProvider>{children}</BudgetProvider>
            </DashboardProvider>
          </MerchantProvider>
        </CategoryProvider>
      </TransactionProvider>
    </SettingsProvider>
  );
};

export { useSettings, SETTINGS_KEYS };
