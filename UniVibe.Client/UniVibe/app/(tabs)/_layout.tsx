import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2c57e6",
        tabBarInactiveTintColor: "#999999",
        headerStyle: { backgroundColor: "#bebcbc" },
        headerTitleStyle: { fontWeight: "bold", color: "#1F2937" },
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "AnaSayfa",
          tabBarLabel: "Ana Sayfa",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={26} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Etkinlikler",
          tabBarLabel: "Etkinlikler",
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profilim",
          tabBarLabel: "Profil",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
