import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ColorValue,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Ellipse, Path } from "react-native-svg";
import { useApp } from "../state/AppProvider";
import { font, useTheme } from "./theme";

export function Label({
  children,
  style,
  muted = false,
  title = false,
  ...props
}: TextProps & {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  muted?: boolean;
  title?: boolean;
}) {
  const t = useTheme();
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: title ? font.title : font.body,
          color: muted ? t.muted : t.ink,
          fontSize: 13,
          lineHeight: 20,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Panel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: t.paper,
          borderColor: t.line,
          borderWidth: 1,
          borderRadius: 21,
          padding: 21,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
  label,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  label?: string;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 46,
        borderRadius: 13,
        paddingHorizontal: 17,
        paddingVertical: 12,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: secondary ? t.paper : t.accent,
        borderWidth: secondary ? 1 : 0,
        borderColor: t.line,
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: secondary ? t.ink : t.onAccent,
          fontSize: 13,
          fontFamily: font.medium,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Chip({
  label,
  active,
  onPress,
  disabled = false,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingHorizontal: 13,
        minHeight: 36,
        paddingVertical: 8,
        borderRadius: 22,
        backgroundColor: active ? t.accent : t.paper,
        borderColor: t.line,
        borderWidth: active ? 0 : 1,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text
        style={{
          color: active ? t.onAccent : t.muted,
          fontFamily: font.medium,
          fontSize: 11,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Row({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function ProgressBar({
  percent,
  color,
}: {
  percent: number;
  color?: string;
}) {
  const t = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.min(100, Math.round(percent)),
      }}
      style={{
        height: 6,
        borderRadius: 10,
        backgroundColor: t.line,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(100, percent))}%`,
          height: 6,
          backgroundColor: color ?? t.accent,
          borderRadius: 10,
        }}
      />
    </View>
  );
}
export function Empty({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel style={{ alignItems: "center", gap: 12, paddingVertical: 28 }}>
      <Label style={{ fontSize: 32, lineHeight: 42 }}>🌱</Label>
      <Label title style={{ fontSize: 17, textAlign: "center" }}>
        {title}
      </Label>
      <Label muted style={{ fontSize: 12, textAlign: "center" }}>
        {detail}
      </Label>
      {action}
    </Panel>
  );
}
export function Screen({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const t = useTheme();
  const { error, dismissError, busy } = useApp();
  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={{ flex: 1, backgroundColor: t.bg }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: 21,
          paddingBottom: 35,
          width: "100%",
          maxWidth: 780,
          alignSelf: "center",
          gap: 20,
        }}
      >
        <Row>
          <Label
            title
            style={{ fontSize: 25, lineHeight: 35, letterSpacing: -1 }}
          >
            🌿 poquito.
          </Label>
          <Label muted style={{ fontSize: 10 }}>
            {busy ? "Guardando…" : "En tu dispositivo ✓"}
          </Label>
        </Row>
        {error && (
          <Panel style={{ backgroundColor: t.palette.peach, gap: 9 }}>
            <Label accessibilityLiveRegion="polite" style={{ fontSize: 12 }}>
              {error}
            </Label>
            <Button title="Entendido" secondary onPress={dismissError} />
          </Panel>
        )}
        <Row>
          <View style={{ flex: 1 }}>
            <Label
              title
              style={{ fontSize: 27, lineHeight: 35, letterSpacing: -1 }}
            >
              {title}
            </Label>
            <Label muted style={{ marginTop: 6, fontSize: 12 }}>
              {subtitle}
            </Label>
          </View>
          {action}
        </Row>
        {children}
        <Label muted style={{ textAlign: "center", fontSize: 10 }}>
          ✦ No es una carrera. Es tu camino.
        </Label>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Loading({
  error,
  retry,
}: {
  error?: string | null;
  retry?: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        gap: 20,
        backgroundColor: "#f7f8f2",
      }}
    >
      <Text style={{ fontSize: 35 }}>🌱</Text>
      <Text style={{ fontSize: 17, color: "#354e3f", textAlign: "center" }}>
        {error ?? "Preparando tu pequeño espacio…"}
      </Text>
      {error ? (
        <Pressable onPress={retry} style={{ padding: 20 }}>
          <Text>Volver a intentar</Text>
        </Pressable>
      ) : (
        <ActivityIndicator color="#354e3f" />
      )}
    </View>
  );
}
export function Plant({ size = 126 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 180 180"
      accessibilityElementsHidden
    >
      <Ellipse cx="95" cy="163" rx="53" ry="7" fill="#d5dac4" />
      <Path
        d="M92 103C89 75 92 48 111 30M92 87C78 68 61 57 49 56M94 64C105 56 119 54 129 53"
        stroke="#485c43"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M107 45C102 26 116 15 136 18c1 19-8 31-29 27Z"
        fill="#8b9f72"
        stroke="#485c43"
        strokeWidth="1.8"
      />
      <Path
        d="M79 76C54 84 34 67 36 47c23-6 40 7 43 29Z"
        fill="#afbc91"
        stroke="#485c43"
        strokeWidth="1.8"
      />
      <Path
        d="M104 63c0-22 21-29 36-17-2 22-19 28-36 17Z"
        fill="#b8c19b"
        stroke="#485c43"
        strokeWidth="1.8"
      />
      <Path
        d="M58 101h69l-8 48c-2 14-50 14-53 0Z"
        fill="#fffdf1"
        stroke="#485c43"
        strokeWidth="2"
      />
      <Path
        d="M55 100c0-4 3-6 7-6h62c4 0 7 2 7 6s-3 7-7 7H62c-4 0-7-3-7-7Z"
        fill="#f4f0db"
        stroke="#485c43"
        strokeWidth="2"
      />
      <Circle cx="82" cy="124" r="2.5" fill="#485c43" />
      <Circle cx="105" cy="124" r="2.5" fill="#485c43" />
      <Path
        d="M88 134q6 7 12 0"
        stroke="#485c43"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <Ellipse cx="74" cy="132" rx="5" ry="3" fill="#e9b9a8" />
      <Ellipse cx="113" cy="132" rx="5" ry="3" fill="#e9b9a8" />
      <Path d="m151 88 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" fill="#d1a479" />
    </Svg>
  );
}
export function NavIcon({ name, color }: { name: string; color: ColorValue }) {
  const paths: Record<string, string> = {
    home: "M3 10 12 3l9 7v10H15v-6H9v6H3Z",
    calendar: "M3 6h18v15H3ZM7 3v5M17 3v5M3 11h18M7 15h1M12 15h1M17 15h1",
    chart: "M4 20V11M12 20V4M20 20v-7",
    target:
      "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0ZM12 11v2",
    settings: "M3 6h18M3 12h18M3 18h18M8 4v4M16 10v4M9 16v4",
  };
  return (
    <Svg width={21} height={21} viewBox="0 0 24 24">
      <Path
        d={paths[name] ?? paths.home}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export const common = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    fontFamily: font.body,
    fontSize: 14,
    minHeight: 48,
  },
  formLabel: {
    marginTop: 18,
    marginBottom: 9,
    fontFamily: font.medium,
    fontSize: 12,
  },
});
