import { Router } from "express";
import { z } from "zod";
import { config } from "../config";
import { writeAuditLog } from "../lib/audit";
import {
  DEFAULT_STOREFRONT_SETTINGS,
  PaymentMethodSchema,
  getStorefrontSettings,
  saveStorefrontSettings,
} from "../lib/storeSettings";
import { getActor, requireRole } from "../middleware/auth";

export const settingsRouter = Router();

function hasDarajaConfig(): boolean {
  return Boolean(
    config.darajaConsumerKey &&
      config.darajaConsumerSecret &&
      config.darajaShortCode &&
      config.darajaPassKey &&
      config.darajaCallbackUrl &&
      config.darajaCallbackUrl.toLowerCase().startsWith("https://")
  );
}

function hasPesapalConfig(): boolean {
  return Boolean(config.pesapalConsumerKey && config.pesapalConsumerSecret && config.pesapalNotificationId);
}

const StoreSchema = z.object({
  storeName: z.string().min(1),
  phone: z.string(),
  email: z.string().email().or(z.literal("")),
  address: z.string(),
});

const ShippingRatesSchema = z.object({
  standardHomeDeliveryCents: z.number().int().nonnegative(),
  expressDeliveryCents: z.number().int().nonnegative(),
});

const PaymentSchema = z.object({
  methods: z.array(PaymentMethodSchema).min(1),
});

const TaxSchema = z.object({
  taxRatePercent: z.number().min(0).max(100),
  tin: z.string(),
});

const StorefrontPatchSchema = z
  .object({
    store: StoreSchema.partial().optional(),
    shippingRates: ShippingRatesSchema.partial().optional(),
    payment: z
      .object({
        methods: z.array(PaymentMethodSchema).min(1),
      })
      .optional(),
    tax: TaxSchema.partial().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "No settings changes supplied",
  });

settingsRouter.get("/", requireRole("viewer"), async (_req, res, next) => {
  try {
    const settings = await getStorefrontSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

settingsRouter.get("/public", async (_req, res, next) => {
  try {
    const settings = await getStorefrontSettings();
    const paymentMethods = settings.payment.methods.map((method) => {
      if (method.id === "mpesa" && !hasDarajaConfig()) {
        return { ...method, enabled: false };
      }
      if (method.id === "card" && !hasPesapalConfig()) {
        return { ...method, enabled: false };
      }
      return method;
    });
    res.json({
      store: settings.store,
      payment: { methods: paymentMethods },
      tax: settings.tax,
      updatedAt: settings.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

settingsRouter.put("/", requireRole("super_admin"), async (req, res, next) => {
  try {
    const patch = StorefrontPatchSchema.parse(req.body);
    const current = await getStorefrontSettings();
    const actor = getActor(req);

    const nextSettings = {
      store: {
        ...current.store,
        ...(patch.store ?? {}),
      },
      shippingRates: {
        ...current.shippingRates,
        ...(patch.shippingRates ?? {}),
      },
      payment: patch.payment
        ? {
            methods: patch.payment.methods,
          }
        : current.payment,
      tax: {
        ...current.tax,
        ...(patch.tax ?? {}),
      },
    };

    const saved = await saveStorefrontSettings(nextSettings);
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "settings.updated",
      entityType: "settings",
      entityId: "storefront",
      details: {
        changedKeys: Object.keys(patch),
      },
    });

    res.json(saved);
  } catch (err) {
    next(err);
  }
});

settingsRouter.post("/reset", requireRole("super_admin"), async (req, res, next) => {
  try {
    const actor = getActor(req);
    const saved = await saveStorefrontSettings(DEFAULT_STOREFRONT_SETTINGS);
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "settings.reset",
      entityType: "settings",
      entityId: "storefront",
    });
    res.json(saved);
  } catch (err) {
    next(err);
  }
});
