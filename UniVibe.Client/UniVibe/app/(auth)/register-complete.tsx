import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/useAuthStore";

const GRADES = [
  { id: 0, name: "Hazırlık" },
  { id: 1, name: "1. Sınıf" },
  { id: 2, name: "2. Sınıf" },
  { id: 3, name: "3. Sınıf" },
  { id: 4, name: "4. Sınıf" },
  { id: 5, name: "5. Sınıf" },
  { id: 6, name: "6. Sınıf" },
  { id: 7, name: "Mezun" },
];

export default function RegisterCompleteScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const loginAction = useAuthStore((state) => state.login);

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [selectedUni, setSelectedUni] = useState<any>(null);
  const [selectedFac, setSelectedFac] = useState<any>(null);
  const [selectedDep, setSelectedDep] = useState<any>(null);

  const [selectedGrade, setSelectedGrade] = useState<any>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<
    "grade" | "uni" | "fac" | "dep" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await api.get(`/Auth/verify-token?token=${token}`);
        const res = await api.get("/University");
        setUniversities(res);
      } catch {
        Alert.alert("Hata", "Token geçersiz.");
        router.replace("/(auth)/register");
      }
    };
    init();
  }, [token]);

  useEffect(() => {
    if (selectedUni) {
      api
        .get(`/University/${selectedUni.id}/faculties`)
        .then((res: any) => setFaculties(res));
    }
  }, [selectedUni]);

  useEffect(() => {
    if (selectedFac) {
      api
        .get(`/University/faculties/${selectedFac.id}/departments`)
        .then((res: any) => setDepartments(res));
    }
  }, [selectedFac]);

  const handleCompleteRegistration = async () => {
    if (!username || !selectedDep || !phoneNumber || selectedGrade === null) {
      Alert.alert("Eksik", "Lütfen tüm alanları doldurun.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/Auth/complete-registration", {
        token,
        username,
        password,
        firstName,
        lastName,
        phoneNumber: phoneNumber.trim(),
        departmentId: selectedDep.id,
        grade: selectedGrade.id,
      });
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("Hata", "Kayıt tamamlanamadı.");
    }
    setIsSubmitting(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Kaydı Tamamla</Text>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Ad"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Soyad"
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={styles.input}
              placeholder="Kullanıcı Adı"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Telefon Numarası"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.sectionTitle}>Eğitim Bilgileri</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setModalType("uni");
                setModalVisible(true);
              }}
            >
              <Text style={styles.dropdownText}>
                {selectedUni ? selectedUni.name : "Üniversite Seç"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdown, !selectedUni && { opacity: 0.5 }]}
              onPress={() =>
                selectedUni && (setModalType("fac"), setModalVisible(true))
              }
            >
              <Text style={styles.dropdownText}>
                {selectedFac ? selectedFac.name : "Fakülte Seç"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdown, !selectedFac && { opacity: 0.5 }]}
              onPress={() =>
                selectedFac && (setModalType("dep"), setModalVisible(true))
              }
            >
              <Text style={styles.dropdownText}>
                {selectedDep ? selectedDep.name : "Bölüm Seç"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => {
                setModalType("grade");
                setModalVisible(true);
              }}
            >
              <Text style={styles.dropdownText}>
                {selectedGrade ? selectedGrade.name : "Sınıf Seç"}
              </Text>
              <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCompleteRegistration}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Kaydı Tamamla</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seçim Yap</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={
                modalType === "grade"
                  ? GRADES
                  : modalType === "uni"
                    ? universities
                    : modalType === "fac"
                      ? faculties
                      : departments
              }
              keyExtractor={(item, index) =>
                item.id?.toString() || index.toString()
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    if (modalType === "grade") {
                      setSelectedGrade(item);
                    } else if (modalType === "uni") {
                      setSelectedUni(item);
                      setSelectedFac(null);
                      setSelectedDep(null);
                    } else if (modalType === "fac") {
                      setSelectedFac(item);
                      setSelectedDep(null);
                    } else setSelectedDep(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.itemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { flex: 1 },
  scrollContent: { padding: 20 },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#374151",
  },
  input: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  dropdown: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: 15, color: "#374151" },
  submitButton: {
    backgroundColor: "#3B82F6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  submitText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    height: "50%",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  item: { paddingVertical: 15, borderBottomWidth: 1, borderColor: "#F3F4F6" },
  itemText: { fontSize: 16, color: "#1F2937" },
});
