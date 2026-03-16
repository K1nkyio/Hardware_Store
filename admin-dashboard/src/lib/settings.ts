import { apiRequest } from "./api";

export interface SettingsPaymentMethod {
  id: string;
  label: string;
  enabled: boolean;
}

export interface StorefrontSettings {
  store: {
    storeName: string;
    phone: string;
    email: string;
    address: string;
  };
  shippingRates: {
    standardHomeDeliveryCents: number;
    expressDeliveryCents: number;
  };
  payment: {
    methods: SettingsPaymentMethod[];
  };
  tax: {
    taxRatePercent: number;
    tin: string;
  };
  updatedAt: string;
}

export async function getStorefrontSettings(): Promise<StorefrontSettings> {
  return apiRequest<StorefrontSettings>("/api/settings");
}

export async function updateStorefrontSettings(payload: {
  store?: Partial<StorefrontSettings["store"]>;
  shippingRates?: Partial<StorefrontSettings["shippingRates"]>;
  payment?: { methods: SettingsPaymentMethod[] };
  tax?: Partial<StorefrontSettings["tax"]>;
}): Promise<StorefrontSettings> {
  return apiRequest<StorefrontSettings>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
