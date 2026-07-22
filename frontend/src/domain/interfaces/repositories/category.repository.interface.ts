import { Category, CategoryType } from "@/src/domain/entities/models";

export interface CategoryCreateInput {
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
}

export type CategoryUpdateInput = Partial<Pick<Category, "name" | "icon" | "color">>;

export interface ICategoryRepository {
  list(type?: CategoryType): Promise<Category[]>;
  get(id: string): Promise<Category | null>;
  create(input: CategoryCreateInput): Promise<Category | null>;
  update(id: string, patch: CategoryUpdateInput): Promise<void>;
  remove(id: string): Promise<void>;
}
