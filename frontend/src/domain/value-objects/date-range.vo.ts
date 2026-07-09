export interface DateRange {
  from: string;
  to: string;
}

export const isValidDateRange = (range: DateRange): boolean => {
  const fromMs = Date.parse(range.from);
  const toMs = Date.parse(range.to);
  return Number.isFinite(fromMs) && Number.isFinite(toMs) && fromMs <= toMs;
};
