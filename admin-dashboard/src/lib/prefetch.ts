const prefetched = new Set<string>();

function prefetchOnce(key: string, loader: () => Promise<unknown>) {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  void loader().catch(() => {
    prefetched.delete(key);
  });
}

export function prefetchAdminRoute(path: string) {
  if (path === "/admin") {
    prefetchOnce("admin-dashboard", () => import("@/pages/admin/AdminDashboard"));
    return;
  }
  if (path.startsWith("/admin/products")) {
    prefetchOnce("admin-products", () => import("@/pages/admin/AdminProducts"));
    return;
  }
  if (path.startsWith("/admin/orders")) {
    prefetchOnce("admin-orders", () => import("@/pages/admin/AdminOrders"));
    return;
  }
  if (path.startsWith("/admin/customers")) {
    prefetchOnce("admin-customers", () => import("@/pages/admin/AdminCustomers"));
    return;
  }
  if (path.startsWith("/admin/inventory")) {
    prefetchOnce("admin-inventory", () => import("@/pages/admin/AdminInventory"));
    return;
  }
  if (path.startsWith("/admin/feedback")) {
    prefetchOnce("admin-feedback", () => import("@/pages/admin/AdminFeedback"));
    return;
  }
  if (path.startsWith("/admin/reports")) {
    prefetchOnce("admin-reports", () => import("@/pages/admin/AdminReports"));
    return;
  }
  if (path.startsWith("/admin/settings")) {
    prefetchOnce("admin-settings", () => import("@/pages/admin/AdminSettings"));
  }
}

