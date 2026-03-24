const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5001";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");
const CUSTOMER_AUTH_BASE_PATH = "/api/auth";
const CUSTOMER_SESSION_HINT_KEY = "customer_session_hint";
let userAccessToken = "";
let refreshPromise: Promise<boolean> | null = null;

function buildApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string };
    if (data.message) return data.message;
  } catch {
    // Ignore parse errors and fallback to status text.
  }

  return response.statusText || "Request failed";
}

export type AuthRole = "customer" | "viewer" | "manager" | "super_admin";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: AuthRole;
  isActive: boolean;
  phone?: string;
  address?: string;
  accountType?: "customer" | "contractor" | "company";
  companyName?: string;
  companyRole?: string;
  taxId?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresIn?: number;
  mfaSetupRequired?: boolean;
}

export interface CustomerOrderSummary {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  currency: string;
  totalCents: number;
  shippingMethod: string;
  itemCount: number;
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  label: string;
  paymentType: "card" | "mpesa";
  brand: string;
  last4: string;
  expMonth: number | null;
  expYear: number | null;
  provider: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function markCustomerSessionHint(present: boolean): void {
  if (!isBrowser()) return;
  if (present) {
    window.localStorage.setItem(CUSTOMER_SESSION_HINT_KEY, "1");
    return;
  }
  window.localStorage.removeItem(CUSTOMER_SESSION_HINT_KEY);
}

function hasCustomerSessionHint(): boolean {
  if (!isBrowser()) return false;
  return window.localStorage.getItem(CUSTOMER_SESSION_HINT_KEY) === "1";
}

export function getUserAccessToken(): string {
  return userAccessToken;
}

export function setUserSession(session: AuthSession): void {
  userAccessToken = session.accessToken;
  markCustomerSessionHint(true);
}

export function clearUserSession(): void {
  userAccessToken = "";
  markCustomerSessionHint(false);
}

function isCustomerAuthPath(path: string): boolean {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      return new URL(path).pathname.startsWith(`${CUSTOMER_AUTH_BASE_PATH}/`);
    } catch {
      return false;
    }
  }
  return path.startsWith(`${CUSTOMER_AUTH_BASE_PATH}/`);
}

