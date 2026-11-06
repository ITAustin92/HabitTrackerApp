import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { daySummary, entryIndex, entryKey, isDue } from "../domain/analytics";
import {
  addDays,
  daysBetween,
  monthEnd,
  monthStart,
  prettyDate,
  weekday,
} from "../domain/dates";
import { useApp } from "../state/AppProvider";
import { Button, Empty, Label, Panel, Row, Screen } from "../ui/components";
import { HabitCard } from "../ui/HabitCard";
import { useTheme } from "../ui/theme";

export function CalendarScreen() {
  const { snapshot, today } = useApp();
  const t = useTheme();
  const [month, setMonth] = useState(monthStart(today));
  const [selected, setSelected] = useState(today);
  const index = useMemo(() => entryIndex(snapshot.entries), [snapshot.entries]);
  const cells = [
    ...Array.from({ length: weekday(month) - 1 }, () => null),
    ...daysBetween(month, monthEnd(month)),
  ];
  const due = snapshot.habits.filter((h) => isDue(h, selected));
  const changeMonth = (delta: number) => {
    const next = monthStart(month, delta);
    setMonth(next);
    setSelected(next === monthStart(today) ? today : next);
  };
  return (
    <Screen
      title="Tus días cuentan."
      subtitle="Un punto, una vez que elegiste cuidarte."
    >
      <Panel>
        <Row>
          <Button
            title="←"
            secondary
            label="Mes anterior"
            onPress={() => changeMonth(-1)}
          />
          <Label
            title
            style={{
              fontSize: 16,
              textTransform: "capitalize",
              flex: 1,
              textAlign: "center",
            }}
          >
            {prettyDate(month, { month: "long", year: "numeric" })}
          </Label>
          <Button
            title="→"
            secondary
            label="Mes siguiente"
            disabled={month >= monthStart(today)}
            onPress={() => changeMonth(1)}
          />
        </Row>
        <View style={{ flexDirection: "row", marginTop: 24, marginBottom: 8 }}>
          {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
            <Label
              key={i}
              muted
              style={{ width: "14.2857%", textAlign: "center", fontSize: 10 }}
            >
              {d}
            </Label>
          ))}
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cells.map((date, i) => {
            const summary = date
              ? daySummary(snapshot.habits, index, date)
              : null;
            const completed = date
              ? snapshot.habits.filter((h) => {
                  const e = index.get(entryKey(h.id, date));
                  return e && e.value >= e.target;
                })
              : [];
            return (
              <View
                key={date ?? `blank-${i}`}
                style={{ width: "14.2857%", padding: 2 }}
              >
                {date ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${prettyDate(date)}: ${summary?.completed} de ${summary?.due} completados`}
                    accessibilityState={{
                      selected: selected === date,
                      disabled: date > today,
                    }}
                    disabled={date > today}
                    onPress={() => setSelected(date)}
                    style={{
                      minHeight: 62,
                      padding: 7,
                      borderRadius: 12,
                      alignItems: "center",
                      gap: 7,
                      backgroundColor: selected === date ? t.hero : t.bg,
                      borderColor: selected === date ? t.accent : "transparent",
                      borderWidth: 1,
                      opacity: date > today ? 0.3 : 1,
                    }}
                  >
                    <Label style={{ fontSize: 12 }}>
                      {Number(date.slice(-2))}
                    </Label>
                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      {completed.slice(0, 6).map((h) => (
                        <View
                          key={h.id}
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 3,
                            backgroundColor: t.dark
                              ? "#c5d6ae"
                              : {
                                  mint: "#90ac82",
                                  lavender: "#a493c5",
                                  peach: "#d5a580",
                                  blue: "#89a9bd",
                                  pink: "#cd97aa",
                                  yellow: "#b3b45e",
                                }[h.color],
                          }}
                        />
                      ))}
                    </View>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
        <Label muted style={{ fontSize: 10, marginTop: 15 }}>
          ● Cada punto representa un hábito completado.
        </Label>
      </Panel>
      <Row>
        <Label title style={{ fontSize: 20 }}>
          {prettyDate(selected)}
        </Label>
        <Button
          secondary
          title="Hoy"
          onPress={() => {
            setMonth(monthStart(today));
            setSelected(today);
          }}
        />
      </Row>
      <Label muted style={{ fontSize: 12 }}>
        Puedes corregir tus registros de días anteriores. No contamos los días
        en que el hábito no estaba programado.
      </Label>
      {due.length ? (
        due.map((h) => (
          <HabitCard
            key={h.id}
            habit={h}
            entry={index.get(entryKey(h.id, selected))}
            date={selected}
          />
        ))
      ) : (
        <Empty
          title="Un día sin hábitos programados."
          detail="Tus registros aparecerán aquí desde la fecha de creación de cada hábito."
        />
      )}
      {selected < addDays(today, -30) && (
        <Label muted style={{ fontSize: 11 }}>
          Tu historial vive en este dispositivo, también al cerrar la app.
        </Label>
      )}
    </Screen>
  );
}
