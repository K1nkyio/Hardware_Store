import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "@/lib/api";

type RecentlyViewedItem = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  viewedAt: string;
};

type RecentlyViewedContextValue = {
  items: RecentlyViewedItem[];
  addProduct: (product: Product) => void;
};

const RecentlyViewedContext = createContext<RecentlyViewedContextValue | null>(null);
const STORAGE_KEY = "hardware_store_recently_viewed_v1";

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentlyViewedItem[];
      if (Array.isArray(parsed)) setItems(parsed);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<RecentlyViewedContextValue>(
    () => ({
      items,
      addProduct: (product) => {
        setItems((prev) => [
          {
            id: product.id,
            name: product.name,
            category: product.category,
            priceCents: product.priceCents,
            currency: product.currency,
            imageUrl: product.imageUrl,
            viewedAt: new Date().toISOString(),
          },
          ...prev.filter((item) => item.id !== product.id),
        ].slice(0, 8));
      },
    }),
    [items]
  );

  return <RecentlyViewedContext.Provider value={value}>{children}</RecentlyViewedContext.Provider>;
}

export function useRecentlyViewed() {
  const context = useContext(RecentlyViewedContext);
  if (!context) throw new Error("useRecentlyViewed must be used within a RecentlyViewedProvider");
  return context;
}
