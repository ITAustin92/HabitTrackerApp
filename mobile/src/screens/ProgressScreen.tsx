import { useMemo, useState } from "react";
import { View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { chartStart, rangeSummary, streak } from "../domain/analytics";
import { monthStart, prettyDate, startOfWeek } from "../domain/dates";
import { useApp } from "../state/AppProvider";
import {
  Chip,
  Empty,
  Label,
  Panel,
  Row,
  Screen,
  common,
} from "../ui/components";
import { font, useTheme } from "../ui/theme";

export function ProgressScreen() {
  const { snapshot, today } = useApp();
  const t = useTheme();
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");
  const start = chartStart(today, period);
  const stats = useMemo(
    () => rangeSummary(snapshot, start, today),
    [snapshot, start, today],
  );
  const best = Math.max(
    0,
    ...snapshot.habits.map((h) => streak(h, snapshot.entries, today).best),
  );
  const buckets = new Map<string, { due: number; completed: number }>();
  for (const d of stats.days) {
    const key = period === "month" ? startOfWeek(d.date) : monthStart(d.date);
    const prev = buckets.get(key) ?? { due: 0, completed: 0 };
    buckets.set(key, {
      due: prev.due + d.due,
      completed: prev.completed + d.completed,
    });
  }
  const bars = [...buckets.entries()].map(([date, s]) => ({
    date,
    rate: s.due ? Math.round((s.completed / s.due) * 100) : 0,
  }));
  const barWidth = 300 / Math.max(bars.length, 1);
  const hasEntries = snapshot.entries.some(
    (e) => e.date >= start && e.date <= today && e.value > 0,
  );
  return (
    <Screen
      title="Mira cuánto has crecido."
      subtitle="Aquí cuentan tus avances reales, un día a la vez."
    >
      <View style={common.wrap}>
        {(
          [
            ["month", "Este mes"],
            ["quarter", "3 meses"],
            ["year", "Este año"],
          ] as const
        ).map(([value, label]) => (
          <Chip
            key={value}
            label={label}
            active={period === value}
            onPress={() => setPeriod(value)}
          />
        ))}
      </View>
      <Label muted style={{ fontSize: 11 }}>
        {prettyDate(start, { day: "numeric", month: "short", year: "numeric" })}{" "}
        —{" "}
        {prettyDate(today, { day: "numeric", month: "short", year: "numeric" })}
      </Label>
      <Row style={{ alignItems: "stretch", gap: 9 }}>
        {[
          ["Completados", String(stats.completed)],
          ["Constancia", `${stats.rate}%`],
          ["Mejor racha", `${best}`],
        ].map(([label, value]) => (
          <Panel key={label} style={{ flex: 1, padding: 13 }}>
            <Label muted style={{ fontSize: 9 }}>
              {label}
            </Label>
            <Label title style={{ fontSize: 25, lineHeight: 35, marginTop: 8 }}>
              {value}
            </Label>
            <Label muted style={{ fontSize: 9 }}>
              {label === "Mejor racha"
                ? "días programados¹"
                : label === "Completados"
                  ? "en este período"
                  : "de lo programado"}
            </Label>
          </Panel>
        ))}
      </Row>
      {!hasEntries && (
        <Empty
          title="Tu jardín recién comienza."
          detail="Registra tu primer avance en Hoy. Los gráficos crecerán contigo, sin datos de ejemplo."
        />
      )}
      <Panel>
        <Label title style={{ fontSize: 17 }}>
          Así vas creciendo
        </Label>
        <Label muted style={{ fontSize: 11, marginTop: 4 }}>
          Porcentaje de hábitos completados por{" "}
          {period === "month" ? "semana" : "mes"}
        </Label>
        <Svg
          viewBox="0 0 320 190"
          width="100%"
          height={210}
          accessibilityLabel="Gráfico de constancia"
        >
          <Rect x={10} y={158} width={300} height={1} fill={t.line} />
          {bars.map((bar, i) => {
            const x = 10 + i * barWidth + barWidth * 0.15;
            const height = bar.rate * 1.15;
            return (
              <ViewlessBar
                key={bar.date}
                x={x}
                y={158 - height}
                width={barWidth * 0.7}
                height={height}
                color={
                  i % 2 ? t.palette.lavender : t.dark ? "#91ac7a" : "#b7c99c"
                }
                label={`${bar.rate}%`}
                dateLabel={prettyDate(
                  bar.date,
                  period === "month"
                    ? { day: "numeric", month: "short" }
                    : { month: "short" },
                )}
              />
            );
          })}
        </Svg>
      </Panel>
      <Panel>
        <Label title style={{ fontSize: 17 }}>
          Tu jardín de constancia
        </Label>
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 20 }}>
          {stats.days.map((d) => (
            <View
              key={d.date}
              accessible
              accessibilityLabel={`${prettyDate(d.date)}: ${d.completed} de ${d.due} hábitos completados`}
              style={{
                width: `${100 / (period === "month" ? 14 : 28)}%`,
                padding: 1.5,
              }}
            >
              <View
                style={{
                  aspectRatio: 1,
                  borderRadius: 3,
                  backgroundColor:
                    !d.due || !d.completed
                      ? t.line
                      : d.rate < 50
                        ? "#dce5c9"
                        : d.rate < 100
                          ? "#b8ce9f"
                          : "#718d65",
                }}
              />
            </View>
          ))}
        </View>
        <Label muted style={{ fontSize: 10, marginTop: 14 }}>
          Más verde, más constancia. {stats.activeDays} días con logros en este
          período.
        </Label>
      </Panel>
      <Panel>
        <Label title style={{ fontSize: 17 }}>
          Tus hábitos, de cerca
        </Label>
        {snapshot.habits.map((h) => {
          const one = rangeSummary({ ...snapshot, habits: [h] }, start, today);
          return (
            <Row
              key={h.id}
              style={{
                paddingVertical: 13,
                borderBottomColor: t.line,
                borderBottomWidth: 1,
              }}
            >
              <Label style={{ flex: 1 }}>
                {h.emoji} {h.name}
                {h.archivedOn ? " · archivado" : ""}
              </Label>
              <Label muted style={{ fontSize: 11 }}>
                {one.completed}/{one.due} días
              </Label>
              <Label title style={{ fontSize: 13 }}>
                {one.rate}%
              </Label>
            </Row>
          );
        })}
      </Panel>
      <Label muted style={{ fontSize: 10 }}>
        ¹ Mejor racha histórica de un hábito. Los días de descanso no la
        interrumpen; hoy tienes hasta el final del día para completar lo
        pendiente.
      </Label>
    </Screen>
  );
}
function ViewlessBar({
  x,
  y,
  width,
  height,
  color,
  label,
  dateLabel,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  label: string;
  dateLabel: string;
}) {
  const t = useTheme();
  return (
    <>
      <Rect
        x={x}
        y={y}
        width={width}
        height={Math.max(0, height)}
        rx={5}
        fill={color}
      />
      <SvgText
        x={x + width / 2}
        y={y - 8}
        textAnchor="middle"
        fill={t.muted}
        fontSize={8}
        fontFamily={font.body}
      >
        {label}
      </SvgText>
      <SvgText
        x={x + width / 2}
        y={178}
        textAnchor="middle"
        fill={t.muted}
        fontSize={8}
      >
        {dateLabel}
      </SvgText>
    </>
  );
}
