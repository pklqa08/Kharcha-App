export type CategoryType = "expense" | "income";

export const CATEGORY_TYPES: CategoryType[] = ["expense", "income"];

export const isCategoryType = (value: string): value is CategoryType =>
  CATEGORY_TYPES.includes(value as CategoryType);
