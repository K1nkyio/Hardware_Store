import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { addWishlistItem, getWishlist, removeWishlistItem, type Product, type WishlistItem } from "@/lib/api";
import { useOptionalAuth } from "@/context/auth";

type WishlistContextValue = {
  items: WishlistItem[];
  productIds: string[];
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: Product) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "hardware_store_wishlist_v1";

function loadLocalWishlist(): WishlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WishlistItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const auth = useOptionalAuth();
  const currentUser = auth?.currentUser ?? null;
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      setIsLoading(true);
      if (!currentUser) {
        if (active) {
          setItems(loadLocalWishlist());
          setIsLoading(false);
        }
        return;
      }

      try {
        const remoteItems = await getWishlist();
        if (active) setItems(remoteItems);
      } catch {
        if (active) setItems(loadLocalWishlist());
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (currentUser) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [currentUser, items]);

  const isWishlisted = useCallback(
    (productId: string) => items.some((item) => item.productId === productId),
    [items]
  );

  const toggleWishlist = useCallback(
    async (product: Product) => {
      const exists = items.some((item) => item.productId === product.id);

      if (currentUser) {
        if (exists) {
          await removeWishlistItem(product.id);
          setItems((prev) => prev.filter((item) => item.productId !== product.id));
          return;
        }

        await addWishlistItem(product.id);
      }

      setItems((prev) => {
        if (exists) return prev.filter((item) => item.productId !== product.id);
        return [
          {
            productId: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category,
            priceCents: product.priceCents,
            currency: product.currency,
            stock: product.stock,
            imageUrl: product.imageUrl,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ];
      });
    },
    [currentUser, items]
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      productIds: items.map((item) => item.productId),
      isLoading,
      isWishlisted,
      toggleWishlist,
    }),
    [isLoading, isWishlisted, items, toggleWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
