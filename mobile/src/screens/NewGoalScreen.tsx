import { useState } from "react";
import { KeyboardAvoidingView, Platform, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useApp } from "../state/AppProvider";
import {
  Button,
  Chip,
  Empty,
  Label,
  Panel,
  Screen,
  common,
} from "../ui/components";
import { useTheme } from "../ui/theme";

export function NewGoalScreen() {
  const { snapshot, createGoal, busy } = useApp();
  const t = useTheme();
  const active = snapshot.habits.filter((h) => !h.archivedOn);
  const [habitId, setHabitId] = useState(active[0]?.id ?? "");
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [metric, setMetric] = useState<"completions" | "quantity">(
    "completions",
  );
  const [target, setTarget] = useState("4");
  const habit = active.find((h) => h.id === habitId);
  const submit = async () => {
    if (await createGoal({ habitId, period, metric, target: Number(target) }))
      router.back();
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen
        title="Una nueva dirección."
        subtitle="Elige una meta que se sienta posible para ti."
        action={
          <Button
            title="×"
            secondary
            label="Cerrar formulario"
            onPress={() => router.back()}
          />
        }
      >
        {active.length ? (
          <>
            <Panel>
              <Label style={common.formLabel}>
                ¿Qué hábito quieres cultivar?
              </Label>
              <View style={common.wrap}>
                {active.map((h) => (
                  <Chip
                    key={h.id}
                    label={`${h.emoji} ${h.name}`}
                    active={habitId === h.id}
                    onPress={() => {
                      setHabitId(h.id);
                      if (h.type === "check") setMetric("completions");
                    }}
                  />
                ))}
              </View>
              <Label style={common.formLabel}>Tu horizonte</Label>
              <View style={common.wrap}>
                <Chip
                  label="Cada semana"
                  active={period === "week"}
                  onPress={() => setPeriod("week")}
                />
                <Chip
                  label="Cada mes"
                  active={period === "month"}
                  onPress={() => setPeriod("month")}
                />
              </View>
              <Label style={common.formLabel}>¿Qué quieres sumar?</Label>
              <View style={common.wrap}>
                <Chip
                  label="Días completados"
                  active={metric === "completions"}
                  onPress={() => setMetric("completions")}
                />
                {habit?.type !== "check" && (
                  <Chip
                    label={`Total de ${habit?.unit}`}
                    active={metric === "quantity"}
                    onPress={() => setMetric("quantity")}
                  />
                )}
              </View>
              <Label style={common.formLabel}>
                Objetivo de {metric === "completions" ? "días" : habit?.unit}
              </Label>
              <TextInput
                accessibilityLabel="Objetivo de la meta"
                keyboardType="number-pad"
                value={target}
                onChangeText={setTarget}
                maxLength={7}
                style={[
                  common.input,
                  { color: t.ink, backgroundColor: t.bg, borderColor: t.line },
                ]}
              />
              <Label muted style={{ fontSize: 11, marginTop: 18 }}>
                Las semanas empiezan el lunes. La meta usa los registros del
                período actual y vuelve a empezar la próxima semana o mes.
              </Label>
            </Panel>
            <Button
              title={busy ? "Guardando…" : "Crear mi meta 🌱"}
              disabled={busy}
              onPress={() => {
                void submit();
              }}
            />
          </>
        ) : (
          <Empty
            title="Primero, una semillita."
            detail="Crea un hábito para poder asociarle una meta."
            action={
              <Button
                title="Crear un hábito"
                onPress={() => router.replace("/new-habit")}
              />
            }
          />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}
