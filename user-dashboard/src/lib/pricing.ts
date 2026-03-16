export let TAX_RATE = (() => {
  const raw = Number(import.meta.env.VITE_TAX_RATE ?? "0.16");
  if (Number.isFinite(raw) && raw >= 0) return raw;
  return 0;
})();

export const DEFAULT_DELIVERY_ESTIMATE = "2-4 business days";
export const DEFAULT_RETURN_POLICY =
  "30-day returns on unused items. Original packaging required.";

export function setTaxRate(nextRate: number): void {
  if (!Number.isFinite(nextRate) || nextRate < 0) return;
  TAX_RATE = nextRate;
}

export function setTaxRatePercent(percent: number): void {
  if (!Number.isFinite(percent) || percent < 0) return;
  setTaxRate(percent / 100);
}

export function calculateTaxCents(priceCents: number): number {
  return Math.round(priceCents * TAX_RATE);
}

export function calculateTotalWithTaxCents(priceCents: number): number {
  return priceCents + calculateTaxCents(priceCents);
}

export function formatTaxRate(): string {
  return `${Math.round(TAX_RATE * 100)}%`;
}
