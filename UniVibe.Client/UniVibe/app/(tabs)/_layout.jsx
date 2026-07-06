import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2c57e6', 
        tabBarInactiveTintColor: '#f00f0f', 
        headerStyle: { backgroundColor: '#bebcbc' },
        headerTitleStyle: { fontWeight: 'bold', color: '#1F2937' },
        tabBarStyle: { paddingBottom: 5, height: 60 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Etkinlikler',
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={26} color={color} />,
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: 'Yeni Etkinlik',
          tabBarLabel: 'Oluştur',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={28} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilim',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={26} color={color} />,
        }}
      />
    </Tabs>
  );
}