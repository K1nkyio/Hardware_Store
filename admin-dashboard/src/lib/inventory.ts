import { apiRequest } from "@/lib/api";

export type InventoryOverview = {
  summary: {
    totalProducts: number;
    outOfStock: number;
    lowStock: number;
    totalSuppliers: number;
    activeSuppliers: number;
  };
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    stock: number;
    reorderThreshold: number;
    updatedAt: string;
  }>;
  recentMovements: InventoryMovement[];
};

export type InventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: "in" | "out" | "adjustment";
  quantity: number;
  previousStock: number;
  nextStock: number;
  reason: string;
  performedBy: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  leadTimeDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getInventoryOverview(): Promise<InventoryOverview> {
  return apiRequest<InventoryOverview>("/api/inventory/overview");
}

export async function getLowStockItems(threshold?: number) {
  const query = typeof threshold === "number" ? `?threshold=${threshold}` : "";
  return apiRequest<{ thresholdOverride: number | null; items: InventoryOverview["lowStockItems"] }>(
    `/api/inventory/low-stock${query}`
  );
}

export async function listStockMovements(productId?: string): Promise<InventoryMovement[]> {
  const query = productId ? `?productId=${encodeURIComponent(productId)}` : "";
  return apiRequest<InventoryMovement[]>(`/api/inventory/movements${query}`);
}

export async function createStockMovement(payload: {
  productId: string;
  movementType: "in" | "out" | "adjustment";
  quantity: number;
  reason?: string;
}) {
  return apiRequest<InventoryMovement>("/api/inventory/movements", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listSuppliers(): Promise<Supplier[]> {
  return apiRequest<Supplier[]>("/api/inventory/suppliers");
}

export async function updateProductInventorySettings(
  productId: string,
  payload: {
    reorderThreshold?: number;
    supplier?: {
      name: string;
      email?: string;
      phone?: string;
      leadTimeDays?: number;
      supplierSku?: string;
      minOrderQty?: number;
      preferred?: boolean;
    };
  }
) {
  return apiRequest(`/api/inventory/products/${productId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getProductSuppliers(productId: string) {
  return apiRequest<
    Array<{
      productId: string;
      supplierId: string;
      name: string;
      email: string;
      phone: string;
      leadTimeDays: number;
      supplierSku: string;
      minOrderQty: number;
      preferred: boolean;
    }>
  >(`/api/inventory/products/${productId}/suppliers`);
}

