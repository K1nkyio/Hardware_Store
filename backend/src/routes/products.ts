import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool";
import { getActor, requireRole } from "../middleware/auth";
import { writeAuditLog } from "../lib/audit";

export const productsRouter = Router();

const LOW_STOCK_THRESHOLD = Number(process.env.LOW_STOCK_THRESHOLD ?? "5");

const ManualSchema = z.object({
  label: z.string(),
  url: z.string(),
  fileType: z.string().optional(),
});

const SpecsSchema = z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]));

const ProductRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string().nullable(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  brand: z.string().nullable(),
  material: z.string().nullable(),
  size: z.string().nullable(),
  voltage: z.string().nullable(),
  finish: z.string().nullable(),
  compatibility: z.string().nullable(),
  warranty: z.string().nullable(),
  safety_info: z.string().nullable(),
  specs: SpecsSchema.nullable(),
  manuals: z.array(ManualSchema).nullable(),
  weight_kg: z.coerce.number().nullable(),
  length_cm: z.coerce.number().nullable(),
  width_cm: z.coerce.number().nullable(),
  height_cm: z.coerce.number().nullable(),
  backorderable: z.boolean().nullable(),
  backorder_eta_days: z.number().int().nullable(),
  price_cents: z.number().int(),
  currency: z.string(),
  stock: z.number().int(),
  reorder_threshold: z.number().int().nullable(),
  status: z.string(),
  image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

type ProductRow = z.infer<typeof ProductRowSchema>;

type ProductBranchInventory = {
  branchId: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  pickupEnabled: boolean;
  stock: number;
  pickupEta: string;
};

type ProductBulkPrice = {
  minQuantity: number;
  priceCents: number;
  label: string;
};

type ProductBundle = {
  productId: string;
  sku: string;
  name: string;
  imageUrl: string;
  bundlePriceCents: number | null;
  label: string;
};

type ProductCatalogMetadata = {
  bestsellerIds: Set<string>;
  branchInventory: Map<string, ProductBranchInventory[]>;
  bulkPricing: Map<string, ProductBulkPrice[]>;
  bundles: Map<string, ProductBundle[]>;
};

function extractImageUrlsFromSpecs(specs: z.infer<typeof SpecsSchema> | null): string[] {
  if (!specs) return [];
  const candidate = (specs as Record<string, unknown>).imageUrls;
  if (!Array.isArray(candidate)) return [];

  return candidate
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function computeBadges(row: ProductRow, bestsellerIds: Set<string>) {
  const reorderThreshold = row.reorder_threshold ?? LOW_STOCK_THRESHOLD;
  const isLowStock = row.stock > 0 && row.stock <= reorderThreshold;
  const isNew = Date.now() - new Date(row.created_at).getTime() <= 45 * 24 * 60 * 60 * 1000;
  const isBestSeller = bestsellerIds.has(row.id);
  return {
    isLowStock,
    isNew,
    isBestSeller,
    labels: [
      isBestSeller ? "Bestseller" : "",
      isNew ? "New" : "",
      isLowStock ? "Low stock" : "",
    ].filter(Boolean),
  };
}

async function getProductCatalogMetadata(productIds: string[]): Promise<ProductCatalogMetadata> {
  if (productIds.length === 0) {
    return {
      bestsellerIds: new Set<string>(),
      branchInventory: new Map<string, ProductBranchInventory[]>(),
      bulkPricing: new Map<string, ProductBulkPrice[]>(),
      bundles: new Map<string, ProductBundle[]>(),
    };
  }

  const [branchRows, bulkRows, bundleRows, bestsellerRows] = await Promise.all([
    pool.query(
      `SELECT
        pbi.product_id::text,
        bl.id::text AS branch_id,
        bl.slug,
        bl.name,
        bl.city,
        bl.address,
        bl.phone,
        bl.pickup_enabled,
        pbi.stock,
        pbi.pickup_eta
       FROM product_branch_inventory pbi
       INNER JOIN branch_locations bl ON bl.id = pbi.branch_id
       WHERE pbi.product_id = ANY($1::uuid[])
       ORDER BY bl.city, bl.name`,
      [productIds]
    ),
    pool.query(
      `SELECT product_id::text, min_quantity, price_cents, label
       FROM product_bulk_pricing
       WHERE product_id = ANY($1::uuid[])
       ORDER BY min_quantity ASC`,
      [productIds]
    ),
    pool.query(
      `SELECT
        pb.product_id::text,
        linked.id::text AS bundled_product_id,
        COALESCE(linked.sku, '') AS sku,
        linked.name,
        COALESCE(linked.image_url, '') AS image_url,
        pb.bundle_price_cents,
        COALESCE(pb.label, linked.name) AS label
       FROM product_bundles pb
       INNER JOIN products linked ON linked.id = pb.bundled_product_id
       WHERE pb.product_id = ANY($1::uuid[])`,
      [productIds]
    ),
    pool.query(
      `SELECT oi.product_id::text, SUM(oi.quantity)::int AS sold
       FROM order_items oi
       INNER JOIN orders o ON o.id = oi.order_id
       WHERE oi.product_id = ANY($1::uuid[])
         AND o.status <> 'cancelled'
       GROUP BY oi.product_id
       ORDER BY sold DESC
       LIMIT 12`,
      [productIds]
    ),
  ]);

  const branchInventory = new Map<string, ProductBranchInventory[]>();
  for (const row of branchRows.rows) {
    const list = branchInventory.get(row.product_id) ?? [];
    list.push({
      branchId: row.branch_id,
      slug: row.slug,
      name: row.name,
      city: row.city,
      address: row.address,
      phone: row.phone ?? "",
      pickupEnabled: Boolean(row.pickup_enabled),
      stock: Number(row.stock ?? 0),
      pickupEta: row.pickup_eta ?? "",
    });
    branchInventory.set(row.product_id, list);
  }

  const bulkPricing = new Map<string, ProductBulkPrice[]>();
  for (const row of bulkRows.rows) {
    const list = bulkPricing.get(row.product_id) ?? [];
    list.push({
      minQuantity: Number(row.min_quantity),
      priceCents: Number(row.price_cents),
      label: row.label ?? "",
    });
    bulkPricing.set(row.product_id, list);
  }

  const bundles = new Map<string, ProductBundle[]>();
  for (const row of bundleRows.rows) {
    const list = bundles.get(row.product_id) ?? [];
    list.push({
      productId: row.bundled_product_id,
      sku: row.sku ?? "",
      name: row.name,
      imageUrl: row.image_url ?? "",
      bundlePriceCents:
        typeof row.bundle_price_cents === "number" ? Number(row.bundle_price_cents) : null,
      label: row.label ?? row.name,
    });
    bundles.set(row.product_id, list);
  }

  return {
    bestsellerIds: new Set(bestsellerRows.rows.map((row) => String(row.product_id))),
    branchInventory,
    bulkPricing,
    bundles,
  };
}

function mapProduct(row: ProductRow, metadata?: ProductCatalogMetadata) {
  const primaryImage = row.image_url ?? "";
  const imageUrls = Array.from(
    new Set([primaryImage, ...extractImageUrlsFromSpecs(row.specs ?? null)].filter(Boolean))
  );
  const branchInventory = metadata?.branchInventory.get(row.id) ?? [];
  const bulkPricing = metadata?.bulkPricing.get(row.id) ?? [];
  const bundles = metadata?.bundles.get(row.id) ?? [];
  const badges = computeBadges(row, metadata?.bestsellerIds ?? new Set<string>());

  return {
    id: row.id,
    name: row.name,
    sku: row.sku ?? "",
    category: row.category ?? "",
    description: row.description ?? "",
    brand: row.brand ?? "",
    material: row.material ?? "",
    size: row.size ?? "",
    voltage: row.voltage ?? "",
    finish: row.finish ?? "",
    compatibility: row.compatibility ?? "",
    warranty: row.warranty ?? "",
    safetyInfo: row.safety_info ?? "",
    specs: row.specs ?? {},
    manuals: row.manuals ?? [],
    weightKg: row.weight_kg ?? 0,
    lengthCm: row.length_cm ?? 0,
    widthCm: row.width_cm ?? 0,
    heightCm: row.height_cm ?? 0,
    backorderable: row.backorderable ?? false,
    backorderEtaDays: row.backorder_eta_days ?? null,
    priceCents: row.price_cents,
    currency: row.currency,
    stock: row.stock,
    reorderThreshold: row.reorder_threshold ?? 10,
    status: row.status,
    imageUrl: primaryImage,
    imageUrls,
    badges: badges.labels,
    isNew: badges.isNew,
    isBestSeller: badges.isBestSeller,
    isLowStock: badges.isLowStock,
    branchInventory,
    pickupLocations: branchInventory.filter((entry) => entry.pickupEnabled && entry.stock > 0),
    bulkPricing,
    bundles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type ProductFilters = {
  status?: string;
  category?: string;
  brand?: string;
  material?: string;
  size?: string;
  voltage?: string;
  finish?: string;
  compatibility?: string;
  q?: string;
  inStock?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  pickupCity?: string;
  priceMinCents?: number;
  priceMaxCents?: number;
};

function parseProductFilters(req: { query: Record<string, unknown> }): ProductFilters {
  const inStockRaw = typeof req.query.inStock === "string" ? req.query.inStock : undefined;
  const normalizeMoney = (value: unknown) => {
    if (typeof value !== "string" || value.trim() === "") return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return undefined;
    return Math.round(parsed * 100);
  };

  return {
    status: typeof req.query.status === "string" ? req.query.status : undefined,
    category: typeof req.query.category === "string" ? req.query.category : undefined,
    brand: typeof req.query.brand === "string" ? req.query.brand : undefined,
    material: typeof req.query.material === "string" ? req.query.material : undefined,
    size: typeof req.query.size === "string" ? req.query.size : undefined,
    voltage: typeof req.query.voltage === "string" ? req.query.voltage : undefined,
    finish: typeof req.query.finish === "string" ? req.query.finish : undefined,
    compatibility: typeof req.query.compatibility === "string" ? req.query.compatibility : undefined,
    q: typeof req.query.q === "string" ? req.query.q.trim() : undefined,
    inStock: inStockRaw === "true" ? true : inStockRaw === "false" ? false : undefined,
    createdAfter: typeof req.query.createdAfter === "string" ? req.query.createdAfter : undefined,
    createdBefore: typeof req.query.createdBefore === "string" ? req.query.createdBefore : undefined,
    pickupCity: typeof req.query.pickupCity === "string" ? req.query.pickupCity : undefined,
    priceMinCents: normalizeMoney(req.query.priceMin),
    priceMaxCents: normalizeMoney(req.query.priceMax),
  };
}

function buildProductWhere(filters: ProductFilters) {
  const params: unknown[] = [];
  const where: string[] = [];

  if (filters.status) {
    params.push(filters.status);
    where.push(`status = $${params.length}`);
  }

  if (filters.category) {
    const normalizedCategory = filters.category.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    params.push(`%${normalizedCategory}%`);
    where.push(`regexp_replace(lower(category), '[^a-z0-9]+', ' ', 'g') ILIKE $${params.length}`);
  }

  if (filters.brand) {
    params.push(`%${filters.brand}%`);
    where.push(`brand ILIKE $${params.length}`);
  }

  if (filters.material) {
    params.push(`%${filters.material}%`);
    where.push(`material ILIKE $${params.length}`);
  }

  if (filters.size) {
    params.push(`%${filters.size}%`);
    where.push(`size ILIKE $${params.length}`);
  }

  if (filters.voltage) {
    params.push(`%${filters.voltage}%`);
    where.push(`voltage ILIKE $${params.length}`);
  }

  if (filters.finish) {
    params.push(`%${filters.finish}%`);
    where.push(`finish ILIKE $${params.length}`);
  }

  if (filters.compatibility) {
    params.push(`%${filters.compatibility}%`);
    where.push(`compatibility ILIKE $${params.length}`);
  }

  if (typeof filters.inStock === "boolean") {
    where.push(filters.inStock ? "stock > 0" : "stock <= 0");
  }

  if (typeof filters.priceMinCents === "number") {
    params.push(filters.priceMinCents);
    where.push(`price_cents >= $${params.length}`);
  }

  if (typeof filters.priceMaxCents === "number") {
    params.push(filters.priceMaxCents);
    where.push(`price_cents <= $${params.length}`);
  }

  if (filters.pickupCity) {
    params.push(`%${filters.pickupCity}%`);
    where.push(
      `EXISTS (
        SELECT 1
        FROM product_branch_inventory pbi
        INNER JOIN branch_locations bl ON bl.id = pbi.branch_id
        WHERE pbi.product_id = products.id
          AND pbi.stock > 0
          AND bl.pickup_enabled = true
          AND bl.city ILIKE $${params.length}
      )`
    );
  }

  if (filters.q) {
    params.push(`%${filters.q}%`);
    const idx = params.length;
    where.push(
      `(name ILIKE $${idx}
        OR sku ILIKE $${idx}
        OR category ILIKE $${idx}
        OR brand ILIKE $${idx}
        OR compatibility ILIKE $${idx}
        OR EXISTS (
          SELECT 1 FROM product_search_aliases psa
          WHERE psa.product_id = products.id
            AND psa.alias ILIKE $${idx}
        ))`
    );
  }

  if (filters.createdAfter) {
    const parsed = new Date(filters.createdAfter);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid createdAfter date");
    }
    params.push(parsed.toISOString());
    where.push(`created_at >= $${params.length}::timestamptz`);
  }

  if (filters.createdBefore) {
    const parsed = new Date(filters.createdBefore);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid createdBefore date");
    }
    params.push(parsed.toISOString());
    where.push(`created_at < $${params.length}::timestamptz`);
  }

  return {
    params,
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
  };
}

function buildProductOrderBy(sort: string | undefined, q: string | undefined, params: unknown[]) {
  if (q) {
    params.push(q.toLowerCase());
    const exactIdx = params.length;
    params.push(`%${q}%`);
    const likeIdx = params.length;
    return `ORDER BY
      CASE
        WHEN lower(COALESCE(sku, '')) = $${exactIdx} THEN 0
        WHEN lower(name) = $${exactIdx} THEN 1
        WHEN EXISTS (
          SELECT 1 FROM product_search_aliases psa
          WHERE psa.product_id = products.id
            AND lower(psa.alias) = $${exactIdx}
        ) THEN 2
        WHEN lower(name) LIKE lower($${likeIdx}) THEN 3
        WHEN lower(brand) LIKE lower($${likeIdx}) THEN 4
        ELSE 5
      END,
      created_at DESC`;
  }

  switch (sort) {
    case "price-low":
      return "ORDER BY price_cents ASC, created_at DESC";
    case "price-high":
      return "ORDER BY price_cents DESC, created_at DESC";
    case "name":
      return "ORDER BY name ASC";
    case "newest":
      return "ORDER BY created_at DESC";
    default:
      return "ORDER BY created_at DESC";
  }
}

productsRouter.get("/", async (req, res, next) => {
  try {
    const filters = parseProductFilters(req);
    const { params, whereSql } = buildProductWhere(filters);
    const sort = typeof req.query.sort === "string" ? req.query.sort : undefined;
    const orderBy = buildProductOrderBy(sort, filters.q, params);

    const { rows } = await pool.query(
      `SELECT id, name, sku, category, description, brand, material, size, voltage, finish, compatibility, warranty, safety_info, specs, manuals,
              weight_kg, length_cm, width_cm, height_cm, backorderable, backorder_eta_days,
              price_cents, currency, stock, reorder_threshold, status, image_url, created_at::text, updated_at::text
       FROM products
       ${whereSql}
       ${orderBy}`,
      params
    );

    const parsed = z.array(ProductRowSchema).parse(rows);
    const metadata = await getProductCatalogMetadata(parsed.map((row) => row.id));
    res.json(parsed.map((row) => mapProduct(row, metadata)));
  } catch (err) {
    if (err instanceof Error && /Invalid created(After|Before) date/.test(err.message)) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
});

productsRouter.get("/facets", async (req, res, next) => {
  try {
    const filters = parseProductFilters(req);
    const { params, whereSql } = buildProductWhere(filters);
    const { rows } = await pool.query(
      `SELECT category, brand, material, voltage, finish, compatibility, price_cents, stock
       FROM products
       ${whereSql}`,
      params
    );

    const countsFor = (values: string[]) =>
      Array.from(
        values.reduce<Map<string, number>>((acc, value) => {
          const normalized = value.trim();
          if (!normalized) return acc;
          acc.set(normalized, (acc.get(normalized) ?? 0) + 1);
          return acc;
        }, new Map<string, number>())
      )
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));

    const compatibilities = rows
      .flatMap((row) => String(row.compatibility ?? "").split(/[,/]|(?:\s{2,})/))
      .map((entry) => entry.trim())
      .filter(Boolean);

    res.json({
      total: rows.length,
      categories: countsFor(rows.map((row) => String(row.category ?? ""))),
      brands: countsFor(rows.map((row) => String(row.brand ?? ""))),
      materials: countsFor(rows.map((row) => String(row.material ?? ""))),
      voltages: countsFor(rows.map((row) => String(row.voltage ?? ""))),
      finishes: countsFor(rows.map((row) => String(row.finish ?? ""))),
      compatibilities: countsFor(compatibilities).slice(0, 10),
      availability: {
        inStock: rows.filter((row) => Number(row.stock ?? 0) > 0).length,
        outOfStock: rows.filter((row) => Number(row.stock ?? 0) <= 0).length,
      },
      priceRange: rows.reduce(
        (acc, row) => {
          const price = Number(row.price_cents ?? 0);
          acc.min = Math.min(acc.min, price);
          acc.max = Math.max(acc.max, price);
          return acc;
        },
        { min: rows.length > 0 ? Number(rows[0].price_cents ?? 0) : 0, max: 0 }
      ),
    });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/search/suggest", async (req, res, next) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length < 2) {
      return res.json({
        items: [
          "Conduit fittings",
          "Circuit breakers",
          "Safety helmets",
          "Paint rollers",
          "PVC elbows",
        ].map((label) => ({ label, type: "popular" })),
      });
    }

    const { rows } = await pool.query(
      `SELECT
        p.id::text,
        p.name,
        COALESCE(p.sku, '') AS sku,
        COALESCE(p.category, '') AS category,
        COALESCE(p.image_url, '') AS image_url,
        COALESCE(
          (
            SELECT psa.alias
            FROM product_search_aliases psa
            WHERE psa.product_id = p.id
              AND psa.alias ILIKE $1
            ORDER BY length(psa.alias) ASC
            LIMIT 1
          ),
          ''
        ) AS matched_alias
       FROM products p
       WHERE p.status = 'active'
         AND (
           p.name ILIKE $1
           OR p.sku ILIKE $1
           OR p.brand ILIKE $1
           OR p.category ILIKE $1
           OR EXISTS (
             SELECT 1
             FROM product_search_aliases psa
             WHERE psa.product_id = p.id
               AND psa.alias ILIKE $1
           )
         )
       ORDER BY
         CASE
           WHEN lower(COALESCE(p.sku, '')) = lower($2) THEN 0
           WHEN lower(p.name) = lower($2) THEN 1
           WHEN EXISTS (
             SELECT 1
             FROM product_search_aliases psa
             WHERE psa.product_id = p.id
               AND lower(psa.alias) = lower($2)
           ) THEN 2
           ELSE 3
         END,
         p.created_at DESC
       LIMIT 8`,
      [`%${q}%`, q]
    );

    res.json({
      items: rows.map((row) => ({
        productId: row.id,
        label: row.name,
        sku: row.sku,
        category: row.category,
        imageUrl: row.image_url,
        highlight: row.matched_alias || row.sku || row.category,
        type: row.matched_alias ? "alias" : row.sku ? "sku" : "product",
      })),
    });
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/recommendations", async (req, res, next) => {
  try {
    const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : undefined;
    const limitRaw = typeof req.query.limit === "string" ? Number(req.query.limit) : 8;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 12) : 8;

    let rows;
    if (productId) {
      rows = await pool.query(
        `WITH base AS (
          SELECT category, brand
          FROM products
          WHERE id = $1
        )
        SELECT p.id, p.name, p.sku, p.category, p.description, p.brand, p.material, p.size, p.voltage, p.finish, p.compatibility, p.warranty, p.safety_info, p.specs, p.manuals,
               p.weight_kg, p.length_cm, p.width_cm, p.height_cm, p.backorderable, p.backorder_eta_days,
               p.price_cents, p.currency, p.stock, p.reorder_threshold, p.status, p.image_url, p.created_at::text, p.updated_at::text
        FROM products p
        CROSS JOIN base
        WHERE p.id <> $1
          AND p.status = 'active'
          AND (
            (base.category IS NOT NULL AND p.category = base.category)
            OR (base.brand IS NOT NULL AND p.brand = base.brand)
          )
        ORDER BY p.stock > 0 DESC, p.created_at DESC
        LIMIT $2`,
        [productId, limit]
      );
    } else if (sessionId) {
      rows = await pool.query(
        `WITH viewed_categories AS (
          SELECT DISTINCT payload->>'category' AS category
          FROM analytics_events
          WHERE session_id = $1
            AND event_name = 'product_view'
            AND payload->>'category' IS NOT NULL
          ORDER BY category
          LIMIT 4
        )
        SELECT p.id, p.name, p.sku, p.category, p.description, p.brand, p.material, p.size, p.voltage, p.finish, p.compatibility, p.warranty, p.safety_info, p.specs, p.manuals,
               p.weight_kg, p.length_cm, p.width_cm, p.height_cm, p.backorderable, p.backorder_eta_days,
               p.price_cents, p.currency, p.stock, p.reorder_threshold, p.status, p.image_url, p.created_at::text, p.updated_at::text
        FROM products p
        WHERE p.status = 'active'
          AND EXISTS (
            SELECT 1
            FROM viewed_categories vc
            WHERE vc.category = p.category
          )
        ORDER BY p.stock > 0 DESC, p.created_at DESC
        LIMIT $2`,
        [sessionId, limit]
      );
    } else {
      rows = await pool.query(
        `SELECT id, name, sku, category, description, brand, material, size, voltage, finish, compatibility, warranty, safety_info, specs, manuals,
                weight_kg, length_cm, width_cm, height_cm, backorderable, backorder_eta_days,
                price_cents, currency, stock, reorder_threshold, status, image_url, created_at::text, updated_at::text
         FROM products
         WHERE status = 'active'
         ORDER BY stock > 0 DESC, created_at DESC
         LIMIT $1`,
        [limit]
      );
    }

    const parsed = z.array(ProductRowSchema).parse(rows.rows);
    const metadata = await getProductCatalogMetadata(parsed.map((row) => row.id));
    res.json({ items: parsed.map((row) => mapProduct(row, metadata)) });
  } catch (err) {
    next(err);
  }
});