async function refreshCustomerAccessToken(): Promise<boolean> {
  if (!isBrowser()) return false;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(buildApiUrl(`${CUSTOMER_AUTH_BASE_PATH}/refresh`), {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        clearUserSession();
        return false;
      }

      const payload = (await response.json()) as { accessToken?: string };
      if (!payload.accessToken) {
        clearUserSession();
        return false;
      }

      userAccessToken = payload.accessToken;
      markCustomerSessionHint(true);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function restoreCustomerSession(): Promise<boolean> {
  if (getUserAccessToken()) return true;
  if (!hasCustomerSessionHint()) return false;
  return refreshCustomerAccessToken();
}

async function apiRequestInternal<T>(path: string, init: RequestInit = {}, allowAuthRetry = true): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getUserAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && allowAuthRetry && !isCustomerAuthPath(path)) {
    const refreshed = await refreshCustomerAccessToken();
    if (refreshed) {
      return apiRequestInternal<T>(path, init, false);
    }
    clearUserSession();
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  return apiRequestInternal<T>(path, init, true);
}

export function resolveAssetUrl(value?: string): string {
  if (!value) return "";
  return buildApiUrl(value);
}

export async function registerCustomer(payload: {
  email: string;
  username: string;
  password: string;
  fullName?: string;
}): Promise<{ user: AuthUser; verificationRequired: boolean; verificationToken?: string }> {
  return apiRequest<{ user: AuthUser; verificationRequired: boolean; verificationToken?: string }>(
    `${CUSTOMER_AUTH_BASE_PATH}/register`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function verifyCustomerEmail(token: string): Promise<void> {
  await apiRequest<void>(`${CUSTOMER_AUTH_BASE_PATH}/verify-email`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function loginCustomer(email: string, password: string): Promise<AuthSession> {
  const session = await apiRequest<AuthSession>(`${CUSTOMER_AUTH_BASE_PATH}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setUserSession(session);
  return session;
}

export async function requestCustomerPasswordReset(email: string): Promise<{ ok: boolean; resetToken?: string }> {
  return apiRequest<{ ok: boolean; resetToken?: string }>(`${CUSTOMER_AUTH_BASE_PATH}/request-password-reset`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function logoutCustomer(allSessions = false): Promise<void> {
  await apiRequest<void>(`${CUSTOMER_AUTH_BASE_PATH}/logout`, {
    method: "POST",
    body: JSON.stringify({
      allSessions,
    }),
  });
  clearUserSession();
}

export async function getCurrentUser(): Promise<{ user: AuthUser; source: string }> {
  return apiRequest<{ user: AuthUser; source: string }>(`${CUSTOMER_AUTH_BASE_PATH}/me`);
}

export async function getAccountProfile(): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>("/api/account/profile");
}

export async function updateAccountProfile(payload: {
  fullName?: string;
  phone?: string;
  address?: string;
  accountType?: "customer" | "contractor" | "company";
  companyName?: string;
  companyRole?: string;
  taxId?: string;
}): Promise<{ user: AuthUser }> {
  return apiRequest<{ user: AuthUser }>("/api/account/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changeAccountPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiRequest<void>("/api/account/password", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAccount(payload: { password: string }): Promise<void> {
  await apiRequest<void>("/api/account", {
    method: "DELETE",
    body: JSON.stringify(payload),
  });
}

export async function getAccountOrders(): Promise<CustomerOrderSummary[]> {
  const data = await apiRequest<{ items: CustomerOrderSummary[] }>("/api/account/orders");
  return data.items;
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const data = await apiRequest<{ methods: PaymentMethod[] }>("/api/account/payment-methods");
  return data.methods;
}

export async function createPaymentMethod(payload: {
  label: string;
  paymentType?: "card" | "mpesa";
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  provider?: string;
  providerToken?: string;
  isDefault?: boolean;
}): Promise<PaymentMethod> {
  const data = await apiRequest<{ method: PaymentMethod }>("/api/account/payment-methods", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.method;
}

export async function updatePaymentMethod(
  id: string,
  payload: {
    label?: string;
    paymentType?: "card" | "mpesa";
    brand?: string;
    last4?: string;
    expMonth?: number;
    expYear?: number;
    provider?: string;
    providerToken?: string;
    isDefault?: boolean;
  }
): Promise<PaymentMethod> {
  const data = await apiRequest<{ method: PaymentMethod }>(`/api/account/payment-methods/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.method;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await apiRequest<void>(`/api/account/payment-methods/${id}`, {
    method: "DELETE",
  });
}

export interface WishlistItem {
  productId: string;
  name: string;
  sku: string;
  category: string;
  priceCents: number;
  currency: string;
  stock: number;
  imageUrl: string;
  createdAt: string;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const data = await apiRequest<{ items: WishlistItem[] }>("/api/account/wishlist");
  return data.items.map((item) => ({
    ...item,
    imageUrl: resolveAssetUrl(item.imageUrl),
  }));
}

export async function addWishlistItem(productId: string): Promise<void> {
  await apiRequest<void>("/api/account/wishlist", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function removeWishlistItem(productId: string): Promise<void> {
  await apiRequest<void>(`/api/account/wishlist/${productId}`, {
    method: "DELETE",
  });
}

function mapProduct(product: Product): Product {
  const rawImageUrls = Array.isArray((product as { imageUrls?: unknown }).imageUrls)
    ? ((product as { imageUrls?: unknown }).imageUrls as string[])
    : [];
  const resolvedPrimaryImage = resolveAssetUrl(product.imageUrl);
  const resolvedImageUrls = rawImageUrls
    .map((value) => resolveAssetUrl(value))
    .filter(Boolean);
  const uniqueImageUrls = Array.from(new Set([resolvedPrimaryImage, ...resolvedImageUrls].filter(Boolean)));

  return {
    ...product,
    imageUrl: resolvedPrimaryImage,
    imageUrls: uniqueImageUrls,
    brand: product.brand ?? "",
    material: product.material ?? "",
    size: product.size ?? "",
    voltage: product.voltage ?? "",
    finish: product.finish ?? "",
    compatibility: product.compatibility ?? "",
    warranty: product.warranty ?? "",
    safetyInfo: product.safetyInfo ?? "",
    specs: product.specs ?? {},
    manuals: (product.manuals ?? []).map((manual) => ({
      ...manual,
      url: resolveAssetUrl(manual.url),
    })),
    bundles: (product.bundles ?? []).map((bundle) => ({
      ...bundle,
      imageUrl: resolveAssetUrl(bundle.imageUrl),
    })),
    weightKg: product.weightKg ?? 0,
    lengthCm: product.lengthCm ?? 0,
    widthCm: product.widthCm ?? 0,
    heightCm: product.heightCm ?? 0,
    backorderable: product.backorderable ?? false,
    backorderEtaDays: product.backorderEtaDays ?? null,
  };
}

export function formatProductPrice(product: Pick<Product, "priceCents" | "currency">): string {
  const amount = product.priceCents / 100;
  const normalizedCurrency = (product.currency || "USD").toUpperCase();

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

// Product API functions
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  brand: string;
  material: string;
  size: string;
  voltage: string;
  finish: string;
  compatibility: string;
  warranty: string;
  safetyInfo: string;
  specs: Record<string, string | number | boolean>;
  manuals: { label: string; url: string; fileType?: string }[];
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  backorderable: boolean;
  backorderEtaDays: number | null;
  priceCents: number;
  currency: string;
  stock: number;
  status: string;
  imageUrl: string;
  imageUrls?: string[];
  badges?: string[];
  isNew?: boolean;
  isBestSeller?: boolean;
  isLowStock?: boolean;
  branchInventory?: Array<{
    branchId: string;
    slug: string;
    name: string;
    city: string;
    address: string;
    phone: string;
    pickupEnabled: boolean;
    stock: number;
    pickupEta: string;
  }>;
  pickupLocations?: Array<{
    branchId: string;
    slug: string;
    name: string;
    city: string;
    address: string;
    phone: string;
    pickupEnabled: boolean;
    stock: number;
    pickupEta: string;
  }>;
  bulkPricing?: Array<{
    minQuantity: number;
    priceCents: number;
    label: string;
  }>;
  bundles?: Array<{
    productId: string;
    sku: string;
    name: string;
    imageUrl: string;
    bundlePriceCents: number | null;
    label: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export async function getProducts(params?: {
  status?: string;
  category?: string;
  brand?: string;
  material?: string;
  size?: string;
  voltage?: string;
  finish?: string;
  compatibility?: string;
  inStock?: boolean;
  q?: string;
  sort?: string;
  pickupCity?: string;
  priceMin?: string;
  priceMax?: string;
  createdAfter?: string;
  createdBefore?: string;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.category) searchParams.append("category", params.category);
  if (params?.brand) searchParams.append("brand", params.brand);
  if (params?.material) searchParams.append("material", params.material);
  if (params?.size) searchParams.append("size", params.size);
  if (params?.voltage) searchParams.append("voltage", params.voltage);
  if (params?.finish) searchParams.append("finish", params.finish);
  if (params?.compatibility) searchParams.append("compatibility", params.compatibility);
  if (typeof params?.inStock === "boolean") searchParams.append("inStock", String(params.inStock));
  if (params?.q) searchParams.append("q", params.q);
  if (params?.sort) searchParams.append("sort", params.sort);
  if (params?.pickupCity) searchParams.append("pickupCity", params.pickupCity);
  if (params?.priceMin) searchParams.append("priceMin", params.priceMin);
  if (params?.priceMax) searchParams.append("priceMax", params.priceMax);
  if (params?.createdAfter) searchParams.append("createdAfter", params.createdAfter);
  if (params?.createdBefore) searchParams.append("createdBefore", params.createdBefore);
  
  const query = searchParams.toString();
  const data = await apiRequest<Product[]>(`/api/products${query ? `?${query}` : ""}`);
  return data.map(mapProduct);
}

export async function getProduct(id: string): Promise<Product> {
  const data = await apiRequest<Product>(`/api/products/${id}`);
  return mapProduct(data);
}

export async function getProductsBulk(ids: string[]): Promise<Product[]> {
  const data = await apiRequest<Product[]>("/api/products/bulk", {
    method: "POST",
    body: JSON.stringify({ ids }),
  });
  return data.map(mapProduct);
}

export interface ProductFacetEntry {
  value: string;
  count: number;
}

export interface ProductFacets {
  total: number;
  categories: ProductFacetEntry[];
  brands: ProductFacetEntry[];
  materials: ProductFacetEntry[];
  voltages: ProductFacetEntry[];
  finishes: ProductFacetEntry[];
  compatibilities: ProductFacetEntry[];
  availability: {
    inStock: number;
    outOfStock: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
}

export async function getProductFacets(params?: {
  status?: string;
  category?: string;
  brand?: string;
  material?: string;
  size?: string;
  voltage?: string;
  finish?: string;
  compatibility?: string;
  inStock?: boolean;
  q?: string;
  pickupCity?: string;
  priceMin?: string;
  priceMax?: string;
}): Promise<ProductFacets> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.append("status", params.status);
  if (params?.category) searchParams.append("category", params.category);
  if (params?.brand) searchParams.append("brand", params.brand);
  if (params?.material) searchParams.append("material", params.material);
  if (params?.size) searchParams.append("size", params.size);
  if (params?.voltage) searchParams.append("voltage", params.voltage);
  if (params?.finish) searchParams.append("finish", params.finish);
  if (params?.compatibility) searchParams.append("compatibility", params.compatibility);
  if (typeof params?.inStock === "boolean") searchParams.append("inStock", String(params.inStock));
  if (params?.q) searchParams.append("q", params.q);
  if (params?.pickupCity) searchParams.append("pickupCity", params.pickupCity);
  if (params?.priceMin) searchParams.append("priceMin", params.priceMin);
  if (params?.priceMax) searchParams.append("priceMax", params.priceMax);

  const query = searchParams.toString();
  return apiRequest<ProductFacets>(`/api/products/facets${query ? `?${query}` : ""}`);
}

export interface ProductSearchSuggestion {
  productId?: string;
  label: string;
  sku?: string;
  category?: string;
  imageUrl?: string;
  highlight?: string;
  type: "popular" | "alias" | "sku" | "product";
}

export async function getProductSearchSuggestions(q: string): Promise<ProductSearchSuggestion[]> {
  const data = await apiRequest<{ items: ProductSearchSuggestion[] }>(
    `/api/products/search/suggest?q=${encodeURIComponent(q)}`
  );
  return data.items.map((item) => ({
    ...item,
    imageUrl: resolveAssetUrl(item.imageUrl),
  }));
}

export async function getRecommendations(params?: {
  productId?: string;
  sessionId?: string;
  limit?: number;
}): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  if (params?.productId) searchParams.append("productId", params.productId);
  if (params?.sessionId) searchParams.append("sessionId", params.sessionId);
  if (typeof params?.limit === "number") searchParams.append("limit", String(params.limit));
  const query = searchParams.toString();
  const data = await apiRequest<{ items: Product[] }>(`/api/products/recommendations${query ? `?${query}` : ""}`);
  return data.items.map(mapProduct);
}

export interface ProductReview {
  id: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  verified: boolean;
  createdAt: string;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  question: string;
  answer: string;
  authorName: string;
  authorEmail: string;
  createdAt: string;
  answeredAt: string;
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  return apiRequest<ProductReview[]>(`/api/products/${productId}/reviews`);
}

export async function createProductReview(
  productId: string,
  payload: {
    rating: number;
    title?: string;
    body: string;
    authorName: string;
  }
): Promise<ProductReview> {
  return apiRequest<ProductReview>(`/api/products/${productId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProductQuestions(productId: string): Promise<ProductQuestion[]> {
  return apiRequest<ProductQuestion[]>(`/api/products/${productId}/questions`);
}

export async function createProductQuestion(
  productId: string,
  payload: {
    question: string;
    authorName: string;
    authorEmail?: string;
  }
): Promise<ProductQuestion> {
  return apiRequest<ProductQuestion>(`/api/products/${productId}/questions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface ShippingQuoteItem {
  productId: string;
  quantity: number;
}

export interface ShippingOption {
  id: string;
  label: string;
  amountCents: number;
  deliveryEstimate: string;
}

export interface ShippingQuote {
  currency: string;
  billableWeight: number;
  options: ShippingOption[];
}

export interface StorefrontPublicSettings {
  store: {
    storeName: string;
    phone: string;
    email: string;
    address: string;
  };
  payment: {
    methods: Array<{
      id: string;
      label: string;
      enabled: boolean;
    }>;
  };
  tax: {
    taxRatePercent: number;
    tin: string;
  };
  updatedAt: string;
}

export async function getShippingQuote(payload: {
  currency: string;
  items: ShippingQuoteItem[];
  destination?: {
    country?: string;
    postalCode?: string;
    city?: string;
  };
  pickup?: boolean;
}): Promise<ShippingQuote> {
  return apiRequest<ShippingQuote>("/api/shipping/quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getStorefrontPublicSettings(): Promise<StorefrontPublicSettings> {
  return apiRequest<StorefrontPublicSettings>("/api/settings/public");
}

export interface OrderItemRequest {
  productId: string;
  quantity: number;
}

export interface OrderResponse {
  id: string;
  currency: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReference?: string;
  promoCode?: string;
  discountCents?: number;
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    priceCents: number;
    currency: string;
    backordered: boolean;
    backorderEtaDays: number | null;
  }>;
}

export async function createOrder(payload: {
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  items: OrderItemRequest[];
  shippingMethod?: string;
  shippingAddress?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  totals: {
    taxCents: number;
    shippingCents: number;
  };
  promo?: {
    code: string;
    discountCents?: number;
  };
  payment?: {
    method: "card" | "mpesa" | "cod";
    provider: string;
    txRef: string;
    transactionId: string;
    status: string;
    amountCents: number;
    currency: string;
    verifiedAt?: string;
    metadata?: Record<string, unknown>;
  };
}): Promise<OrderResponse> {
  return apiRequest<OrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface InitializePaymentResponse {
  provider: "daraja" | "pesapal";
  method: "card" | "mpesa";
  txRef: string;
  transactionId: string;
  checkoutUrl?: string;
  pending?: boolean;
  message?: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  provider: string;
  method: "card" | "mpesa";
  transactionId: string;
  txRef: string;
  status: string;
  amountCents: number;
  currency: string;
  paymentType: string;
  processorResponse: string;
  customerEmail: string;
}

export async function initializeCheckoutPayment(payload: {
  method: "card" | "mpesa";
  amountCents: number;
  currency: string;
  customer: {
    email: string;
    fullName: string;
    phone?: string;
  };
  metadata?: Record<string, unknown>;
}): Promise<InitializePaymentResponse> {
  return apiRequest<InitializePaymentResponse>("/api/payments/initialize", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyCheckoutPayment(payload: {
  method: "card" | "mpesa";
  txRef: string;
  transactionId: string;
  expectedAmountCents: number;
  expectedCurrency: string;
}): Promise<VerifyPaymentResponse> {
  return apiRequest<VerifyPaymentResponse>("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface CustomerInquiry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  orderNumber: string;
  message: string;
  status: "pending" | "in_review" | "resolved" | "spam";
  moderationNote: string;
  moderatedBy: string;
  moderatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export async function submitCustomerInquiry(payload: {
  firstName: string;
  lastName: string;
  email: string;
  orderNumber?: string;
  message: string;
}): Promise<CustomerInquiry> {
  return apiRequest<CustomerInquiry>("/api/customer-care/inquiries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function trackAnalyticsEvent(payload: {
  eventName: string;
  sessionId?: string;
  userEmail?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await apiRequest<void>("/api/analytics/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function upsertAbandonedCart(payload: {
  customerEmail: string;
  currency: string;
  subtotalCents: number;
  cartItems: Array<{ productId: string; name: string; quantity: number }>;
}): Promise<void> {
  await apiRequest<void>("/api/marketing/abandoned-cart", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface PromoValidationResult {
  valid: boolean;
  message: string;
  code: string;
  description?: string;
  discountCents: number;
}

export async function validatePromoCode(payload: {
  code: string;
  subtotalCents: number;
  accountType?: "customer" | "contractor" | "company";
  userId?: string;
}): Promise<PromoValidationResult> {
  return apiRequest<PromoValidationResult>("/api/marketing/promos/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface QuoteRequest {
  id: string;
  productId: string;
  branchId: string;
  productName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  accountType: "customer" | "contractor" | "company";
  quantity: number;
  notes: string;
  status: string;
  createdAt: string;
}

export async function createQuoteRequest(payload: {
  productId?: string;
  branchId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  companyName?: string;
  accountType?: "customer" | "contractor" | "company";
  quantity: number;
  notes?: string;
}): Promise<QuoteRequest> {
  const data = await apiRequest<{ quote: QuoteRequest }>("/api/quotes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.quote;
}

export async function getMyQuoteRequests(): Promise<QuoteRequest[]> {
  const data = await apiRequest<{ items: QuoteRequest[] }>("/api/quotes/mine");
  return data.items;
}
