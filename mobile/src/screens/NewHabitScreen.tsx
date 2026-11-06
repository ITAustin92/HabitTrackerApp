import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { colors, type HabitColor, type HabitType } from "../domain/model";
import { useApp } from "../state/AppProvider";
import { Button, Chip, Label, Panel, Screen, common } from "../ui/components";
import { useTheme } from "../ui/theme";

const colorNames = {
  mint: "Menta",
  lavender: "Lavanda",
  peach: "Durazno",
  blue: "Cielo",
  pink: "Rosa",
  yellow: "Limón",
};
export function NewHabitScreen() {
  const t = useTheme();
  const { createHabit, busy } = useApp();
  const [name, setName] = useState("");
  const [type, setType] = useState<HabitType>("check");
  const [target, setTarget] = useState("1");
  const [unit, setUnit] = useState("vasos");
  const [emoji, setEmoji] = useState("🌱");
  const [color, setColor] = useState<HabitColor>("mint");
  const [weekdays, setWeekdays] = useState([1, 2, 3, 4, 5, 6, 7]);
  const inputStyle = [
    common.input,
    { color: t.ink, borderColor: t.line, backgroundColor: t.bg },
  ];
  const submit = async () => {
    if (
      await createHabit({
        name,
        type,
        target: type === "check" ? 1 : Number(target),
        unit,
        emoji,
        color,
        weekdays,
      })
    )
      router.back();
  };
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen
        title="Cultiva un nuevo hábito."
        subtitle="Hazlo pequeño. Hazlo tuyo."
        action={
          <Button
            title="×"
            label="Cerrar formulario"
            secondary
            onPress={() => router.back()}
          />
        }
      >
        <Panel>
          <Label style={common.formLabel}>Nombre del hábito</Label>
          <TextInput
            accessibilityLabel="Nombre del hábito"
            placeholder="Por ejemplo, salir a caminar"
            placeholderTextColor={t.muted}
            value={name}
            onChangeText={setName}
            maxLength={60}
            style={inputStyle}
            autoCapitalize="sentences"
          />
          <Label style={common.formLabel}>¿Cómo lo registras?</Label>
          <View style={common.wrap}>
            {(
              [
                ["check", "✓ Completado"],
                ["count", "＋ Cantidad"],
                ["minutes", "◷ Minutos"],
              ] as const
            ).map(([value, label]) => (
              <Chip
                key={value}
                label={label}
                active={type === value}
                onPress={() => {
                  setType(value);
                  setTarget(
                    value === "minutes" ? "20" : value === "count" ? "8" : "1",
                  );
                }}
              />
            ))}
          </View>
          {type !== "check" && (
            <>
              <Label style={common.formLabel}>Objetivo diario</Label>
              <TextInput
                accessibilityLabel="Objetivo diario"
                keyboardType="number-pad"
                value={target}
                onChangeText={setTarget}
                maxLength={5}
                style={inputStyle}
              />
              {type === "count" && (
                <>
                  <Label style={common.formLabel}>Unidad</Label>
                  <TextInput
                    accessibilityLabel="Unidad"
                    placeholder="vasos, páginas, sesiones…"
                    placeholderTextColor={t.muted}
                    value={unit}
                    onChangeText={setUnit}
                    maxLength={20}
                    style={inputStyle}
                  />
                </>
              )}
            </>
          )}
          <Label style={common.formLabel}>¿Qué días te gustaría hacerlo?</Label>
          <View style={common.wrap}>
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(
              (label, i) => (
                <Chip
                  key={label}
                  label={label}
                  active={weekdays.includes(i + 1)}
                  onPress={() =>
                    setWeekdays((current) =>
                      current.includes(i + 1)
                        ? current.filter((n) => n !== i + 1)
                        : [...current, i + 1],
                    )
                  }
                />
              ),
            )}
          </View>
          <Label style={common.formLabel}>Un pequeño icono</Label>
          <View style={common.wrap}>
            {[
              "🌱",
              "🏋️",
              "💬",
              "💧",
              "📖",
              "💻",
              "🪴",
              "🎯",
              "🃏",
              "🚶",
              "🎨",
              "🧘",
            ].map((e) => (
              <Pressable
                key={e}
                accessibilityRole="button"
                accessibilityLabel={`Icono ${e}`}
                accessibilityState={{ selected: emoji === e }}
                onPress={() => setEmoji(e)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: emoji === e ? t.accent : t.line,
                  backgroundColor: emoji === e ? t.hero : t.bg,
                }}
              >
                <Label style={{ fontSize: 22, lineHeight: 27 }}>{e}</Label>
              </Pressable>
            ))}
          </View>
          <Label style={common.formLabel}>Tu color</Label>
          <View style={common.wrap}>
            {colors.map((c) => (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityLabel={colorNames[c]}
                accessibilityState={{ selected: color === c }}
                onPress={() => setColor(c)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: t.palette[c],
                  borderColor: color === c ? t.accent : t.line,
                  borderWidth: color === c ? 2 : 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Label>{color === c ? "✓" : ""}</Label>
              </Pressable>
            ))}
          </View>
        </Panel>
        <Label muted style={{ fontSize: 11 }}>
          Tu hábito empieza hoy. Puedes añadir más hábitos y archivar los que
          dejes de usar desde Ajustes.
        </Label>
        <Button
          title={busy ? "Guardando…" : "Añadir a mi día ＋"}
          onPress={() => {
            void submit();
          }}
          disabled={busy}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