productsRouter.post("/bulk", async (req, res, next) => {
  try {
    const body = z.object({ ids: z.array(z.string().min(1)).min(1) }).parse(req.body);
    const { rows } = await pool.query(
      `SELECT id, name, sku, category, description, brand, material, size, voltage, finish, compatibility, warranty, safety_info, specs, manuals,
              weight_kg, length_cm, width_cm, height_cm, backorderable, backorder_eta_days,
              price_cents, currency, stock, reorder_threshold, status, image_url, created_at::text, updated_at::text
       FROM products
       WHERE id = ANY($1::uuid[])`,
      [body.ids]
    );
    const parsed = z.array(ProductRowSchema).parse(rows);
    const metadata = await getProductCatalogMetadata(parsed.map((row) => row.id));
    res.json(parsed.map((row) => mapProduct(row, metadata)));
  } catch (err) {
    next(err);
  }
});

const BulkUpdateProductsSchema = z
  .object({
    ids: z.array(z.string().min(1)).min(1),
    setStatus: z.enum(["active", "draft", "out_of_stock"]).optional(),
    setStock: z.number().int().nonnegative().optional(),
    stockDelta: z.number().int().optional(),
    setPriceCents: z.number().int().nonnegative().optional(),
    priceDeltaCents: z.number().int().optional(),
  })
  .refine((value) => {
    const changeKeys = [
      value.setStatus,
      value.setStock,
      value.stockDelta,
      value.setPriceCents,
      value.priceDeltaCents,
    ].filter((entry) => entry !== undefined);
    return changeKeys.length > 0;
  }, "No bulk changes specified");

