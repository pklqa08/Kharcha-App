import { Merchant, MerchantInput } from "@/src/domain/entities/merchant";

export interface IMerchantRepository {
  create(input: MerchantInput): Promise<Merchant | null>;
  update(id: string, patch: Partial<MerchantInput>): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Merchant | null>;
  findByCanonicalName(canonicalName: string): Promise<Merchant | null>;
  findByNormalizedName(normalizedName: string): Promise<Merchant | null>;
  findAll(limit?: number): Promise<Merchant[]>;
  search(query: string, limit?: number): Promise<Merchant[]>;
  count(): Promise<number>;
}
