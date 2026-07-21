import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Toast, { ToastConfig } from "react-native-toast-message";
import { useAuthStore } from "../store/useAuthStore";

const toastConfig: ToastConfig = {
  success: ({ text1, text2, ...rest }: any) => (
    <BlurView intensity={80} tint="light" style={styles.toastContainer}>
      <View style={[styles.iconContainer, { backgroundColor: "#ECFDF5" }]}>
        <Ionicons name="checkmark-done-circle" size={26} color="#10B981" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{text1}</Text>
        {text2 ? <Text style={styles.subText}>{text2}</Text> : null}
      </View>
    </BlurView>
  ),

  error: ({ text1, text2, ...rest }: any) => (
    <BlurView intensity={80} tint="light" style={styles.toastContainer}>
      <View style={[styles.iconContainer, { backgroundColor: "#FEF2F2" }]}>
        <Ionicons name="alert-circle" size={26} color="#EF4444" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{text1}</Text>
        {text2 ? <Text style={styles.subText}>{text2}</Text> : null}
      </View>
    </BlurView>
  ),
};

export default function RootLayout() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
        }}
      >
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>

      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    marginTop: 10,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: "hidden",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  subText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    fontWeight: "500",
  },
});
