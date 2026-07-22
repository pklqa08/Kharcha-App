import { ICategoryRepository } from "@/src/domain/interfaces/repositories/category.repository.interface";
import { normalizeCategoryName } from "@/src/domain/services/category-normalization";

type ResolvedCategory = Awaited<ReturnType<ICategoryRepository["get"]>>;

export interface CategoryResolutionService {
  resolve(categoryText: string | null | undefined): Promise<ResolvedCategory>;
}

const DEFAULT_CATEGORY_TYPE = "expense" as const;
const DEFAULT_CATEGORY_ICON = "more-horizontal";
const DEFAULT_CATEGORY_COLOR = "#8C7366";

export const createCategoryResolutionService = (
  categoryRepository: ICategoryRepository
): CategoryResolutionService => ({
  resolve: async (categoryText: string | null | undefined): Promise<ResolvedCategory> => {
    const normalizedInput = normalizeCategoryName(categoryText);

    if (!normalizedInput.normalizedName || !normalizedInput.displayName) {
      return null;
    }

    const categories = await categoryRepository.list();
    for (const category of categories) {
      const normalizedCategory = normalizeCategoryName(category.name);
      if (normalizedCategory.normalizedName === normalizedInput.normalizedName) {
        return category;
      }
    }

    return categoryRepository.create({
      name: normalizedInput.displayName,
      type: DEFAULT_CATEGORY_TYPE,
      icon: DEFAULT_CATEGORY_ICON,
      color: DEFAULT_CATEGORY_COLOR,
    });
  },
});
