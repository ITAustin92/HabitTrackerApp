export const colors = [
  "mint",
  "lavender",
  "peach",
  "blue",
  "pink",
  "yellow",
] as const;
export type HabitColor = (typeof colors)[number];
export type HabitType = "check" | "count" | "minutes";
export type DayKey = string; // YYYY-MM-DD in the device's local calendar.
export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: HabitColor;
  type: HabitType;
  target: number;
  unit: string;
  weekdays: number[]; // Monday = 1, Sunday = 7.
  createdOn: DayKey;
  archivedOn: DayKey | null;
}
export type HabitInput = Pick<
  Habit,
  "name" | "emoji" | "color" | "type" | "target" | "unit" | "weekdays"
>;
export interface Entry {
  habitId: string;
  date: DayKey;
  value: number;
  target: number;
}
export interface Goal {
  id: string;
  habitId: string;
  period: "week" | "month";
  metric: "completions" | "quantity";
  target: number;
  createdOn: DayKey;
}
export type GoalInput = Pick<Goal, "habitId" | "period" | "metric" | "target">;
export interface Preferences {
  name: string;
  theme: "system" | "light" | "dark";
  accent: HabitColor;
}
export interface Snapshot {
  habits: Habit[];
  entries: Entry[];
  goals: Goal[];
  preferences: Preferences;
}
export const defaultPreferences: Preferences = {
  name: "Austin",
  theme: "system",
  accent: "mint",
};

export function validateHabit(input: HabitInput): HabitInput {
  const name = input.name.trim();
  if (!name || name.length > 60)
    throw new Error("Escribe un nombre de entre 1 y 60 caracteres.");
  if (!["check", "count", "minutes"].includes(input.type))
    throw new Error("Tipo de hábito no válido.");
  if (!colors.includes(input.color)) throw new Error("Elige un color válido.");
  if (
    !Number.isInteger(input.target) ||
    input.target < 1 ||
    input.target > 10000
  )
    throw new Error("El objetivo debe ser un número entero entre 1 y 10.000.");
  if (
    !input.weekdays.length ||
    input.weekdays.some((d) => !Number.isInteger(d) || d < 1 || d > 7)
  )
    throw new Error("Elige al menos un día de la semana.");
  if (!input.emoji.trim() || input.emoji.length > 16)
    throw new Error("Elige un icono para tu hábito.");
  const unit =
    input.type === "check"
      ? "veces"
      : input.type === "minutes"
        ? "min"
        : input.unit.trim();
  if (!unit || unit.length > 20)
    throw new Error("Escribe una unidad de hasta 20 caracteres.");
  return {
    ...input,
    name,
    emoji: input.emoji.trim(),
    target: input.type === "check" ? 1 : input.target,
    unit,
    weekdays: [...new Set(input.weekdays)].sort(),
  };
}
