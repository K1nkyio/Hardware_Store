import { apiRequest, resolveAssetUrl } from "@/lib/api";

export type ProductStatus = "active" | "draft" | "out_of_stock";

type ProductDto = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  compatibility: string;
  warranty: string;
  safetyInfo: string;
  priceCents: number;
  currency: string;
  stock: number;
  reorderThreshold?: number;
  status: ProductStatus;
  imageUrl: string;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

export type Product = ProductDto & {
  imageUrl: string;
  imageUrls: string[];
};

export type ListProductsParams = {
  status?: ProductStatus;
  category?: string;
  createdAfter?: string;
  createdBefore?: string;
};

export type UpsertProductInput = {
  name: string;
  sku?: string;
  category?: string;
  description?: string;
  compatibility?: string;
  warranty?: string;
  safetyInfo?: string;
  priceCents: number;
  currency?: string;
  stock: number;
  status: ProductStatus;
  imageUrl?: string;
  imageUrls?: string[];
};

export type BulkProductUpdateInput = {
  ids: string[];
  setStatus?: ProductStatus;
  setStock?: number;
  stockDelta?: number;
  setPriceCents?: number;
  priceDeltaCents?: number;
};

function mapProduct(product: ProductDto): Product {
  const resolvedPrimaryImage = resolveAssetUrl(product.imageUrl);
  const resolvedImageUrls = (product.imageUrls ?? [])
    .map((value) => resolveAssetUrl(value))
    .filter(Boolean);
  const imageUrls = Array.from(new Set([resolvedPrimaryImage, ...resolvedImageUrls].filter(Boolean)));

  return {
    ...product,
    imageUrl: resolvedPrimaryImage,
    imageUrls,
  };
}

export async function listProducts(params: ListProductsParams = {}): Promise<Product[]> {
  const search = new URLSearchParams();

  if (params.status) search.set("status", params.status);
  if (params.category) search.set("category", params.category);
  if (params.createdAfter) search.set("createdAfter", params.createdAfter);
  if (params.createdBefore) search.set("createdBefore", params.createdBefore);

  const qs = search.toString();
  const path = qs ? `/api/products?${qs}` : "/api/products";
  const data = await apiRequest<ProductDto[]>(path);
  return data.map(mapProduct);
}

export async function createProduct(payload: UpsertProductInput): Promise<Product> {
  const data = await apiRequest<ProductDto>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapProduct(data);
}

export async function updateProduct(productId: string, payload: Partial<UpsertProductInput>): Promise<Product> {
  const data = await apiRequest<ProductDto>(`/api/products/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return mapProduct(data);
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiRequest<void>(`/api/products/${productId}`, {
    method: "DELETE",
  });
}

export async function bulkUpdateProducts(payload: BulkProductUpdateInput): Promise<{
  updatedCount: number;
  ids: string[];
}> {
  return apiRequest("/api/products/bulk/update", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const data = await apiRequest<{ url: string }>("/api/uploads", {
    method: "POST",
    body: formData,
  });

  return resolveAssetUrl(data.url);
}

export function formatProductPrice(product: Pick<Product, "priceCents" | "currency">): string {
  const amount = product.priceCents / 100;
  const normalizedCurrency = (product.currency || "KES").toUpperCase();

  const localeByCurrency: Record<string, string> = {
    KES: "en-KE",
    USD: "en-US",
    EUR: "de-DE",
    GBP: "en-GB",
    PHP: "en-PH",
  };

  return new Intl.NumberFormat(localeByCurrency[normalizedCurrency] ?? "en-US", {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