productsRouter.patch("/bulk/update", requireRole("manager"), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const actor = getActor(req);
    const body = BulkUpdateProductsSchema.parse(req.body);
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT id, stock, price_cents, reorder_threshold
       FROM products
       WHERE id = ANY($1::uuid[])
       FOR UPDATE`,
      [body.ids]
    );

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "No products found for bulk update" });
    }

    const affectedIds: string[] = [];
    for (const row of rows) {
      const currentStock = Number(row.stock);
      const currentPrice = Number(row.price_cents);
      const reorderThreshold = Number(row.reorder_threshold ?? LOW_STOCK_THRESHOLD);
      const nextStock =
        typeof body.setStock === "number"
          ? body.setStock
          : currentStock + (body.stockDelta ?? 0);
      const nextPrice =
        typeof body.setPriceCents === "number"
          ? body.setPriceCents
          : currentPrice + (body.priceDeltaCents ?? 0);

      const normalizedStock = Math.max(0, nextStock);
      const normalizedPrice = Math.max(0, nextPrice);

      const updateResult = await client.query(
        `UPDATE products
         SET
          stock = $2,
          price_cents = $3,
          status = COALESCE($4, status)
         WHERE id = $1
         RETURNING id::text, stock`,
        [row.id, normalizedStock, normalizedPrice, body.setStatus ?? null]
      );
      if (updateResult.rowCount === 0) continue;
      affectedIds.push(updateResult.rows[0].id as string);

      if (normalizedStock <= reorderThreshold) {
        const existingAlert = await client.query(
          "SELECT id FROM inventory_alerts WHERE product_id = $1 AND resolved_at IS NULL LIMIT 1",
          [row.id]
        );
        if (existingAlert.rowCount === 0) {
          await client.query(
            `INSERT INTO inventory_alerts (product_id, stock_level, threshold)
             VALUES ($1, $2, $3)`,
            [row.id, normalizedStock, reorderThreshold]
          );
        }
      } else {
        await client.query(
          "UPDATE inventory_alerts SET resolved_at = now() WHERE product_id = $1 AND resolved_at IS NULL",
          [row.id]
        );
      }
    }

    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "product.bulk_update",
      entityType: "product",
      entityId: affectedIds.length > 0 ? affectedIds.join(",") : undefined,
      details: {
        affectedCount: affectedIds.length,
        changes: {
          setStatus: body.setStatus,
          setStock: body.setStock,
          stockDelta: body.stockDelta,
          setPriceCents: body.setPriceCents,
          priceDeltaCents: body.priceDeltaCents,
        },
      },
    });

    await client.query("COMMIT");
    res.json({ updatedCount: affectedIds.length, ids: affectedIds });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

productsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const { rows } = await pool.query(
      `SELECT id, name, sku, category, description, brand, material, size, voltage, finish, compatibility, warranty, safety_info, specs, manuals,
              weight_kg, length_cm, width_cm, height_cm, backorderable, backorder_eta_days,
              price_cents, currency, stock, reorder_threshold, status, image_url, created_at::text, updated_at::text
       FROM products
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Not found" });

    const parsed = ProductRowSchema.parse(rows[0]);
    const metadata = await getProductCatalogMetadata([parsed.id]);
    res.json(mapProduct(parsed, metadata));
  } catch (err) {
    next(err);
  }
});

const ProductReviewRowSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  rating: z.number().int(),
  title: z.string().nullable(),
  body: z.string(),
  author_name: z.string(),
  verified: z.boolean(),
  created_at: z.string(),
});

type ProductReviewRow = z.infer<typeof ProductReviewRowSchema>;

function mapReview(row: ProductReviewRow) {
  return {
    id: row.id,
    productId: row.product_id,
    rating: row.rating,
    title: row.title ?? "",
    body: row.body,
    authorName: row.author_name,
    verified: row.verified,
    createdAt: row.created_at,
  };
}

const ModerationReviewRowSchema = ProductReviewRowSchema.extend({
  product_name: z.string(),
  product_sku: z.string().nullable(),
});

type ModerationReviewRow = z.infer<typeof ModerationReviewRowSchema>;

function mapModerationReview(row: ModerationReviewRow) {
  return {
    ...mapReview(row),
    productName: row.product_name,
    productSku: row.product_sku ?? "",
  };
}

const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().min(10),
  authorName: z.string().min(1),
});

productsRouter.get("/:id/reviews", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rows } = await pool.query(
      `SELECT id, product_id, rating, title, body, author_name, verified, created_at::text
       FROM product_reviews
       WHERE product_id = $1
       ORDER BY created_at DESC`,
      [productId]
    );

    const parsed = z.array(ProductReviewRowSchema).parse(rows);
    res.json(parsed.map(mapReview));
  } catch (err) {
    next(err);
  }
});

