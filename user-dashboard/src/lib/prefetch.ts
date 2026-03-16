const prefetched = new Set<string>();

function prefetchOnce(key: string, loader: () => Promise<unknown>) {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  void loader().catch(() => {
    prefetched.delete(key);
  });
}

export function prefetchUserRoute(path: string) {
  if (path.startsWith("/category")) {
    prefetchOnce("category", () => import("@/pages/Category"));
    return;
  }
  if (path.startsWith("/product")) {
    prefetchOnce("product", () => import("@/pages/ProductDetail"));
    return;
  }
  if (path.startsWith("/checkout")) {
    prefetchOnce("checkout", () => import("@/pages/Checkout"));
    return;
  }
  if (path.startsWith("/login")) {
    prefetchOnce("login", () => import("@/pages/Login"));
    return;
  }
  if (path.startsWith("/about")) {
    prefetchOnce("about", () => import("@/pages/about/OurStory"));
    prefetchOnce("care", () => import("@/pages/about/CustomerCare"));
    prefetchOnce("locator", () => import("@/pages/about/StoreLocator"));
    return;
  }
  prefetchOnce("home", () => import("@/pages/Index"));
}
