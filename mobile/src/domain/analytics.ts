import {
  addDays,
  daysBetween,
  monthStart,
  periodBounds,
  weekday,
} from "./dates";
import type { DayKey, Entry, Goal, Habit, Snapshot } from "./model";

export function isDue(habit: Habit, date: DayKey): boolean {
  return (
    date >= habit.createdOn &&
    (!habit.archivedOn || date < habit.archivedOn) &&
    habit.weekdays.includes(weekday(date))
  );
}
export const entryKey = (habitId: string, date: DayKey) => `${habitId}/${date}`;
export function entryIndex(entries: Entry[]): Map<string, Entry> {
  return new Map(entries.map((e) => [entryKey(e.habitId, e.date), e]));
}
export function daySummary(
  habits: Habit[],
  index: Map<string, Entry>,
  date: DayKey,
) {
  const due = habits.filter((h) => isDue(h, date));
  const completed = due.filter((h) => {
    const e = index.get(entryKey(h.id, date));
    return e && e.value >= e.target;
  }).length;
  return {
    due: due.length,
    completed,
    rate: due.length ? Math.round((completed / due.length) * 100) : 0,
  };
}
export function rangeSummary(snapshot: Snapshot, start: DayKey, end: DayKey) {
  const index = entryIndex(snapshot.entries);
  const days = daysBetween(start, end).map((date) => ({
    date,
    ...daySummary(snapshot.habits, index, date),
  }));
  const completed = days.reduce((sum, d) => sum + d.completed, 0);
  const due = days.reduce((sum, d) => sum + d.due, 0);
  return {
    days,
    completed,
    due,
    rate: due ? Math.round((completed / due) * 100) : 0,
    activeDays: days.filter((d) => d.completed > 0).length,
  };
}
export function streak(habit: Habit, entries: Entry[], today: DayKey) {
  const index = entryIndex(entries);
  const end =
    habit.archivedOn && habit.archivedOn <= today
      ? addDays(habit.archivedOn, -1)
      : today;
  let run = 0,
    best = 0;
  const scheduled = daysBetween(habit.createdOn, end).filter((d) =>
    isDue(habit, d),
  );
  for (const date of scheduled) {
    const e = index.get(entryKey(habit.id, date));
    if (e && e.value >= e.target) {
      run++;
      best = Math.max(best, run);
    } else if (date !== today) run = 0;
  }
  return {
    current: habit.archivedOn && habit.archivedOn <= today ? 0 : run,
    best,
  };
}
export function chartStart(
  today: DayKey,
  period: "month" | "quarter" | "year",
): DayKey {
  return period === "year"
    ? `${today.slice(0, 4)}-01-01`
    : monthStart(today, period === "quarter" ? -2 : 0);
}
export function goalProgress(goal: Goal, snapshot: Snapshot, today: DayKey) {
  const [start, end] = periodBounds(today, goal.period);
  const matching = snapshot.entries.filter(
    (e) => e.habitId === goal.habitId && e.date >= start && e.date <= today,
  );
  const value = matching.reduce(
    (sum, e) =>
      sum +
      (goal.metric === "completions" ? Number(e.value >= e.target) : e.value),
    0,
  );
  return {
    value,
    start,
    end,
    percent: Math.min(100, Math.round((value / goal.target) * 100)),
    remaining: Math.max(0, goal.target - value),
  };
}