productsRouter.post("/:id/reviews", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const body = CreateReviewSchema.parse(req.body);
    const productCheck = await pool.query("SELECT 1 FROM products WHERE id = $1", [productId]);
    if (productCheck.rowCount === 0) return res.status(404).json({ message: "Not found" });

    const { rows } = await pool.query(
      `INSERT INTO product_reviews (product_id, rating, title, body, author_name, verified)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, product_id, rating, title, body, author_name, verified, created_at::text`,
      [
        productId,
        body.rating,
        body.title ?? null,
        body.body,
        body.authorName,
        false,
      ]
    );

    const parsed = ProductReviewRowSchema.parse(rows[0]);
    res.status(201).json(mapReview(parsed));
  } catch (err) {
    next(err);
  }
});

const ProductQuestionRowSchema = z.object({
  id: z.string(),
  product_id: z.string(),
  question: z.string(),
  answer: z.string().nullable(),
  author_name: z.string(),
  author_email: z.string().nullable(),
  created_at: z.string(),
  answered_at: z.string().nullable(),
});

type ProductQuestionRow = z.infer<typeof ProductQuestionRowSchema>;

function mapQuestion(row: ProductQuestionRow) {
  return {
    id: row.id,
    productId: row.product_id,
    question: row.question,
    answer: row.answer ?? "",
    authorName: row.author_name,
    authorEmail: row.author_email ?? "",
    createdAt: row.created_at,
    answeredAt: row.answered_at ?? "",
  };
}

const ModerationQuestionRowSchema = ProductQuestionRowSchema.extend({
  product_name: z.string(),
  product_sku: z.string().nullable(),
});

type ModerationQuestionRow = z.infer<typeof ModerationQuestionRowSchema>;

function mapModerationQuestion(row: ModerationQuestionRow) {
  return {
    ...mapQuestion(row),
    productName: row.product_name,
    productSku: row.product_sku ?? "",
  };
}

const CreateQuestionSchema = z.object({
  question: z.string().min(10),
  authorName: z.string().min(1),
  authorEmail: z.string().email().optional(),
});

productsRouter.get("/:id/questions", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const { rows } = await pool.query(
      `SELECT id, product_id, question, answer, author_name, author_email, created_at::text, answered_at::text
       FROM product_questions
       WHERE product_id = $1
       ORDER BY created_at DESC`,
      [productId]
    );

    const parsed = z.array(ProductQuestionRowSchema).parse(rows);
    res.json(parsed.map(mapQuestion));
  } catch (err) {
    next(err);
  }
});

