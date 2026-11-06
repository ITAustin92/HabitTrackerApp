import { Tabs } from "expo-router";
import { NavIcon } from "../../ui/components";
import { font, useTheme } from "../../ui/theme";

export default function TabLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.paper, borderTopColor: t.line },
        tabBarLabelStyle: { fontSize: 10, fontFamily: font.medium },
        tabBarItemStyle: { paddingVertical: 3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoy",
          tabBarIcon: ({ color }) => <NavIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendario",
          tabBarIcon: ({ color }) => <NavIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: "Progreso",
          tabBarIcon: ({ color }) => <NavIcon name="chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Metas",
          tabBarIcon: ({ color }) => <NavIcon name="target" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => <NavIcon name="settings" color={color} />,
        }}
      />
    </Tabs>
  );
}
