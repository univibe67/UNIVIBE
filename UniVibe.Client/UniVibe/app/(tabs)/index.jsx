import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { authService } from "../../services/authService";

export default function HomeScreen() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert("Hata", "Lütfen e-posta adresini girin.");
      return;
    }
    if (isLogin && !password.trim()) {
      Alert.alert("Hata", "Lütfen parolanızı girin.");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await authService.login(email, password);
      } else {
        await authService.registerInit(email);
      }
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Hata", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>UniVibe</Text>
        <Text style={styles.subtitle}>
          {isLogin ? "Hesabına giriş yap" : "Yeni hesap oluştur"}
        </Text>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
            onPress={() => setMode("login")}
          >
            <Text
              style={[styles.toggleText, isLogin && styles.toggleTextActive]}
            >
              Giriş Yap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
            onPress={() => setMode("signup")}
          >
            <Text
              style={[styles.toggleText, !isLogin && styles.toggleTextActive]}
            >
              Kayıt Ol
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#8e8e93"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        {isLogin ? (
          <TextInput
            style={styles.input}
            placeholder="Parola"
            placeholderTextColor="#8e8e93"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        ) : null}

        <TouchableOpacity
          style={[styles.primaryButton, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading
              ? "Lütfen bekleyin..."
              : isLogin
                ? "Giriş Yap"
                : "Kayıt Ol"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fb",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    padding: 4,
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 999,
  },
  toggleButtonActive: {
    backgroundColor: "#2563eb",
  },
  toggleText: {
    color: "#4b5563",
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#ffffff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: "#111827",
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
