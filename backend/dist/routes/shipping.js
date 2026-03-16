import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { getStorefrontSettings } from "../lib/storeSettings";
export const shippingRouter = Router();
const SAME_DAY_CITY_SET = new Set(["nairobi"]);
const MAJOR_TOWN_SET = new Set([
    "nairobi",
    "mombasa",
    "kisumu",
    "nakuru",
    "eldoret",
    "thika",
    "nyeri",
    "machakos",
    "kiambu",
]);
const QuoteSchema = z.object({
    currency: z.string().optional(),
    destination: z
        .object({
        country: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
    })
        .optional(),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
    })),
    pickup: z.boolean().optional(),
});
shippingRouter.post("/quote", async (req, res, next) => {
    try {
        const body = QuoteSchema.parse(req.body);
        if (body.items.length === 0)
            return res.status(400).json({ message: "No items provided" });
        const productIds = body.items.map((item) => item.productId);
        const { rows } = await pool.query(`SELECT id, weight_kg, length_cm, width_cm, height_cm
       FROM products
       WHERE id = ANY($1::uuid[])`, [productIds]);
        const productMap = new Map(rows.map((row) => [
            row.id,
            {
                weightKg: Number(row.weight_kg ?? 0.5),
                lengthCm: Number(row.length_cm ?? 0),
                widthCm: Number(row.width_cm ?? 0),
                heightCm: Number(row.height_cm ?? 0),
            },
        ]));
        let totalWeight = 0;
        let totalVolWeight = 0;
        for (const item of body.items) {
            const meta = productMap.get(item.productId);
            const weightKg = meta?.weightKg ?? 0.5;
            const length = meta?.lengthCm ?? 0;
            const width = meta?.widthCm ?? 0;
            const height = meta?.heightCm ?? 0;
            const volumetric = length && width && height ? (length * width * height) / 5000 : 0;
            totalWeight += weightKg * item.quantity;
            totalVolWeight += volumetric * item.quantity;
        }
        const billableWeight = Math.max(totalWeight, totalVolWeight, 1);
        const normalizedCity = body.destination?.city?.trim().toLowerCase() ?? "";
        const isSameDayCity = SAME_DAY_CITY_SET.has(normalizedCity);
        const isMajorTown = MAJOR_TOWN_SET.has(normalizedCity);
        const storefrontSettings = await getStorefrontSettings();
        const shippingRates = storefrontSettings.shippingRates;
        const SMALL_ITEM_THRESHOLD_KG = 5;
        const STANDARD_FLAT_RATE = shippingRates.standardHomeDeliveryCents;
        const STANDARD_HEAVY_SURCHARGE_PER_KG = 90;
        const standardRate = billableWeight <= SMALL_ITEM_THRESHOLD_KG
            ? STANDARD_FLAT_RATE
            : Math.round(STANDARD_FLAT_RATE +
                (billableWeight - SMALL_ITEM_THRESHOLD_KG) * STANDARD_HEAVY_SURCHARGE_PER_KG);
        const EXPRESS_BASE_RATE = shippingRates.expressDeliveryCents;
        const EXPRESS_SURCHARGE_PER_KG = 150;
        const citySurcharge = isSameDayCity ? 0 : isMajorTown ? 60 : 120;
        const expressRate = Math.round(EXPRESS_BASE_RATE + citySurcharge + billableWeight * EXPRESS_SURCHARGE_PER_KG);
        const expressEstimate = isSameDayCity
            ? "Same-day delivery (within city)"
            : isMajorTown
                ? "Next-day delivery (major towns)"
                : "Next-day to 2 business days";
        const options = [
            {
                id: "standard",
                label: "Standard Home Delivery",
                amountCents: standardRate,
                deliveryEstimate: "Delivery in 2-5 business days",
            },
            {
                id: "express",
                label: "Express Delivery",
                amountCents: expressRate,
                deliveryEstimate: expressEstimate,
            },
            {
                id: "pickup",
                label: "Click & Collect (Pickup Station)",
                amountCents: 0,
                deliveryEstimate: "Pick up from store branch or warehouse",
            },
        ];
        res.json({
            currency: body.currency ?? "KES",
            billableWeight,
            options,
        });
    }
    catch (err) {
        next(err);
    }
});
