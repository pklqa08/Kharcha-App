import { EntityId } from "../value_objects";

export interface MerchantAlias {
  value: string;
  normalizedName: string;
}

export interface MerchantInput {
  canonicalName: string;
  displayName?: string | null;
  normalizedName?: string | null;
  aliases?: MerchantAlias[];
  categoryHintId?: string | null;
  confidence?: number | null;
  metadata?: string | null;
  transactionCount?: number | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Merchant {
  id: EntityId;
  canonicalName: string;
  displayName: string | null;
  normalizedName: string | null;
  aliases: MerchantAlias[];
  categoryHintId: string | null;
  confidence: number | null;
  metadata: string | null;
  transactionCount: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
