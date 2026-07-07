export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: "INR", symbol: "\u20B9", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "\u20AC", name: "Euro" },
  { code: "GBP", symbol: "\u00A3", name: "British Pound" },
  { code: "JPY", symbol: "\u00A5", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AED", symbol: "AED", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
];

export const getCurrency = (code: string): Currency =>
  CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];

export const formatAmount = (n: number, symbol: string, opts?: { showSign?: boolean; signMode?: "income" | "expense" | null }) => {
  const abs = Math.abs(n);
  const formatted = abs.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: abs % 1 === 0 ? 0 : 2 });
  if (opts?.signMode === "income") return `+${symbol}${formatted}`;
  if (opts?.signMode === "expense") return `-${symbol}${formatted}`;
  return `${symbol}${formatted}`;
};
