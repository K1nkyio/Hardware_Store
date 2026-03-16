import { z } from "zod";
import { pool } from "../db/pool";

export const PaymentMethodSchema = z.object({
  id: z.enum(["card", "mpesa", "cod"]),
  label: z.string().min(1),
  enabled: z.boolean(),
});

export const StorefrontSettingsSchema = z.object({
  store: z.object({
    storeName: z.string().min(1),
    phone: z.string(),
    email: z.string().email().or(z.literal("")),
    address: z.string(),
  }),
  shippingRates: z.object({
    standardHomeDeliveryCents: z.number().int().nonnegative(),
    expressDeliveryCents: z.number().int().nonnegative(),
  }),
  payment: z.object({
    methods: z.array(PaymentMethodSchema).min(1),
  }),
  tax: z.object({
    taxRatePercent: z.number().min(0).max(100),
    tin: z.string(),
  }),
});

export type StorefrontSettings = z.infer<typeof StorefrontSettingsSchema>;

export const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettings = {
  store: {
    storeName: "Raph Plumbing Supply",
    phone: "+254 700 000 000",
    email: "info@raphplumbing.com",
    address: "Nairobi, Kenya",
  },
  shippingRates: {
    standardHomeDeliveryCents: 450,
    expressDeliveryCents: 1100,
  },
  payment: {
    methods: [
      { id: "card", label: "Credit / Debit Card", enabled: true },
      { id: "mpesa", label: "M-Pesa", enabled: true },
      { id: "cod", label: "Cash on Delivery", enabled: true },
    ],
  },
  tax: {
    taxRatePercent: 16,
    tin: "",
  },
};

const SETTINGS_KEY = "storefront";

async function ensureStorefrontSettingsTable() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY,
      value jsonb NOT NULL DEFAULT '{}'::jsonb,
      updated_at timestamptz NOT NULL DEFAULT now()
    )`
  );
}

function normalizeSettings(input: unknown): StorefrontSettings {
  const parsed = StorefrontSettingsSchema.safeParse(input);
  if (parsed.success) return parsed.data;

  const source = (input ?? {}) as Record<string, unknown>;
  const currentStore = (source.store ?? {}) as Record<string, unknown>;
  const currentShipping = (source.shippingRates ?? {}) as Record<string, unknown>;
  const currentPayment = (source.payment ?? {}) as Record<string, unknown>;
  const currentTax = (source.tax ?? {}) as Record<string, unknown>;

  const resolveShippingRate = (
    primaryKey: string,
    legacyKeys: string[],
    fallback: number
  ) => {
    const primaryValue = currentShipping[primaryKey];
    if (
      typeof primaryValue === "number" &&
      Number.isFinite(primaryValue) &&
      primaryValue >= 0
    ) {
      return Math.round(primaryValue);
    }

    for (const key of legacyKeys) {
      const legacyValue = currentShipping[key];
      if (
        typeof legacyValue === "number" &&
        Number.isFinite(legacyValue) &&
        legacyValue >= 0
      ) {
        return Math.round(legacyValue);
      }
    }

    return fallback;
  };

  const merged: StorefrontSettings = {
    store: {
      storeName:
        typeof currentStore.storeName === "string" && currentStore.storeName.trim()
          ? currentStore.storeName
          : DEFAULT_STOREFRONT_SETTINGS.store.storeName,
      phone:
        typeof currentStore.phone === "string"
          ? currentStore.phone
          : DEFAULT_STOREFRONT_SETTINGS.store.phone,
      email:
        typeof currentStore.email === "string"
          ? currentStore.email
          : DEFAULT_STOREFRONT_SETTINGS.store.email,
      address:
        typeof currentStore.address === "string"
          ? currentStore.address
          : DEFAULT_STOREFRONT_SETTINGS.store.address,
    },
    shippingRates: {
      standardHomeDeliveryCents: resolveShippingRate(
        "standardHomeDeliveryCents",
        ["metroManilaCents", "provincialLuzonCents"],
        DEFAULT_STOREFRONT_SETTINGS.shippingRates.standardHomeDeliveryCents
      ),
      expressDeliveryCents: resolveShippingRate(
        "expressDeliveryCents",
        ["visayasMindanaoCents"],
        DEFAULT_STOREFRONT_SETTINGS.shippingRates.expressDeliveryCents
      ),
    },
    payment: {
      methods: Array.isArray(currentPayment.methods)
        ? currentPayment.methods
            .map((entry) => PaymentMethodSchema.safeParse(entry))
            .filter((entry) => entry.success)
            .map((entry) => entry.data)
        : DEFAULT_STOREFRONT_SETTINGS.payment.methods,
    },
    tax: {
      taxRatePercent:
        typeof currentTax.taxRatePercent === "number" &&
        Number.isFinite(currentTax.taxRatePercent) &&
        currentTax.taxRatePercent >= 0 &&
        currentTax.taxRatePercent <= 100
          ? currentTax.taxRatePercent
          : DEFAULT_STOREFRONT_SETTINGS.tax.taxRatePercent,
      tin:
        typeof currentTax.tin === "string"
          ? currentTax.tin
          : DEFAULT_STOREFRONT_SETTINGS.tax.tin,
    },
  };

  if (merged.payment.methods.length === 0) {
    merged.payment.methods = DEFAULT_STOREFRONT_SETTINGS.payment.methods;
  }

  return StorefrontSettingsSchema.parse(merged);
}

export async function ensureStorefrontSettingsRow() {
  await ensureStorefrontSettingsTable();
  await pool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO NOTHING`,
    [SETTINGS_KEY, JSON.stringify(DEFAULT_STOREFRONT_SETTINGS)]
  );
}

export async function getStorefrontSettings() {
  await ensureStorefrontSettingsRow();
  const result = await pool.query(
    `SELECT value, updated_at::text
     FROM app_settings
     WHERE key = $1`,
    [SETTINGS_KEY]
  );
  const row = result.rows[0];
  const settings = normalizeSettings(row?.value ?? DEFAULT_STOREFRONT_SETTINGS);
  return {
    ...settings,
    updatedAt: row?.updated_at ?? new Date().toISOString(),
  };
}

export async function saveStorefrontSettings(nextSettings: StorefrontSettings) {
  const validated = StorefrontSettingsSchema.parse(nextSettings);
  const result = await pool.query(
    `INSERT INTO app_settings (key, value)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = now()
     RETURNING updated_at::text`,
    [SETTINGS_KEY, JSON.stringify(validated)]
  );

  return {
    ...validated,
    updatedAt: result.rows[0]?.updated_at ?? new Date().toISOString(),
  };
}
