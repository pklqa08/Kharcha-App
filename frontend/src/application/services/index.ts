import { SETTINGS_KEYS } from "@/src/application/providers/AppProviders";
import { createAnalyticsEngine } from "@/src/application/services/analytics-engine.service";
import { createPinService } from "@/src/application/services/pin.service";
import { createTransactionService } from "@/src/application/services/transaction.service";
import { createMerchantResolutionService } from "@/src/application/services/merchant-resolution.service";
import { budgetRepo, settingsRepo, transactionRepo } from "@/src/infrastructure/repositories/repos";
import { merchantRepo } from "@/src/infrastructure/repositories/repos";

export { createPinService, type PinService, type PinServiceConfig } from "./pin.service";
export { createTransactionService, type TransactionService } from "./transaction.service";
export { createAnalyticsEngine } from "./analytics-engine.service";

export const pinService = createPinService(settingsRepo, {
  pinHashKey: SETTINGS_KEYS.pinHash,
});

const merchantResolutionService = createMerchantResolutionService(merchantRepo);

export const transactionService = createTransactionService(transactionRepo, merchantResolutionService);

export const analyticsEngine = createAnalyticsEngine({
  transactions: transactionRepo,
  budgets: budgetRepo,
});
