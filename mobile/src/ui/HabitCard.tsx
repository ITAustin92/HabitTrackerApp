import { Pressable, View } from "react-native";
import { useApp } from "../state/AppProvider";
import { type Entry, type Habit } from "../domain/model";
import { Label, Row, ProgressBar } from "./components";
import { useTheme } from "./theme";

export function HabitCard({
  habit,
  entry,
  date,
  compact = false,
}: {
  habit: Habit;
  entry?: Entry;
  date: string;
  compact?: boolean;
}) {
  const t = useTheme();
  const { busy, changeEntry, today } = useApp();
  const value = entry?.value ?? 0;
  const target = entry?.target ?? habit.target;
  const done = value >= target;
  const disabled = busy || date > today;
  const step = habit.type === "minutes" ? 5 : 1;
  return (
    <View
      style={{
        backgroundColor: t.palette[habit.color],
        borderRadius: 18,
        padding: 17,
        gap: 12,
        flex: 1,
        minWidth: 0,
      }}
    >
      <Row>
        <Label style={{ fontSize: 24, lineHeight: 32 }}>{habit.emoji}</Label>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done, disabled }}
          accessibilityLabel={`${done ? "Desmarcar" : "Completar"} ${habit.name}`}
          hitSlop={8}
          disabled={disabled}
          onPress={() => {
            void changeEntry(habit.id, date, { toggle: true });
          }}
          style={{
            borderRadius: 17,
            height: 32,
            width: 32,
            borderWidth: 1,
            borderColor: done ? t.accent : t.muted + "70",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: done ? t.accent : "transparent",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <Label style={{ color: t.onAccent, fontSize: 16 }}>
            {done ? "✓" : ""}
          </Label>
        </Pressable>
      </Row>
      <View>
        <Label title style={{ fontSize: compact ? 13 : 15 }}>
          {habit.name}
        </Label>
        <Label muted style={{ fontSize: 11, marginTop: 3 }}>
          {habit.type === "check"
            ? done
              ? "Hecho. ¡Bien por ti!"
              : "Un pequeño paso para hoy"
            : `${value} / ${target} ${habit.unit}`}
        </Label>
      </View>
      {habit.type !== "check" && (
        <>
          <ProgressBar percent={(value / target) * 100} />
          <Row>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Restar ${step} ${habit.unit} a ${habit.name}`}
              disabled={disabled || value === 0}
              onPress={() => {
                void changeEntry(habit.id, date, { delta: -step });
              }}
              style={{
                paddingHorizontal: 13,
                height: 40,
                borderRadius: 13,
                backgroundColor: t.paper + "a0",
                alignItems: "center",
                justifyContent: "center",
                opacity: value === 0 ? 0.45 : 1,
              }}
            >
              <Label style={{ fontSize: 20 }}>−</Label>
            </Pressable>
            <Label muted style={{ fontSize: 10 }}>
              de {step} en {step}
            </Label>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Sumar ${step} ${habit.unit} a ${habit.name}`}
              disabled={disabled}
              onPress={() => {
                void changeEntry(habit.id, date, { delta: step });
              }}
              style={{
                paddingHorizontal: 13,
                height: 40,
                borderRadius: 13,
                backgroundColor: t.paper + "a0",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Label style={{ fontSize: 20 }}>+</Label>
            </Pressable>
          </Row>
        </>
      )}
    </View>
  );
}
