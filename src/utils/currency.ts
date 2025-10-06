// Currency conversion utilities
const USD_TO_KSH_RATE = 130; // 1 USD = 130 KSH (approximate rate)

export const formatCurrency = (priceUSD: number) => {
  const priceKSH = priceUSD * USD_TO_KSH_RATE;
  
  return {
    usd: `$${priceUSD.toFixed(2)}`,
    ksh: `KSh ${priceKSH.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  };
};

export const formatDualCurrency = (priceUSD: number) => {
  const { usd, ksh } = formatCurrency(priceUSD);
  return `${usd} / ${ksh}`;
};

// Single currency format (USD by default)
export const formatPrice = (priceUSD: number) => {
  return `$${priceUSD.toFixed(2)}`;
};
