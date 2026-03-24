import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/api";

type CompareItem = {
  id: string;
  name: string;
  sku: string;
  category: string;
  priceCents: number;
  currency: string;
  stock: number;
  imageUrl: string;
  specs: Record<string, string | number | boolean>;
  compatibility: string;
};

type CompareContextValue = {
  items: CompareItem[];
  toggleCompare: (product: Product) => void;
  isCompared: (productId: string) => boolean;
  remove: (productId: string) => void;
  clear: () => void;
};

const CompareContext = createContext<CompareContextValue | null>(null);
const STORAGE_KEY = "hardware_store_compare_v1";

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CompareItem[];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CompareContextValue>(
    () => ({
      items,
      toggleCompare: (product) => {
        setItems((prev) => {
          const exists = prev.some((item) => item.id === product.id);
          if (exists) return prev.filter((item) => item.id !== product.id);
          return [
            ...prev.slice(-3),
            {
              id: product.id,
              name: product.name,
              sku: product.sku,
              category: product.category,
              priceCents: product.priceCents,
              currency: product.currency,
              stock: product.stock,
              imageUrl: product.imageUrl,
              specs: product.specs,
              compatibility: product.compatibility,
            },
          ];
        });
      },
      isCompared: (productId) => items.some((item) => item.id === productId),
      remove: (productId) => setItems((prev) => prev.filter((item) => item.id !== productId)),
      clear: () => setItems([]),
    }),
    [items]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used within a CompareProvider");
  return context;
}
