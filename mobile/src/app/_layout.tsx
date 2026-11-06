import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { Manrope_700Bold } from "@expo-google-fonts/manrope/700Bold";
import { Manrope_800ExtraBold } from "@expo-google-fonts/manrope/800ExtraBold";
import { AppProvider, useApp } from "../state/AppProvider";
import { Loading } from "../ui/components";
import { useTheme } from "../ui/theme";
export { ErrorBoundary } from "expo-router";

function Navigation() {
  const { ready, error, retry, dark } = useApp();
  const theme = useTheme();
  if (!ready) return <Loading error={error} retry={retry} />;
  return (
    <>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="new-habit" options={{ presentation: "modal" }} />
        <Stack.Screen name="new-goal" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
export default function RootLayout() {
  const [loaded, error] = useFonts({
    DMSans_400Regular,
    DMSans_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  if (error) throw error;
  if (!loaded) return <Loading />;
  return (
    <AppProvider>
      <Navigation />
    </AppProvider>
  );
}