productsRouter.post("/:id/questions", async (req, res, next) => {
  try {
    const productId = req.params.id;
    const body = CreateQuestionSchema.parse(req.body);
    const productCheck = await pool.query("SELECT 1 FROM products WHERE id = $1", [productId]);
    if (productCheck.rowCount === 0) return res.status(404).json({ message: "Not found" });

    const { rows } = await pool.query(
      `INSERT INTO product_questions (product_id, question, author_name, author_email)
       VALUES ($1,$2,$3,$4)
       RETURNING id, product_id, question, answer, author_name, author_email, created_at::text, answered_at::text`,
      [
        productId,
        body.question,
        body.authorName,
        body.authorEmail ?? null,
      ]
    );

    const parsed = ProductQuestionRowSchema.parse(rows[0]);
    res.status(201).json(mapQuestion(parsed));
  } catch (err) {
    next(err);
  }
});

const UpdateReviewModerationSchema = z.object({
  verified: z.boolean(),
  templateKey: z.string().optional(),
  note: z.string().optional(),
});

const ModerationSearchSchema = z.object({
  q: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 100)),
});

productsRouter.get("/moderation/queue", requireRole("viewer"), async (req, res, next) => {
  try {
    const parsedQuery = ModerationSearchSchema.parse(req.query);
    const limit = Number.isFinite(parsedQuery.limit)
      ? Math.min(Math.max(Number(parsedQuery.limit), 1), 300)
      : 100;
    const q = parsedQuery.q?.trim() ?? "";

    const params: unknown[] = [];
    const whereParts: string[] = [];
    if (q) {
      params.push(`%${q}%`);
      const idx = params.length;
      whereParts.push(
        `(base.product_name ILIKE $${idx} OR base.product_sku ILIKE $${idx} OR base.author_name ILIKE $${idx} OR base.message ILIKE $${idx})`
      );
    }
    params.push(limit);

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
        base.item_type,
        base.id,
        base.product_id,
        base.product_name,
        base.product_sku,
        base.author_name,
        base.message,
        base.answer,
        base.moderation_state,
        base.created_at
       FROM (
         SELECT
          'review'::text AS item_type,
          r.id::text AS id,
          r.product_id::text AS product_id,
          p.name AS product_name,
          p.sku AS product_sku,
         r.author_name,
         r.body AS message,
          ''::text AS answer,
          CASE
            WHEN review_state.action = 'reject' THEN 'rejected'
            WHEN review_state.action = 'approve' OR r.verified THEN 'approved'
            ELSE 'pending'
          END AS moderation_state,
          r.created_at::text AS created_at
         FROM product_reviews r
         INNER JOIN products p ON p.id = r.product_id
         LEFT JOIN LATERAL (
           SELECT action
           FROM moderation_actions m
           WHERE m.entity_type = 'review'
             AND m.entity_id = r.id
             AND m.action IN ('approve', 'reject')
           ORDER BY m.created_at DESC
           LIMIT 1
         ) AS review_state ON true
         UNION ALL
         SELECT
          'question'::text AS item_type,
          q.id::text AS id,
          q.product_id::text AS product_id,
          p.name AS product_name,
          p.sku AS product_sku,
          q.author_name,
          q.question AS message,
          COALESCE(q.answer, '') AS answer,
          CASE WHEN q.answer IS NULL OR q.answer = '' THEN 'pending' ELSE 'answered' END AS moderation_state,
          q.created_at::text AS created_at
         FROM product_questions q
         INNER JOIN products p ON p.id = q.product_id
       ) AS base
       ${whereSql}
       ORDER BY base.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    res.json(
      rows.map((row) => ({
        type: row.item_type,
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        productSku: row.product_sku ?? "",
        authorName: row.author_name,
        message: row.message,
        answer: row.answer ?? "",
        moderationState: row.moderation_state,
        createdAt: row.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/moderation/history", requireRole("viewer"), async (req, res, next) => {
  try {
    const parsedQuery = ModerationSearchSchema.parse(req.query);
    const limit = Number.isFinite(parsedQuery.limit)
      ? Math.min(Math.max(Number(parsedQuery.limit), 1), 300)
      : 100;
    const q = parsedQuery.q?.trim() ?? "";

    const params: unknown[] = [];
    const whereParts: string[] = [];
    if (q) {
      params.push(`%${q}%`);
      const idx = params.length;
      whereParts.push(
        `(m.action ILIKE $${idx} OR m.template_key ILIKE $${idx} OR m.note ILIKE $${idx} OR m.actor_role ILIKE $${idx})`
      );
    }
    params.push(limit);
    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
        m.id::text,
        m.entity_type,
        m.entity_id::text,
        m.action,
        m.template_key,
        m.note,
        m.actor_role,
        m.created_at::text
       FROM moderation_actions m
       ${whereSql}
       ORDER BY m.created_at DESC
       LIMIT $${params.length}`,
      params
    );

    res.json(
      rows.map((row) => ({
        id: row.id,
        entityType: row.entity_type,
        entityId: row.entity_id,
        action: row.action,
        templateKey: row.template_key ?? "",
        note: row.note ?? "",
        actorRole: row.actor_role,
        createdAt: row.created_at,
      }))
    );
  } catch (err) {
    next(err);
  }
});

productsRouter.get("/moderation/reviews/list", requireRole("viewer"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.product_id, r.rating, r.title, r.body, r.author_name, r.verified, r.created_at::text,
              p.name AS product_name, p.sku AS product_sku
       FROM product_reviews r
       INNER JOIN products p ON p.id = r.product_id
       ORDER BY r.created_at DESC`
    );

    const parsed = z.array(ModerationReviewRowSchema).parse(rows);
    res.json(parsed.map(mapModerationReview));
  } catch (err) {
    next(err);
  }
});

productsRouter.patch("/moderation/reviews/:reviewId", requireRole("manager"), async (req, res, next) => {
  try {
    const actor = getActor(req);
    const reviewId = req.params.reviewId;
    const body = UpdateReviewModerationSchema.parse(req.body);
    const reviewState = await pool.query(
      `SELECT verified
       FROM product_reviews
       WHERE id = $1::uuid
       LIMIT 1`,
      [reviewId]
    );

    if (reviewState.rowCount === 0) {
      return res.status(204).send();
    }

    if (Boolean(reviewState.rows[0]?.verified)) {
      return res.status(409).json({ message: "Review has already been moderated." });
    }

    const existingModeration = await pool.query(
      `SELECT id
       FROM moderation_actions
       WHERE entity_type = 'review'
         AND entity_id = $1::uuid
         AND action IN ('approve', 'reject')
       LIMIT 1`,
      [reviewId]
    );

    if (existingModeration.rowCount && existingModeration.rowCount > 0) {
      return res.status(409).json({ message: "Review has already been moderated." });
    }

    const { rows } = await pool.query(
      `UPDATE product_reviews
       SET verified = $2
       WHERE id = $1
       RETURNING id, product_id, rating, title, body, author_name, verified, created_at::text,
                 (SELECT name FROM products WHERE products.id = product_reviews.product_id) AS product_name,
                 (SELECT sku FROM products WHERE products.id = product_reviews.product_id) AS product_sku`,
      [reviewId, body.verified]
    );

    if (rows.length === 0) return res.status(204).send();

    const parsed = ModerationReviewRowSchema.parse(rows[0]);
    await pool.query(
      `INSERT INTO moderation_actions (entity_type, entity_id, action, template_key, note, actor_role)
       VALUES ($1,$2::uuid,$3,$4,$5,$6)`,
      ["review", reviewId, body.verified ? "approve" : "reject", body.templateKey ?? null, body.note ?? null, actor.role]
    );
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "moderation.review_updated",
      entityType: "review",
      entityId: reviewId,
      details: { verified: body.verified, templateKey: body.templateKey ?? "", note: body.note ?? "" },
    });
    res.json(mapModerationReview(parsed));
  } catch (err) {
    next(err);
  }
});

const UpdateQuestionModerationSchema = z.object({
  answer: z.string().optional(),
  templateKey: z.string().optional(),
  note: z.string().optional(),
});

productsRouter.get("/moderation/questions/list", requireRole("viewer"), async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT q.id, q.product_id, q.question, q.answer, q.author_name, q.author_email,
              q.created_at::text, q.answered_at::text, p.name AS product_name, p.sku AS product_sku
       FROM product_questions q
       INNER JOIN products p ON p.id = q.product_id
       ORDER BY (q.answered_at IS NULL) DESC, q.created_at DESC`
    );

    const parsed = z.array(ModerationQuestionRowSchema).parse(rows);
    res.json(parsed.map(mapModerationQuestion));
  } catch (err) {
    next(err);
  }
});

productsRouter.patch("/moderation/questions/:questionId", requireRole("manager"), async (req, res, next) => {
  try {
    const actor = getActor(req);
    const questionId = req.params.questionId;
    const body = UpdateQuestionModerationSchema.parse(req.body);
    const trimmed = (body.answer ?? "").trim();
    const answerValue = trimmed.length > 0 ? trimmed : null;

    const { rows } = await pool.query(
      `UPDATE product_questions
       SET answer = $2,
           answered_at = CASE WHEN $2::text IS NULL THEN NULL ELSE now() END
       WHERE id = $1
       RETURNING id, product_id, question, answer, author_name, author_email, created_at::text, answered_at::text,
                 (SELECT name FROM products WHERE products.id = product_questions.product_id) AS product_name,
                 (SELECT sku FROM products WHERE products.id = product_questions.product_id) AS product_sku`,
      [questionId, answerValue]
    );

    if (rows.length === 0) return res.status(204).send();

    const parsed = ModerationQuestionRowSchema.parse(rows[0]);
    await pool.query(
      `INSERT INTO moderation_actions (entity_type, entity_id, action, template_key, note, actor_role)
       VALUES ($1,$2::uuid,$3,$4,$5,$6)`,
      [
        "question",
        questionId,
        answerValue ? "answer" : "clear_answer",
        body.templateKey ?? null,
        body.note ?? null,
        actor.role,
      ]
    );
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "moderation.question_updated",
      entityType: "question",
      entityId: questionId,
      details: {
        answered: Boolean(answerValue),
        templateKey: body.templateKey ?? "",
        note: body.note ?? "",
      },
    });
    res.json(mapModerationQuestion(parsed));
  } catch (err) {
    next(err);
  }
});

const CreateProductSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  material: z.string().optional(),
  size: z.string().optional(),
  voltage: z.string().optional(),
  finish: z.string().optional(),
  compatibility: z.string().optional(),
  warranty: z.string().optional(),
  safetyInfo: z.string().optional(),
  specs: SpecsSchema.optional(),
  manuals: z.array(ManualSchema).optional(),
  weightKg: z.number().nonnegative().optional(),
  lengthCm: z.number().nonnegative().optional(),
  widthCm: z.number().nonnegative().optional(),
  heightCm: z.number().nonnegative().optional(),
  backorderable: z.boolean().optional(),
  backorderEtaDays: z.number().int().nonnegative().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
  status: z.enum(["active", "draft", "out_of_stock"]).optional(),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

const UpdateProductSchema = CreateProductSchema.partial();

productsRouter.post("/", requireRole("manager"), async (req, res, next) => {
  try {
    const actor = getActor(req);
    const body = CreateProductSchema.parse(req.body);
    const inputImageUrls = (body.imageUrls ?? [])
      .map((value) => value.trim())
      .filter(Boolean);
    const normalizedImageUrl = body.imageUrl?.trim() || inputImageUrls[0] || null;
    const mergedSpecs = body.specs
      ? { ...body.specs }
      : {};

    if (inputImageUrls.length > 0) {
      mergedSpecs.imageUrls = Array.from(new Set(inputImageUrls));
    }

    const { rows } = await pool.query(
      `INSERT INTO products (name, sku, category, description, brand, material, size, voltage, finish, compatibility, warranty, safety_info, specs, manuals,
                             weight_kg, length_cm, width_cm, height_cm, backorderable, backorder_eta_days,
                             price_cents, currency, stock, status, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING id, name, sku, category, description, brand, material, size, voltage, finish, compatibility, warranty, safety_info, specs, manuals,
                 weight_kg, length_cm, width_cm, height_cm, backorderable, backorder_eta_days,
                 price_cents, currency, stock, reorder_threshold, status, image_url, created_at::text, updated_at::text`,
      [
        body.name,
        body.sku ?? null,
        body.category ?? null,
        body.description ?? null,
        body.brand ?? null,
        body.material ?? null,
        body.size ?? null,
        body.voltage ?? null,
        body.finish ?? null,
        body.compatibility ?? null,
        body.warranty ?? null,
        body.safetyInfo ?? null,
        Object.keys(mergedSpecs).length > 0 ? mergedSpecs : null,
        body.manuals ?? null,
        body.weightKg ?? null,
        body.lengthCm ?? null,
        body.widthCm ?? null,
        body.heightCm ?? null,
        body.backorderable ?? false,
        body.backorderEtaDays ?? null,
        body.priceCents ?? 0,
        body.currency ?? "PHP",
        body.stock ?? 0,
        body.status ?? "active",
        normalizedImageUrl,
      ]
    );

    const parsed = ProductRowSchema.parse(rows[0]);
    if (parsed.stock <= LOW_STOCK_THRESHOLD) {
      await pool.query(
        `INSERT INTO inventory_alerts (product_id, stock_level, threshold)
         VALUES ($1, $2, $3)`,
        [parsed.id, parsed.stock, LOW_STOCK_THRESHOLD]
      );
    }
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "product.created",
      entityType: "product",
      entityId: parsed.id,
      details: {
        name: parsed.name,
        sku: parsed.sku ?? "",
        status: parsed.status,
      },
    });
    res.status(201).json(mapProduct(parsed));
  } catch (err) {
    next(err);
  }
});

productsRouter.put("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const actor = getActor(req);
    const id = req.params.id;
    const body = UpdateProductSchema.parse(req.body);

    if (Object.keys(body).length === 0) {
      return res.status(400).json({ message: "No fields provided for update" });
    }

    const existing = await pool.query("SELECT stock, specs, image_url FROM products WHERE id = $1", [id]);
    const previousStock = existing.rows[0]?.stock as number | undefined;
    const existingSpecs = (existing.rows[0]?.specs ?? null) as z.infer<typeof SpecsSchema> | null;
    const existingImageUrl =
      typeof existing.rows[0]?.image_url === "string" ? existing.rows[0].image_url : "";

    const inputImageUrls = body.imageUrls
      ? body.imageUrls.map((value) => value.trim()).filter(Boolean)
      : null;

    let mergedSpecs: z.infer<typeof SpecsSchema> | null = null;
    if (body.specs !== undefined || inputImageUrls !== null) {
      mergedSpecs = {
        ...((existingSpecs ?? {}) as z.infer<typeof SpecsSchema>),
        ...(body.specs ?? {}),
      };

      if (inputImageUrls !== null) {
        if (inputImageUrls.length > 0) {
          mergedSpecs.imageUrls = Array.from(new Set(inputImageUrls));
        } else {
          delete (mergedSpecs as Record<string, unknown>).imageUrls;
        }
      }
    }

    const normalizedImageUrl =
      body.imageUrl?.trim() || (inputImageUrls && inputImageUrls[0]) || existingImageUrl || null;

    const { rows } = await pool.query(
      `UPDATE products
       SET
        name = COALESCE($2, name),
        sku = COALESCE($3, sku),
        category = COALESCE($4, category),
        description = COALESCE($5, description),
        brand = COALESCE($6, brand),
        material = COALESCE($7, material),
        size = COALESCE($8, size),
        voltage = COALESCE($9, voltage),
        finish = COALESCE($10, finish),
        compatibility = COALESCE($11, compatibility),
        warranty = COALESCE($12, warranty),
        safety_info = COALESCE($13, safety_info),
        specs = COALESCE($14, specs),
        manuals = COALESCE($15, manuals),
        weight_kg = COALESCE($16, weight_kg),
        length_cm = COALESCE($17, length_cm),
        width_cm = COALESCE($18, width_cm),
        height_cm = COALESCE($19, height_cm),
        backorderable = COALESCE($20, backorderable),
        backorder_eta_days = COALESCE($21, backorder_eta_days),
        price_cents = COALESCE($22, price_cents),
        currency = COALESCE($23, currency),
        stock = COALESCE($24, stock),
        status = COALESCE($25, status),
        image_url = COALESCE($26, image_url)
       WHERE id = $1
       RETURNING id, name, sku, category, description, brand, material, size, voltage, finish, compatibility, warranty, safety_info, specs, manuals,
                 weight_kg, length_cm, width_cm, height_cm, backorderable, backorder_eta_days,
                 price_cents, currency, stock, reorder_threshold, status, image_url, created_at::text, updated_at::text`,
      [
        id,
        body.name ?? null,
        body.sku ?? null,
        body.category ?? null,
        body.description ?? null,
        body.brand ?? null,
        body.material ?? null,
        body.size ?? null,
        body.voltage ?? null,
        body.finish ?? null,
        body.compatibility ?? null,
        body.warranty ?? null,
        body.safetyInfo ?? null,
        mergedSpecs,
        body.manuals ?? null,
        body.weightKg ?? null,
        body.lengthCm ?? null,
        body.widthCm ?? null,
        body.heightCm ?? null,
        body.backorderable ?? null,
        body.backorderEtaDays ?? null,
        body.priceCents ?? null,
        body.currency ?? null,
        body.stock ?? null,
        body.status ?? null,
        normalizedImageUrl,
      ]
    );

    if (rows.length === 0) return res.status(404).json({ message: "Not found" });

    const parsed = ProductRowSchema.parse(rows[0]);

    if (typeof parsed.stock === "number") {
      if (parsed.stock <= LOW_STOCK_THRESHOLD) {
        const existingAlert = await pool.query(
          "SELECT id FROM inventory_alerts WHERE product_id = $1 AND resolved_at IS NULL LIMIT 1",
          [parsed.id]
        );
        if (existingAlert.rowCount === 0) {
          await pool.query(
            `INSERT INTO inventory_alerts (product_id, stock_level, threshold)
             VALUES ($1, $2, $3)`,
            [parsed.id, parsed.stock, LOW_STOCK_THRESHOLD]
          );
        }
      } else if (typeof previousStock === "number" && previousStock <= LOW_STOCK_THRESHOLD) {
        await pool.query(
          "UPDATE inventory_alerts SET resolved_at = now() WHERE product_id = $1 AND resolved_at IS NULL",
          [parsed.id]
        );
      }
    }

    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "product.updated",
      entityType: "product",
      entityId: parsed.id,
      details: {
        status: parsed.status,
        stock: parsed.stock,
        priceCents: parsed.price_cents,
      },
    });
    res.json(mapProduct(parsed));
  } catch (err) {
    next(err);
  }
});

productsRouter.delete("/:id", requireRole("manager"), async (req, res, next) => {
  try {
    const actor = getActor(req);
    const id = req.params.id;
    const { rowCount } = await pool.query("DELETE FROM products WHERE id = $1", [id]);
    if (!rowCount) return res.status(404).json({ message: "Not found" });
    await writeAuditLog({
      actorId: actor.id,
      actorRole: actor.role,
      action: "product.deleted",
      entityType: "product",
      entityId: id,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
