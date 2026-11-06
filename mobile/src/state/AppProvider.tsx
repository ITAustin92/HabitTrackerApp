import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, useColorScheme } from "react-native";
import { openDatabaseAsync } from "expo-sqlite";
import { HabitRepository } from "../data/repository";
import { dayKey } from "../domain/dates";
import {
  defaultPreferences,
  type GoalInput,
  type HabitInput,
  type Preferences,
  type Snapshot,
} from "../domain/model";

const empty: Snapshot = {
  habits: [],
  entries: [],
  goals: [],
  preferences: defaultPreferences,
};
interface AppContextValue {
  snapshot: Snapshot;
  today: string;
  ready: boolean;
  busy: boolean;
  error: string | null;
  dark: boolean;
  retry: () => void;
  dismissError: () => void;
  createHabit: (input: HabitInput) => Promise<boolean>;
  changeEntry: (
    id: string,
    date: string,
    change: { delta: number } | { toggle: true },
  ) => Promise<boolean>;
  archiveHabit: (id: string) => Promise<boolean>;
  createGoal: (input: GoalInput) => Promise<boolean>;
  removeGoal: (id: string) => Promise<boolean>;
  savePreferences: (input: Preferences) => Promise<boolean>;
}
const Context = createContext<AppContextValue | null>(null);
// Reuse one initialization promise/connection across React Strict Mode remounts.
let repositoryPromise: Promise<HabitRepository> | undefined;
function getRepository() {
  if (!repositoryPromise)
    repositoryPromise = (async () => {
      const repo = new HabitRepository(await openDatabaseAsync("poquito.db"));
      await repo.initialize();
      return repo;
    })().catch((error) => {
      repositoryPromise = undefined;
      throw error;
    });
  return repositoryPromise;
}
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(empty);
  const [today, setToday] = useState(dayKey());
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const repo = useRef<HabitRepository | null>(null);
  const lock = useRef(false);
  const systemTheme = useColorScheme();
  const dark =
    snapshot.preferences.theme === "dark" ||
    (snapshot.preferences.theme === "system" && systemTheme === "dark");
  useEffect(() => {
    let active = true;
    getRepository()
      .then(async (value) => {
        const data = await value.load();
        if (active) {
          repo.current = value;
          setSnapshot(data);
          setReady(true);
        }
      })
      .catch((e) => {
        if (active)
          setError(
            e instanceof Error ? e.message : "No pudimos abrir tus registros.",
          );
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  useEffect(() => {
    const updateDay = () => setToday(dayKey());
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") updateDay();
    });
    const timer = setInterval(updateDay, 30000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, []);
  const mutate = useCallback(
    async (operation: (r: HabitRepository) => Promise<void>) => {
      if (!repo.current || lock.current) return false;
      lock.current = true;
      setBusy(true);
      setError(null);
      try {
        await operation(repo.current);
        setSnapshot(await repo.current.load());
        return true;
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No pudimos guardar el cambio. Inténtalo nuevamente.",
        );
        return false;
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [],
  );
  const value = useMemo<AppContextValue>(
    () => ({
      snapshot,
      today,
      ready,
      busy,
      error,
      dark,
      retry: () => {
        setError(null);
        setAttempt((n) => n + 1);
      },
      dismissError: () => setError(null),
      createHabit: (input) => mutate((r) => r.createHabit(input)),
      changeEntry: (id, date, change) =>
        mutate((r) => r.changeEntry(id, date, change)),
      archiveHabit: (id) => mutate((r) => r.archiveHabit(id)),
      createGoal: (input) => mutate((r) => r.createGoal(input)),
      removeGoal: (id) => mutate((r) => r.removeGoal(id)),
      savePreferences: (input) => mutate((r) => r.savePreferences(input)),
    }),
    [snapshot, today, ready, busy, error, dark, mutate],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("AppProvider requerido.");
  return value;
}
