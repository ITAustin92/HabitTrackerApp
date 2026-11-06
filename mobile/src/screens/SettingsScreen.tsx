import { useState } from "react";
import { Alert, Pressable, TextInput, View } from "react-native";
import { colors } from "../domain/model";
import { useApp } from "../state/AppProvider";
import {
  Button,
  Chip,
  Label,
  Panel,
  Row,
  Screen,
  common,
} from "../ui/components";
import { useTheme } from "../ui/theme";

export function SettingsScreen() {
  const { snapshot, busy, savePreferences, archiveHabit } = useApp();
  const t = useTheme();
  const preferences = snapshot.preferences;
  const [name, setName] = useState(preferences.name);
  const colorNames = {
    mint: "Menta",
    lavender: "Lavanda",
    peach: "Durazno",
    blue: "Cielo",
    pink: "Rosa",
    yellow: "Limón",
  };
  return (
    <Screen title="A tu manera." subtitle="Un espacio que se siente como tú.">
      <Panel>
        <Label title style={{ fontSize: 18 }}>
          Tu pequeño espacio
        </Label>
        <Label style={common.formLabel}>¿Cómo te llamamos?</Label>
        <TextInput
          accessibilityLabel="Tu nombre"
          value={name}
          onChangeText={setName}
          maxLength={40}
          style={[
            common.input,
            { color: t.ink, borderColor: t.line, backgroundColor: t.bg },
          ]}
        />
        <View style={{ marginTop: 14 }}>
          <Button
            title="Guardar nombre"
            secondary
            disabled={busy || name.trim() === preferences.name}
            onPress={() => {
              void savePreferences({ ...preferences, name });
            }}
          />
        </View>
        <Label style={common.formLabel}>Apariencia</Label>
        <View style={common.wrap}>
          {(
            [
              ["system", "Del teléfono"],
              ["light", "Clara"],
              ["dark", "Oscura"],
            ] as const
          ).map(([value, label]) => (
            <Chip
              key={value}
              label={label}
              active={preferences.theme === value}
              disabled={busy}
              onPress={() => {
                void savePreferences({ ...preferences, theme: value });
              }}
            />
          ))}
        </View>
        <Label style={common.formLabel}>Color de acento</Label>
        <View style={common.wrap}>
          {colors.map((c) => (
            <Pressable
              key={c}
              accessibilityRole="button"
              accessibilityLabel={`Color ${colorNames[c]}`}
              accessibilityState={{ selected: preferences.accent === c }}
              disabled={busy}
              onPress={() => {
                void savePreferences({ ...preferences, accent: c });
              }}
              style={{
                height: 43,
                width: 43,
                borderRadius: 24,
                borderWidth: preferences.accent === c ? 2 : 1,
                borderColor: preferences.accent === c ? t.accent : t.line,
                backgroundColor: t.palette[c],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Label>{preferences.accent === c ? "✓" : ""}</Label>
            </Pressable>
          ))}
        </View>
      </Panel>
      <Panel>
        <Label title style={{ fontSize: 18 }}>
          Tus hábitos
        </Label>
        <Label muted style={{ fontSize: 11, marginTop: 7 }}>
          Archivar conserva tu historia y detiene la programación a partir de
          mañana.
        </Label>
        {snapshot.habits
          .filter((h) => !h.archivedOn)
          .map((h) => (
            <Row
              key={h.id}
              style={{
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderBottomColor: t.line,
              }}
            >
              <View style={{ flex: 1 }}>
                <Label>
                  {h.emoji} {h.name}
                </Label>
                <Label muted style={{ fontSize: 10 }}>
                  {h.weekdays.length === 7
                    ? "Cada día"
                    : h.weekdays
                        .map(
                          (d) =>
                            ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"][
                              d - 1
                            ],
                        )
                        .join(" · ")}
                </Label>
              </View>
              <Button
                title="Archivar"
                secondary
                disabled={busy}
                onPress={() =>
                  Alert.alert(
                    "¿Archivar este hábito?",
                    "Se conservarán todos tus registros. Dejará de programarse a partir de mañana.",
                    [
                      { text: "Volver", style: "cancel" },
                      {
                        text: "Archivar",
                        onPress: () => {
                          void archiveHabit(h.id);
                        },
                      },
                    ],
                  )
                }
              />
            </Row>
          ))}
        {snapshot.habits
          .filter((h) => h.archivedOn)
          .map((h) => (
            <Label key={h.id} muted style={{ fontSize: 11, marginTop: 15 }}>
              {h.emoji} {h.name} · Archivado
            </Label>
          ))}
      </Panel>
      <Panel style={{ gap: 12 }}>
        <Label title style={{ fontSize: 18 }}>
          Tu información, contigo
        </Label>
        <Label muted style={{ fontSize: 12 }}>
          Hábitos, registros, metas y preferencias se guardan con SQLite en este
          dispositivo, sin cuenta ni conexión.
        </Label>
        <Label muted style={{ fontSize: 12 }}>
          Los datos se conservan al cerrar y abrir la aplicación. Desinstalarla
          o borrar sus datos puede eliminarlos. El respaldo JSON/CSV se
          incorporará en la siguiente etapa.
        </Label>
        <Label muted style={{ fontSize: 12 }}>
          El prototipo web y esta aplicación tienen datos independientes. La
          sincronización y las notificaciones reales todavía no están activas.
        </Label>
      </Panel>
      <Panel
        style={{
          backgroundColor: t.palette.yellow,
          alignItems: "center",
          gap: 8,
        }}
      >
        <Label style={{ fontSize: 30, lineHeight: 40 }}>🌱</Label>
        <Label title style={{ fontSize: 23 }}>
          Poquito
        </Label>
        <Label style={{ fontSize: 12 }}>Tus hábitos, a tu ritmo.</Label>
        <Label muted style={{ fontSize: 10 }}>
          Versión 0.2 · Tu primer jardín de verdad
        </Label>
      </Panel>
    </Screen>
  );
}
