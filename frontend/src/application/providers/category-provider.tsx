import React, { createContext, useContext, useMemo, useState } from "react";

import { Category } from "@/src/domain/entities/models";
import { categoryRepo } from "@/src/infrastructure/repositories/repos";

interface CategoryContextValue {
  categories: Category[];
  loading: boolean;
  loadCategories: (type?: "expense" | "income") => Promise<void>;
  createCategory: (name: string, type: "expense" | "income", icon: string, color: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  getCategoryMap: () => Record<string, Category>;
}

const defaultCtx: CategoryContextValue = {
  categories: [],
  loading: false,
  loadCategories: async () => {},
  createCategory: async () => {},
  removeCategory: async () => {},
  getCategoryMap: () => ({}),
};

const CategoryContext = createContext<CategoryContextValue>(defaultCtx);
export const useCategoryProvider = () => useContext(CategoryContext);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCategories = async (type?: "expense" | "income") => {
    setLoading(true);
    try {
      const list = await categoryRepo.list(type);
      setCategories(list);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string, type: "expense" | "income", icon: string, color: string) => {
    await categoryRepo.create(name, type, icon, color);
    await loadCategories(type);
  };

  const removeCategory = async (id: string) => {
    await categoryRepo.remove(id);
    await loadCategories();
  };

  const getCategoryMap = () => {
    const map: Record<string, Category> = {};
    categories.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  };

  const value = useMemo(
    () => ({ categories, loading, loadCategories, createCategory, removeCategory, getCategoryMap }),
    [categories, loading]
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
};
