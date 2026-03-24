import { pool } from "../db/pool";

export type PromoValidationInput = {
  code: string;
  subtotalCents: number;
  userId?: string | null;
  accountType?: string | null;
};

export type PromoValidationResult = {
  valid: boolean;
  message: string;
  code: string;
  promoCodeId?: string;
  description?: string;
  discountCents: number;
};

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

export async function validatePromoCode(input: PromoValidationInput): Promise<PromoValidationResult> {
  const code = normalizeCode(input.code);
  if (!code) {
    return {
      valid: false,
      message: "Promo code is required.",
      code,
      discountCents: 0,
    };
  }

  const { rows } = await pool.query(
    `SELECT
      id::text,
      code,
      description,
      discount_type,
      discount_value,
      minimum_subtotal_cents,
      max_discount_cents,
      starts_at::text,
      ends_at::text,
      usage_limit,
      per_user_limit,
      eligible_account_type,
      is_active
     FROM promo_codes
     WHERE upper(code) = $1
     LIMIT 1`,
    [code]
  );

  if (rows.length === 0) {
    return {
      valid: false,
      message: "Promo code was not found.",
      code,
      discountCents: 0,
    };
  }

  const promo = rows[0];
  const now = Date.now();
  const startsAt = promo.starts_at ? new Date(String(promo.starts_at)).getTime() : null;
  const endsAt = promo.ends_at ? new Date(String(promo.ends_at)).getTime() : null;
  const minimumSubtotalCents = Number(promo.minimum_subtotal_cents ?? 0);
  const eligibleAccountType = promo.eligible_account_type ? String(promo.eligible_account_type) : null;

  if (!promo.is_active) {
    return { valid: false, message: "This promo code is inactive.", code, discountCents: 0 };
  }
  if (startsAt && Number.isFinite(startsAt) && startsAt > now) {
    return { valid: false, message: "This promo code is not active yet.", code, discountCents: 0 };
  }
  if (endsAt && Number.isFinite(endsAt) && endsAt < now) {
    return { valid: false, message: "This promo code has expired.", code, discountCents: 0 };
  }
  if (input.subtotalCents < minimumSubtotalCents) {
    return {
      valid: false,
      message: `This code requires a minimum subtotal of ${minimumSubtotalCents / 100}.`,
      code,
      discountCents: 0,
    };
  }
  if (eligibleAccountType && eligibleAccountType !== (input.accountType ?? "customer")) {
    return {
      valid: false,
      message: `This code is reserved for ${eligibleAccountType} accounts.`,
      code,
      discountCents: 0,
    };
  }

  const totalUsagePromise = pool.query(
    "SELECT COUNT(*)::int AS total FROM promo_code_redemptions WHERE promo_code_id = $1",
    [promo.id]
  );
  const userUsagePromise =
    input.userId && promo.per_user_limit
      ? pool.query(
          "SELECT COUNT(*)::int AS total FROM promo_code_redemptions WHERE promo_code_id = $1 AND user_id = $2",
          [promo.id, input.userId]
        )
      : Promise.resolve({ rows: [{ total: 0 }] });

  const [totalUsage, userUsage] = await Promise.all([totalUsagePromise, userUsagePromise]);
  const usageLimit = promo.usage_limit ? Number(promo.usage_limit) : null;
  const perUserLimit = promo.per_user_limit ? Number(promo.per_user_limit) : null;

  if (usageLimit !== null && Number(totalUsage.rows[0]?.total ?? 0) >= usageLimit) {
    return { valid: false, message: "This promo code has reached its usage limit.", code, discountCents: 0 };
  }
  if (perUserLimit !== null && Number(userUsage.rows[0]?.total ?? 0) >= perUserLimit) {
    return { valid: false, message: "You have already used this promo code.", code, discountCents: 0 };
  }

  let discountCents =
    promo.discount_type === "percent"
      ? Math.round((input.subtotalCents * Number(promo.discount_value)) / 100)
      : Number(promo.discount_value);

  if (promo.max_discount_cents) {
    discountCents = Math.min(discountCents, Number(promo.max_discount_cents));
  }
  discountCents = Math.max(0, Math.min(discountCents, input.subtotalCents));

  return {
    valid: true,
    message: "Promo code applied.",
    code,
    promoCodeId: promo.id,
    description: promo.description ? String(promo.description) : "",
    discountCents,
  };
}
