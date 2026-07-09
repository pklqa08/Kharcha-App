export type Money = number;

export const isValidMoney = (value: number): boolean => Number.isFinite(value) && value >= 0;

export const requireMoney = (value: number, fieldName = "amount"): Money => {
  if (!isValidMoney(value)) {
    throw new Error(`${fieldName} must be a finite number >= 0`);
  }
  return value;
};
