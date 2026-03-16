import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Product } from "@/lib/api";

export type CartItem = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  quantity: number;
  category: string;
  stock: number;
  backorderable?: boolean;
  backorderEtaDays?: number | null;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotalCents: number;
  isReady: boolean;
  addItem: (product: Product, quantity: number) => void;
  syncItems: (products: Product[]) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "hardware_store_cart_v1";

const clampQuantity = (quantity: number, max: number) => {
  if (max <= 0) return 0;
  return Math.min(Math.max(1, quantity), max);
};

const BACKORDER_LIMIT = 10;

const getMaxQuantity = (stock: number, backorderable?: boolean) => {
  if (stock > 0) return stock;
  if (backorderable) return BACKORDER_LIMIT;
  return 0;
};

const loadFromStorage = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item.id === "string");
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(loadFromStorage());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isReady) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [isReady, items]);

  const addItem = useCallback((product: Product, quantity: number) => {
    const max = getMaxQuantity(product.stock, product.backorderable);
    if (max <= 0 || quantity <= 0) return;

    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (!existing) {
        const nextQuantity = clampQuantity(quantity, max);
        if (nextQuantity === 0) return prev;
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            priceCents: product.priceCents,
            currency: product.currency,
            imageUrl: product.imageUrl,
            quantity: nextQuantity,
            category: product.category,
            stock: product.stock,
            backorderable: product.backorderable,
            backorderEtaDays: product.backorderEtaDays,
          },
        ];
      }

      const nextQuantity = clampQuantity(existing.quantity + quantity, max);
      return prev.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: nextQuantity,
              priceCents: product.priceCents,
              currency: product.currency,
              imageUrl: product.imageUrl,
              category: product.category,
              stock: product.stock,
              backorderable: product.backorderable,
              backorderEtaDays: product.backorderEtaDays,
            }
          : item
      );
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      const next: CartItem[] = [];

      for (const item of prev) {
        if (item.id !== id) {
          next.push(item);
          continue;
        }

        if (quantity <= 0) continue;
        const max = getMaxQuantity(item.stock, item.backorderable);
        const nextQuantity = clampQuantity(quantity, max);
        if (nextQuantity <= 0) continue;
        next.push({ ...item, quantity: nextQuantity });
      }

      return next;
    });
  }, []);

  const syncItems = useCallback((products: Product[]) => {
    setItems((prev) =>
      {
        const next = prev
        .map((item) => {
          const product = products.find((p) => p.id === item.id);
          if (!product) return item;
          const max = getMaxQuantity(product.stock, product.backorderable);
          const nextQuantity = clampQuantity(item.quantity, max);
          if (nextQuantity <= 0) return null;
          return {
            ...item,
            priceCents: product.priceCents,
            currency: product.currency,
            imageUrl: product.imageUrl,
            category: product.category,
            stock: product.stock,
            backorderable: product.backorderable,
            backorderEtaDays: product.backorderEtaDays,
            quantity: nextQuantity,
          };
        })
        .filter(Boolean) as CartItem[];

        if (next.length !== prev.length) return next;

        const hasChanges = next.some((item, index) => {
          const current = prev[index];
          if (!current) return true;
          return (
            item.id !== current.id ||
            item.name !== current.name ||
            item.priceCents !== current.priceCents ||
            item.currency !== current.currency ||
            item.imageUrl !== current.imageUrl ||
            item.quantity !== current.quantity ||
            item.category !== current.category ||
            item.stock !== current.stock ||
            item.backorderable !== current.backorderable ||
            item.backorderEtaDays !== current.backorderEtaDays
          );
        });

        return hasChanges ? next : prev;
      }
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotalCents,
      isReady,
      addItem,
      syncItems,
      updateQuantity,
      removeItem,
      clear,
    }),
    [addItem, clear, isReady, items, removeItem, subtotalCents, syncItems, totalItems, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
