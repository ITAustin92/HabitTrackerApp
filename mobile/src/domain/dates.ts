import type { DayKey } from "./model";

export function dayKey(date = new Date()): DayKey {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function fromDay(key: DayKey): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error("Fecha no válida.");
  const [year, month, day] = key.split("-").map(Number);
  const result = new Date(year, month - 1, day, 12);
  if (dayKey(result) !== key) throw new Error("Fecha no válida.");
  return result;
}
export function addDays(key: DayKey, count: number): DayKey {
  const date = fromDay(key);
  date.setDate(date.getDate() + count);
  return dayKey(date);
}
export function weekday(key: DayKey): number {
  return fromDay(key).getDay() || 7;
}
export function startOfWeek(key: DayKey): DayKey {
  return addDays(key, 1 - weekday(key));
}
export function monthStart(key: DayKey, offset = 0): DayKey {
  const d = fromDay(key);
  return dayKey(new Date(d.getFullYear(), d.getMonth() + offset, 1, 12));
}
export function monthEnd(key: DayKey): DayKey {
  return addDays(monthStart(key, 1), -1);
}
export function daysBetween(start: DayKey, end: DayKey): DayKey[] {
  const result: DayKey[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) result.push(d);
  return result;
}
export function prettyDate(
  key: DayKey,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" },
): string {
  return fromDay(key).toLocaleDateString("es-CL", options);
}
export function periodBounds(
  today: DayKey,
  period: "week" | "month",
): [DayKey, DayKey] {
  return period === "week"
    ? [startOfWeek(today), addDays(startOfWeek(today), 6)]
    : [monthStart(today), monthEnd(today)];
}
