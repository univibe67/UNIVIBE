import { Stack } from 'expo-router';

export default function AuthLayout() {
  // İçine hiçbir Stack.Screen YAZMIYORUZ, Expo otomatik bulur!
  return <Stack screenOptions={{ headerShown: false }} />;
}