import { Merchant } from "@/src/domain/entities/merchant";
import { IMerchantRepository } from "@/src/domain/interfaces/repositories/merchant.repository.interface";
import { normalizeMerchantName } from "@/src/domain/services/merchant-normalization";

export interface MerchantResolutionService {
  resolve(merchantText: string | null | undefined): Promise<Merchant | null>;
}

export const createMerchantResolutionService = (
  merchantRepository: IMerchantRepository
): MerchantResolutionService => ({
  resolve: async (merchantText: string | null | undefined): Promise<Merchant | null> => {
    const { normalizedName } = normalizeMerchantName(merchantText);

    if (!normalizedName) {
      return null;
    }

    const existingMerchant = await merchantRepository.findByNormalizedName(normalizedName);
    if (existingMerchant) {
      return existingMerchant;
    }

    const now = new Date().toISOString();
    const createdMerchant = await merchantRepository.create({
      canonicalName: normalizedName,
      displayName: merchantText?.trim() || null,
      normalizedName,
      categoryHintId: null,
      confidence: null,
      metadata: null,
      transactionCount: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return createdMerchant;
  },
});
