import dayjs from "dayjs";

export const startOfDay = (d: Date | string = new Date()) => dayjs(d).startOf("day").toISOString();
export const endOfDay = (d: Date | string = new Date()) => dayjs(d).endOf("day").toISOString();
export const startOfMonth = (d: Date | string = new Date()) => dayjs(d).startOf("month").toISOString();
export const endOfMonth = (d: Date | string = new Date()) => dayjs(d).endOf("month").toISOString();
export const startOfYear = (d: Date | string = new Date()) => dayjs(d).startOf("year").toISOString();
export const endOfYear = (d: Date | string = new Date()) => dayjs(d).endOf("year").toISOString();

export const relativeDayLabel = (iso: string): string => {
  const d = dayjs(iso);
  const today = dayjs().startOf("day");
  const diff = today.diff(d.startOf("day"), "day");
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1 && diff < 7) return d.format("dddd");
  return d.format("MMM D, YYYY");
};

export const groupByDay = <T extends { date: string }>(items: T[]): Array<{ dateKey: string; label: string; items: T[] }> => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = dayjs(item.date).format("YYYY-MM-DD");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([k, v]) => ({ dateKey: k, label: relativeDayLabel(k), items: v }));
};
