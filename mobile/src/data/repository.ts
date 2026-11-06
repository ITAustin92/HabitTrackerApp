import { addDays, dayKey, fromDay } from "../domain/dates";
import { isDue } from "../domain/analytics";
import {
  colors,
  defaultPreferences,
  validateHabit,
  type Entry,
  type Goal,
  type GoalInput,
  type Habit,
  type HabitInput,
  type Preferences,
  type Snapshot,
} from "../domain/model";
import { seedHabits } from "./seeds";

type Param = string | number | null;
/** Small structural interface: Expo in the app, real SQLite in integration tests. */
export interface Database {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: Param[]): Promise<unknown>;
  getAllAsync<T>(sql: string, ...params: Param[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: Param[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
interface HabitRow {
  id: string;
  name: string;
  emoji: string;
  color: Habit["color"];
  type: Habit["type"];
  target: number;
  unit: string;
  weekdays: string;
  created_on: string;
  archived_on: string | null;
}
const habitFromRow = (r: HabitRow): Habit => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  color: r.color,
  type: r.type,
  target: r.target,
  unit: r.unit,
  weekdays: JSON.parse(r.weekdays),
  createdOn: r.created_on,
  archivedOn: r.archived_on,
});
export class HabitRepository {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(
    private db: Database,
    private today = () => dayKey(),
    private makeId = () =>
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
  ) {}

  // Serialize reads and writes on the single connection. A failed write does not poison the queue.
  private serial<T>(operation: () => Promise<T>): Promise<T> {
    const pending = this.queue.then(operation);
    this.queue = pending.catch(() => undefined);
    return pending;
  }
  initialize(): Promise<void> {
    return this.serial(async () => {
      await this.db.execAsync(
        "PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;",
      );
      const version = await this.db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
      );
      if ((version?.user_version ?? 0) > 1)
        throw new Error(
          "Esta base de datos requiere una versión más reciente de Poquito.",
        );
      if (version?.user_version === 1) return;
      await this.db.withTransactionAsync(async () => {
        await this.db.execAsync(`
          CREATE TABLE habits (
            id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, emoji TEXT NOT NULL,
            color TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('check','count','minutes')),
            target INTEGER NOT NULL CHECK(target BETWEEN 1 AND 10000), unit TEXT NOT NULL,
            weekdays TEXT NOT NULL, created_on TEXT NOT NULL, archived_on TEXT
          );
          CREATE TABLE entries (
            habit_id TEXT NOT NULL REFERENCES habits(id), date TEXT NOT NULL,
            value INTEGER NOT NULL CHECK(value BETWEEN 0 AND 1000000),
            target INTEGER NOT NULL CHECK(target BETWEEN 1 AND 10000),
            PRIMARY KEY(habit_id, date)
          );
          CREATE INDEX entries_date ON entries(date);
          CREATE TABLE goals (
            id TEXT PRIMARY KEY NOT NULL, habit_id TEXT NOT NULL REFERENCES habits(id),
            period TEXT NOT NULL CHECK(period IN ('week','month')),
            metric TEXT NOT NULL CHECK(metric IN ('completions','quantity')),
            target INTEGER NOT NULL CHECK(target BETWEEN 1 AND 1000000), created_on TEXT NOT NULL,
            UNIQUE(habit_id, period, metric)
          );
          CREATE TABLE preferences (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
        `);
        for (let i = 0; i < seedHabits.length; i++)
          await this.insertHabit(
            `initial-${i + 1}`,
            validateHabit(seedHabits[i]),
          );
        await this.db.runAsync(
          "INSERT INTO preferences(key,value) VALUES (?,?)",
          "appearance",
          JSON.stringify(defaultPreferences),
        );
        await this.db.execAsync("PRAGMA user_version = 1");
      });
    });
  }
  private async insertHabit(id: string, h: HabitInput) {
    await this.db.runAsync(
      "INSERT INTO habits(id,name,emoji,color,type,target,unit,weekdays,created_on) VALUES (?,?,?,?,?,?,?,?,?)",
      id,
      h.name,
      h.emoji,
      h.color,
      h.type,
      h.target,
      h.unit,
      JSON.stringify(h.weekdays),
      this.today(),
    );
  }
  load(): Promise<Snapshot> {
    return this.serial(async () => {
      const habits = (
        await this.db.getAllAsync<HabitRow>(
          "SELECT * FROM habits ORDER BY rowid",
        )
      ).map(habitFromRow);
      const entries = await this.db.getAllAsync<Entry>(
        "SELECT habit_id AS habitId,date,value,target FROM entries ORDER BY date",
      );
      const goals = await this.db.getAllAsync<Goal>(
        "SELECT id,habit_id AS habitId,period,metric,target,created_on AS createdOn FROM goals ORDER BY rowid",
      );
      const row = await this.db.getFirstAsync<{ value: string }>(
        "SELECT value FROM preferences WHERE key=?",
        "appearance",
      );
      const preferences = row
        ? (JSON.parse(row.value) as Preferences)
        : { ...defaultPreferences };
      return { habits, entries, goals, preferences };
    });
  }
  createHabit(input: HabitInput): Promise<void> {
    return this.serial(async () => {
      await this.insertHabit(this.makeId(), validateHabit(input));
    });
  }
  private async getHabit(id: string): Promise<Habit> {
    const row = await this.db.getFirstAsync<HabitRow>(
      "SELECT * FROM habits WHERE id=?",
      id,
    );
    if (!row) throw new Error("No encontramos este hábito.");
    return habitFromRow(row);
  }
  changeEntry(
    id: string,
    date: string,
    change: { delta: number } | { toggle: true },
  ): Promise<void> {
    return this.serial(async () => {
      fromDay(date);
      if (date > this.today())
        throw new Error("Puedes registrar avances hasta el día de hoy.");
      await this.db.withTransactionAsync(async () => {
        const h = await this.getHabit(id);
        if (!isDue(h, date))
          throw new Error("Este hábito no estaba programado para esa fecha.");
        const current = await this.db.getFirstAsync<Entry>(
          "SELECT habit_id AS habitId,date,value,target FROM entries WHERE habit_id=? AND date=?",
          id,
          date,
        );
        const target = current?.target ?? h.target;
        const previous = current?.value ?? 0;
        if ("delta" in change && !Number.isInteger(change.delta))
          throw new Error("El avance debe ser un número entero.");
        let value =
          "toggle" in change
            ? previous >= target
              ? 0
              : target
            : Math.max(0, previous + change.delta);
        if (h.type === "check") value = Math.min(1, value);
        if (value > 1000000) throw new Error("El valor es demasiado grande.");
        if (value === 0)
          await this.db.runAsync(
            "DELETE FROM entries WHERE habit_id=? AND date=?",
            id,
            date,
          );
        else
          await this.db.runAsync(
            "INSERT INTO entries(habit_id,date,value,target) VALUES (?,?,?,?) ON CONFLICT(habit_id,date) DO UPDATE SET value=excluded.value",
            id,
            date,
            value,
            target,
          );
      });
    });
  }
  archiveHabit(id: string): Promise<void> {
    return this.serial(async () => {
      await this.getHabit(id);
      await this.db.runAsync(
        "UPDATE habits SET archived_on=? WHERE id=? AND archived_on IS NULL",
        addDays(this.today(), 1),
        id,
      );
    });
  }
  createGoal(input: GoalInput): Promise<void> {
    return this.serial(async () => {
      const h = await this.getHabit(input.habitId);
      if (h.archivedOn) throw new Error("Elige un hábito activo.");
      if (
        !["week", "month"].includes(input.period) ||
        !["completions", "quantity"].includes(input.metric)
      )
        throw new Error("Elige una meta válida.");
      if (h.type === "check" && input.metric !== "completions")
        throw new Error("Este hábito se mide por días completados.");
      if (
        !Number.isInteger(input.target) ||
        input.target < 1 ||
        input.target > 1000000
      )
        throw new Error("Escribe un objetivo entero entre 1 y 1.000.000.");
      const existing = await this.db.getFirstAsync<{ id: string }>(
        "SELECT id FROM goals WHERE habit_id=? AND period=? AND metric=?",
        input.habitId,
        input.period,
        input.metric,
      );
      if (existing)
        throw new Error("Ya tienes una meta de ese tipo para este hábito.");
      await this.db.runAsync(
        "INSERT INTO goals(id,habit_id,period,metric,target,created_on) VALUES (?,?,?,?,?,?)",
        this.makeId(),
        input.habitId,
        input.period,
        input.metric,
        input.target,
        this.today(),
      );
    });
  }
  removeGoal(id: string): Promise<void> {
    return this.serial(async () => {
      await this.db.runAsync("DELETE FROM goals WHERE id=?", id);
    });
  }
  savePreferences(input: Preferences): Promise<void> {
    return this.serial(async () => {
      if (
        !["system", "light", "dark"].includes(input.theme) ||
        !colors.includes(input.accent) ||
        !input.name.trim() ||
        input.name.length > 40
      )
        throw new Error("Revisa el nombre y las opciones de apariencia.");
      await this.db.runAsync(
        "INSERT INTO preferences(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
        "appearance",
        JSON.stringify({ ...input, name: input.name.trim() }),
      );
    });
  }
}
