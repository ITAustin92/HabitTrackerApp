import { useApp } from "../state/AppProvider";
export const lightPalette = {
  mint: "#e0eddd",
  lavender: "#e5e0f8",
  peach: "#f7e1cd",
  blue: "#dce9f5",
  pink: "#f4dee6",
  yellow: "#f0efb7",
};
const darkPalette = {
  mint: "#374d3a",
  lavender: "#49425c",
  peach: "#5b4536",
  blue: "#344b5b",
  pink: "#583e49",
  yellow: "#555431",
};
const accents = {
  mint: "#354e3f",
  lavender: "#685783",
  peach: "#82614b",
  blue: "#48677e",
  pink: "#82596b",
  yellow: "#6c702e",
};
const darkAccents = {
  mint: "#b6cba2",
  lavender: "#d1c4ea",
  peach: "#e7c2a2",
  blue: "#b1cee3",
  pink: "#e8bbce",
  yellow: "#dcdf9a",
};
export function useTheme() {
  const { dark, snapshot } = useApp();
  return {
    dark,
    bg: dark ? "#1e2822" : "#f7f8f2",
    paper: dark ? "#26322a" : "#fffefa",
    ink: dark ? "#eef1e7" : "#303c35",
    muted: dark ? "#aeb9a9" : "#707b70",
    line: dark ? "#3d493d" : "#e4e8dc",
    hero: dark ? "#34432f" : "#e8ebdb",
    accent: (dark ? darkAccents : accents)[snapshot.preferences.accent],
    onAccent: dark ? "#202a22" : "#fffefa",
    palette: dark ? darkPalette : lightPalette,
  };
}
export const font = {
  body: "DMSans_400Regular",
  medium: "DMSans_600SemiBold",
  title: "Manrope_700Bold",
  heavy: "Manrope_800ExtraBold",
};
