import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { HabitRepository, type Database } from "../src/data/repository";
import { goalProgress, rangeSummary } from "../src/domain/analytics";
import { type HabitInput } from "../src/domain/model";

class SQLiteAdapter implements Database {
  constructor(public db: DatabaseSync) {}
  async execAsync(sql: string) {
    this.db.exec(sql);
  }
  async runAsync(sql: string, ...params: (string | number | null)[]) {
    return this.db.prepare(sql).run(...params);
  }
  async getAllAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }
  async getFirstAsync<T>(
    sql: string,
    ...params: (string | number | null)[]
  ): Promise<T | null> {
    return (this.db.prepare(sql).get(...params) as T) ?? null;
  }
  async withTransactionAsync(task: () => Promise<void>) {
    this.db.exec("BEGIN");
    try {
      await task();
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
}
const input: HabitInput = {
  name: "Leer",
  emoji: "📖",
  type: "minutes",
  color: "mint",
  target: 20,
  unit: "min",
  weekdays: [1, 2, 3, 4, 5, 6, 7],
};
async function fixture(today = "2026-11-06") {
  const adapter = new SQLiteAdapter(new DatabaseSync(":memory:"));
  let date = today,
    id = 0;
  const repo = new HabitRepository(
    adapter,
    () => date,
    () => `test-${++id}`,
  );
  await repo.initialize();
  return {
    repo,
    adapter,
    setDate: (value: string) => {
      date = value;
    },
  };
}
test("initialization seeds habits once with no fabricated records", async () => {
  const { repo } = await fixture();
  await repo.initialize();
  const data = await repo.load();
  assert.equal(data.habits.length, 8);
  assert.equal(data.entries.length, 0);
  assert.equal(data.goals.length, 0);
});
test("habits, entries, goals and preferences survive closing and reopening the SQLite file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "poquito-test-"));
  const path = join(dir, "test.db");
  let db = new DatabaseSync(path);
  try {
    let repo = new HabitRepository(
      new SQLiteAdapter(db),
      () => "2026-11-06",
      () => "persisted",
    );
    await repo.initialize();
    await repo.createHabit(input);
    await repo.changeEntry("persisted", "2026-11-06", { delta: 15 });
    await repo.createGoal({
      habitId: "persisted",
      period: "week",
      metric: "quantity",
      target: 100,
    });
    await repo.savePreferences({
      name: "Dani",
      theme: "dark",
      accent: "lavender",
    });
    const before = await repo.load();
    db.close();
    db = new DatabaseSync(path);
    repo = new HabitRepository(new SQLiteAdapter(db), () => "2026-11-07");
    await repo.initialize();
    assert.deepEqual(await repo.load(), before);
    assert.equal((await repo.load()).entries[0].date, "2026-11-06");
  } finally {
    db.close();
    rmSync(dir, { recursive: true });
  }
});
test("concurrent increments serialize without lost updates and maintain one entry per day", async () => {
  const { repo } = await fixture();
  await repo.createHabit(input);
  await Promise.all(
    Array.from({ length: 25 }, () =>
      repo.changeEntry("test-1", "2026-11-06", { delta: 1 }),
    ),
  );
  const data = await repo.load();
  assert.equal(data.entries.length, 1);
  assert.equal(data.entries[0].value, 25);
});
test("toggle completes a quantitative habit, undo removes its entry, minus never goes below zero", async () => {
  const { repo } = await fixture();
  await repo.createHabit(input);
  await repo.changeEntry("test-1", "2026-11-06", { toggle: true });
  assert.equal((await repo.load()).entries[0].value, 20);
  await repo.changeEntry("test-1", "2026-11-06", { toggle: true });
  await repo.changeEntry("test-1", "2026-11-06", { delta: -5 });
  assert.equal((await repo.load()).entries.length, 0);
});
test("invalid, future, pre-creation and unscheduled dates are rejected without writes", async () => {
  const { repo, setDate } = await fixture();
  await repo.createHabit({ ...input, weekdays: [5] });
  for (const date of ["2026-02-30", "2026-11-07", "2026-10-30", "bad-date"])
    await assert.rejects(repo.changeEntry("test-1", date, { delta: 1 }));
  setDate("2026-11-08");
  await assert.rejects(repo.changeEntry("test-1", "2026-11-07", { delta: 1 }));
  assert.equal((await repo.load()).entries.length, 0);
  await repo.changeEntry("test-1", "2026-11-06", { delta: 5 });
  assert.equal((await repo.load()).entries[0].value, 5);
});
test("archiving preserves today and previous records but stops future scheduling", async () => {
  const { repo, setDate } = await fixture();
  await repo.createHabit(input);
  await repo.changeEntry("test-1", "2026-11-06", { delta: 20 });
  await repo.archiveHabit("test-1");
  setDate("2026-11-07");
  await assert.rejects(repo.changeEntry("test-1", "2026-11-07", { delta: 5 }));
  const data = await repo.load();
  assert.equal(data.entries[0].value, 20);
  const stats = rangeSummary(
    { ...data, habits: data.habits.filter((h) => h.id === "test-1") },
    "2026-11-06",
    "2026-11-07",
  );
  assert.equal(stats.due, 1);
  assert.equal(stats.completed, 1);
});
test("repeating goals aggregate saved entries and reset across week/month boundaries", async () => {
  const { repo, setDate } = await fixture("2026-10-31");
  await repo.createHabit(input);
  await repo.changeEntry("test-1", "2026-10-31", { delta: 20 });
  setDate("2026-11-01");
  await repo.changeEntry("test-1", "2026-11-01", { delta: 10 });
  await repo.createGoal({
    habitId: "test-1",
    period: "week",
    metric: "quantity",
    target: 100,
  });
  await repo.createGoal({
    habitId: "test-1",
    period: "month",
    metric: "completions",
    target: 20,
  });
  const data = await repo.load();
  assert.equal(goalProgress(data.goals[0], data, "2026-11-01").value, 30);
  assert.equal(goalProgress(data.goals[0], data, "2026-11-02").value, 0);
  assert.equal(goalProgress(data.goals[1], data, "2026-11-01").value, 0);
  await assert.rejects(
    repo.createGoal({
      habitId: "test-1",
      period: "week",
      metric: "quantity",
      target: 10,
    }),
  );
  await repo.removeGoal(data.goals[0].id);
  assert.equal((await repo.load()).entries.length, 2);
});
test("invalid forms do not damage data and parameterized SQL preserves literal names", async () => {
  const { repo } = await fixture();
  for (const override of [
    { name: "  " },
    { target: NaN },
    { target: -1 },
    { weekdays: [] },
    { target: 1.5 },
  ])
    await assert.rejects(repo.createHabit({ ...input, ...override }));
  await repo.createHabit({ ...input, name: "Leer'); DROP TABLE habits; --" });
  assert.equal((await repo.load()).habits.length, 9);
  await assert.rejects(
    repo.savePreferences({ name: "", theme: "light", accent: "mint" }),
  );
  assert.equal((await repo.load()).preferences.name, "Austin");
});
test("failed initialization rolls back schema and is retryable; newer schemas are preserved", async () => {
  const adapter = new SQLiteAdapter(new DatabaseSync(":memory:"));
  let badDate = true;
  const original = adapter.runAsync.bind(adapter);
  adapter.runAsync = async (sql, ...params) => {
    if (badDate && sql.startsWith("INSERT INTO habits"))
      throw new Error("disk write failed");
    return original(sql, ...params);
  };
  const repo = new HabitRepository(adapter, () => "2026-11-06");
  await assert.rejects(repo.initialize());
  badDate = false;
  await repo.initialize();
  assert.equal((await repo.load()).habits.length, 8);
  adapter.db.exec("PRAGMA user_version = 2");
  await assert.rejects(repo.initialize(), /más reciente/);
  assert.equal((await repo.load()).habits.length, 8);
});
