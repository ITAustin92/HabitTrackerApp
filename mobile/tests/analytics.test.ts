import assert from "node:assert/strict";
import { test } from "node:test";
import { chartStart, rangeSummary, streak } from "../src/domain/analytics";
import {
  addDays,
  dayKey,
  fromDay,
  periodBounds,
  startOfWeek,
} from "../src/domain/dates";
import {
  defaultPreferences,
  type Habit,
  type Snapshot,
} from "../src/domain/model";
const habit: Habit = {
  id: "training",
  name: "Entrenar",
  emoji: "🏋️",
  color: "mint",
  type: "check",
  target: 1,
  unit: "veces",
  weekdays: [1, 3, 5],
  createdOn: "2026-11-02",
  archivedOn: null,
};
const snapshot: Snapshot = {
  habits: [habit],
  entries: [
    { habitId: "training", date: "2026-11-02", value: 1, target: 1 },
    { habitId: "training", date: "2026-11-04", value: 1, target: 1 },
  ],
  goals: [],
  preferences: defaultPreferences,
};
test("rest days and days before creation are excluded from progress", () => {
  const stats = rangeSummary(snapshot, "2026-10-30", "2026-11-05");
  assert.equal(stats.due, 2);
  assert.equal(stats.rate, 100);
  assert.equal(rangeSummary(snapshot, "2026-11-03", "2026-11-03").due, 0);
});
test("rest days do not break streaks and today remains open until midnight", () => {
  assert.deepEqual(streak(habit, snapshot.entries, "2026-11-06"), {
    current: 2,
    best: 2,
  });
  assert.deepEqual(streak(habit, snapshot.entries, "2026-11-07"), {
    current: 0,
    best: 2,
  });
  assert.deepEqual(
    streak(
      habit,
      [
        ...snapshot.entries,
        { habitId: habit.id, date: "2026-11-06", value: 1, target: 1 },
      ],
      "2026-11-08",
    ),
    { current: 3, best: 3 },
  );
});
test("partial quantities do not count as completed and historical targets are used", () => {
  const data = {
    ...snapshot,
    habits: [{ ...habit, target: 100 }],
    entries: [
      { habitId: habit.id, date: "2026-11-02", value: 20, target: 20 },
      { habitId: habit.id, date: "2026-11-04", value: 15, target: 20 },
    ],
  };
  assert.equal(rangeSummary(data, "2026-11-02", "2026-11-04").rate, 50);
});
test("local day keys, leap days, year changes and Monday boundaries are correct", () => {
  assert.equal(dayKey(new Date(2026, 10, 6, 23, 59)), "2026-11-06");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(startOfWeek("2026-11-08"), "2026-11-02");
  assert.deepEqual(periodBounds("2026-11-08", "week"), [
    "2026-11-02",
    "2026-11-08",
  ]);
  assert.deepEqual(periodBounds("2024-02-14", "month"), [
    "2024-02-01",
    "2024-02-29",
  ]);
  assert.throws(() => fromDay("2026-02-29"));
  assert.equal(chartStart("2026-01-04", "quarter"), "2025-11-01");
  assert.equal(chartStart("2026-11-06", "year"), "2026-01-01");
});
