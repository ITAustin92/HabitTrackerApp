import { Alert, View } from "react-native";
import { router } from "expo-router";
import { goalProgress } from "../domain/analytics";
import { prettyDate } from "../domain/dates";
import { useApp } from "../state/AppProvider";
import {
  Button,
  Empty,
  Label,
  Panel,
  Plant,
  ProgressBar,
  Row,
  Screen,
} from "../ui/components";
import { useTheme } from "../ui/theme";

export function GoalsScreen() {
  const { snapshot, today, busy, removeGoal } = useApp();
  const t = useTheme();
  const activeGoals = snapshot.goals.filter(
    (g) => !snapshot.habits.find((h) => h.id === g.habitId)?.archivedOn,
  );
  return (
    <Screen
      title="De poquito en poquito."
      subtitle="Dale una dirección a tus pequeños pasos."
      action={
        <Button
          title="＋"
          label="Crear una meta"
          onPress={() => router.push("/new-goal")}
        />
      }
    >
      {activeGoals.length ? (
        activeGoals.map((goal) => {
          const habit = snapshot.habits.find((h) => h.id === goal.habitId)!;
          const progress = goalProgress(goal, snapshot, today);
          const unit = goal.metric === "completions" ? "días" : habit.unit;
          return (
            <Panel key={goal.id} style={{ gap: 15 }}>
              <Row>
                <View style={{ flex: 1 }}>
                  <Label title style={{ fontSize: 17 }}>
                    {habit.emoji} {habit.name}
                  </Label>
                  <Label muted style={{ fontSize: 11, marginTop: 5 }}>
                    {goal.period === "week" ? "Esta semana" : "Este mes"} ·{" "}
                    {goal.metric === "completions"
                      ? "Días completados"
                      : `Total de ${habit.unit}`}
                  </Label>
                </View>
                <View
                  style={{
                    backgroundColor: t.palette[habit.color],
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                  }}
                >
                  <Label title style={{ fontSize: 12 }}>
                    {progress.percent}%
                  </Label>
                </View>
              </Row>
              <ProgressBar percent={progress.percent} />
              <Row>
                <Label muted style={{ fontSize: 11 }}>
                  {progress.value} / {goal.target} {unit}
                </Label>
                <Label muted style={{ fontSize: 10 }}>
                  Hasta el{" "}
                  {prettyDate(progress.end, { day: "numeric", month: "short" })}
                </Label>
              </Row>
              <Label style={{ fontSize: 12 }}>
                {progress.remaining
                  ? `✦ Te faltan ${progress.remaining} ${unit}. Cada pequeño paso suma.`
                  : "✨ ¡Meta alcanzada! Date un ratito para celebrarlo."}
              </Label>
              <Button
                secondary
                title="Quitar meta"
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "¿Quitar esta meta?",
                    "Tus registros del hábito se conservan.",
                    [
                      { text: "Volver", style: "cancel" },
                      {
                        text: "Quitar",
                        style: "destructive",
                        onPress: () => {
                          void removeGoal(goal.id);
                        },
                      },
                    ],
                  )
                }
              />
            </Panel>
          );
        })
      ) : (
        <Empty
          title="Una dirección para tus pasos."
          detail="Crea una meta semanal o mensual. Su progreso se actualizará con lo que registres en tus hábitos."
          action={
            <Button
              title="Crear mi primera meta"
              onPress={() => router.push("/new-goal")}
            />
          }
        />
      )}
      <Panel style={{ alignItems: "center", backgroundColor: t.hero, gap: 12 }}>
        <Plant />
        <Label title style={{ fontSize: 21 }}>
          Crecer lleva tiempo.
        </Label>
        <Label muted style={{ fontSize: 12, textAlign: "center" }}>
          Las metas se renuevan por semana o mes.{"\n"}Tus registros siguen
          formando parte de tu historia.
        </Label>
      </Panel>
      <Label muted style={{ fontSize: 11 }}>
        Los avisos sobre metas pendientes aparecerán aquí. Las notificaciones
        del teléfono se incorporarán en una próxima etapa.
      </Label>
    </Screen>
  );
}
