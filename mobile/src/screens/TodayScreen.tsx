import { useMemo, useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../state/AppProvider";
import { addDays, prettyDate, startOfWeek } from "../domain/dates";
import { daySummary, entryIndex, entryKey, isDue } from "../domain/analytics";
import {
  Button,
  Chip,
  Empty,
  Label,
  Panel,
  Plant,
  ProgressBar,
  Row,
  Screen,
  common,
} from "../ui/components";
import { HabitCard } from "../ui/HabitCard";
import { useTheme } from "../ui/theme";

export function TodayScreen() {
  const { snapshot, today } = useApp();
  const t = useTheme();
  const [selection, setSelection] = useState({ date: today, asOf: today });
  const date = selection.asOf === today ? selection.date : today;
  const setDate = (date: string) => setSelection({ date, asOf: today });
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const index = useMemo(() => entryIndex(snapshot.entries), [snapshot.entries]);
  const summary = daySummary(snapshot.habits, index, date);
  const due = snapshot.habits.filter((h) => isDue(h, date));
  const visible = due.filter((h) => {
    const e = index.get(entryKey(h.id, date));
    const done = !!e && e.value >= e.target;
    return filter === "all" || (filter === "done" ? done : !done);
  });
  return (
    <Screen
      title={`Hola, ${snapshot.preferences.name} ☀`}
      subtitle="Un pequeño paso hoy. Un gran cambio con el tiempo."
      action={
        <Button
          title="＋"
          label="Crear nuevo hábito"
          onPress={() => router.push("/new-habit")}
        />
      }
    >
      <View
        style={{
          borderRadius: 22,
          padding: 22,
          backgroundColor: t.hero,
          flexDirection: "row",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <View style={{ flex: 1 }}>
          <Label muted style={{ fontSize: 8, letterSpacing: 1.6 }}>
            POQUITO A POQUITO
          </Label>
          <Label
            title
            style={{
              fontSize: 23,
              lineHeight: 31,
              letterSpacing: -0.7,
              marginVertical: 9,
            }}
          >
            Las cosas bonitas toman constancia.
          </Label>
          <Label muted style={{ fontSize: 10 }}>
            Hoy también puedes florecer.
          </Label>
        </View>
        <Plant size={105} />
      </View>
      <Row>
        <Button
          secondary
          title="←"
          label="Semana anterior"
          onPress={() => setDate(addDays(date, -7))}
        />
        <Label title style={{ fontSize: 12 }}>
          {prettyDate(date, { month: "long", year: "numeric" })}
        </Label>
        <Button
          secondary
          title="→"
          label="Semana siguiente"
          disabled={addDays(startOfWeek(date), 7) > today}
          onPress={() =>
            setDate(addDays(date, 7) > today ? today : addDays(date, 7))
          }
        />
      </Row>
      <Row style={{ gap: 4, alignItems: "stretch" }}>
        {["L", "M", "X", "J", "V", "S", "D"].map((label, i) => {
          const key = addDays(startOfWeek(date), i);
          return (
            <View key={key} style={{ flex: 1 }}>
              <Chip
                label={`${label} ${Number(key.slice(-2))}`}
                active={date === key}
                disabled={key > today}
                onPress={() => setDate(key)}
              />
            </View>
          );
        })}
      </Row>
      <Panel>
        <Row>
          <View style={{ flex: 1 }}>
            <Label title style={{ fontSize: 16 }}>
              {date === today ? "Tu día, en un vistazo" : prettyDate(date)}
            </Label>
            <Label muted style={{ fontSize: 11, marginTop: 4 }}>
              {summary.completed} de {summary.due} hábitos completados
            </Label>
          </View>
          <Label title style={{ fontSize: 28, lineHeight: 36 }}>
            {summary.rate}%
          </Label>
        </Row>
        <View style={{ marginTop: 16 }}>
          <ProgressBar percent={summary.rate} />
        </View>
      </Panel>
      <Row>
        <Label title style={{ fontSize: 21 }}>
          Mis pequeños pasos
        </Label>
        {date !== today && (
          <Chip label="Volver a hoy" onPress={() => setDate(today)} />
        )}
      </Row>
      <View style={common.wrap}>
        {(
          [
            ["all", "Todos"],
            ["pending", "Por hacer"],
            ["done", "Completados"],
          ] as const
        ).map(([id, label]) => (
          <Chip
            key={id}
            label={label}
            active={filter === id}
            onPress={() => setFilter(id)}
          />
        ))}
      </View>
      {visible.length ? (
        <View style={{ gap: 12 }}>
          {visible.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              entry={index.get(entryKey(h.id, date))}
              date={date}
            />
          ))}
        </View>
      ) : (
        <Empty
          title={
            due.length
              ? "Todo tranquilo por aquí."
              : "Un día con espacio para ti."
          }
          detail={
            due.length
              ? "No hay hábitos con este filtro."
              : "No tienes hábitos programados para esta fecha. Los nuevos hábitos comienzan hoy."
          }
          action={
            date === today ? (
              <Button
                title="Añadir un hábito"
                onPress={() => router.push("/new-habit")}
              />
            ) : undefined
          }
        />
      )}
    </Screen>
  );
}
