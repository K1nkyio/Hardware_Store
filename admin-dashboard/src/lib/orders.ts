import { apiRequest } from "@/lib/api";

export type OrderStatus =
  | "pending"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled";

export type AdminOrderListItem = {
  id: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  currency: string;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  shippingMethod: string;
  shippingAddress: Record<string, unknown> | null;
  billingAddress: Record<string, unknown> | null;
  notes: string;
  tags: string[];
  slaDueAt: string;
  shippedAt: string;
  trackingNumber: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrderListResponse = {
  items: AdminOrderListItem[];
  pipeline: Array<{ status: OrderStatus; count: number }>;
};

export type AdminOrderDetail = AdminOrderListItem & {
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    priceCents: number;
    currency: string;
    backordered: boolean;
    backorderEtaDays: number | null;
  }>;
};

export async function listOrders(params: {
  status?: string;
  q?: string;
  limit?: number;
} = {}): Promise<AdminOrderListResponse> {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.q) search.set("q", params.q);
  if (typeof params.limit === "number") search.set("limit", String(params.limit));
  const query = search.toString();
  return apiRequest<AdminOrderListResponse>(`/api/orders${query ? `?${query}` : ""}`);
}

export async function getOrder(orderId: string): Promise<AdminOrderDetail> {
  return apiRequest<AdminOrderDetail>(`/api/orders/${orderId}`);
}

export async function updateOrder(
  orderId: string,
  payload: {
    status?: OrderStatus;
    notes?: string;
    tags?: string[];
    trackingNumber?: string;
    slaDueAt?: string;
  }
): Promise<{
  id: string;
  status: OrderStatus;
  notes: string;
  tags: string[];
  slaDueAt: string;
  shippedAt: string;
  trackingNumber: string;
  updatedAt: string;
}> {
  return apiRequest(`/api/orders/${orderId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function markOrderShipped(orderId: string, trackingNumber?: string) {
  return apiRequest<{
    id: string;
    status: OrderStatus;
    shippedAt: string;
    trackingNumber: string;
    updatedAt: string;
  }>(`/api/orders/${orderId}/mark-shipped`, {
    method: "POST",
    body: JSON.stringify({ trackingNumber }),
  });
}

export async function getOrderInvoice(orderId: string): Promise<{
  invoiceNumber: string;
  issuedAt: string;
  order: {
    id: string;
    createdAt: string;
    status: OrderStatus;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    currency: string;
    subtotalCents: number;
    taxCents: number;
    shippingCents: number;
    totalCents: number;
    shippingMethod: string;
    shippingAddress: Record<string, unknown> | null;
    billingAddress: Record<string, unknown> | null;
  };
  items: Array<{
    productName: string;
    sku: string;
    quantity: number;
    priceCents: number;
    currency: string;
  }>;
}> {
  return apiRequest(`/api/orders/${orderId}/invoice`);
}

export function formatMoney(currency: string, cents: number) {
  const normalizedCurrency = (currency || "USD").toUpperCase();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: normalizedCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

