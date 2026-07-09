export type PaymentMode = "cash" | "upi" | "card" | "netbanking" | "wallet" | "other";

export const PAYMENT_MODES: PaymentMode[] = ["cash", "upi", "card", "netbanking", "wallet", "other"];

export const isPaymentMode = (value: string): value is PaymentMode =>
  PAYMENT_MODES.includes(value as PaymentMode);
