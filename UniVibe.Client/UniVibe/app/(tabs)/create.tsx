import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";
import { eventService, EventCategoryDto } from "../../services/eventService";
import Toast from "react-native-toast-message";

export default function CreateEventScreen() {
  const router = useRouter();

  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [checkingEvent, setCheckingEvent] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [categories, setCategories] = useState<EventCategoryDto[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    eventService
      .getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      const checkMyEvent = async () => {
        setCheckingEvent(true);
        try {
          const response = await api.get("/Events/my-active-event");
          
          const eventData = response.data?.data || response.data || response;

          if (eventData && eventData.id) {
            setActiveEvent(eventData);
          } else {
            setActiveEvent(null);
          }
          
        } catch (error) {
          console.log("Kontrol hatası", error);
          setActiveEvent(null);
        } finally {
          setCheckingEvent(false);
        }
      };

      checkMyEvent();
    }, [])
  );

  // 🚨 İŞTE EKSİK OLAN VE SENİN İÇİN EKLENEN İPTAL ETME FONKSİYONU
  const handleCancelEvent = () => {
    if (!activeEvent) return;

    const eventDateObj = new Date(activeEvent.eventDate);
    const now = new Date();
    
    // Saat farkını hesaplıyoruz
    const timeDiffMs = eventDateObj.getTime() - now.getTime();
    const hoursLeft = timeDiffMs / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      Alert.alert("Uyarı", "Başlamış veya geçmiş bir etkinlik iptal edilemez.");
      return;
    }

    if (hoursLeft < 4) {
      Alert.alert("Kritik Süre!", "Etkinliğe 4 saatten az kaldığı için iptal işlemi yapılamaz.");
      return;
    }

    // Onay Penceresi
    Alert.alert(
      "Etkinliği İptal Et",
      "Bu etkinliği iptal etmek istediğine emin misin? Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Evet, İptal Et",
          style: "destructive", // iOS'ta kırmızı buton yapar
          onPress: async () => {
            setCheckingEvent(true);
            try {
              await api.delete(`/Events/delete-event/${activeEvent.id}`);
              
              Toast.show({
                type: "success",
                text1: "İptal Edildi",
                text2: "Etkinliğin başarıyla yayından kaldırıldı.",
              });
              
              // İptal başarılı olunca sayfayı yeni etkinlik oluşturulacak şekilde sıfırla
              setActiveEvent(null); 
            } catch (error: any) {
              const msg = typeof error === "string" ? error : "Etkinlik iptal edilemedi.";
              Alert.alert("Hata", msg);
            } finally {
              setCheckingEvent(false);
            }
          },
        },
      ]
    );
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], 
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setEventDate(null);
    setCategoryId(null);
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !eventDate || !categoryId) {
      Toast.show({
        type: "error",
        text1: "Eksik Bilgi",
        text2: "Etkinlik adı, tarih, kategori ve konum zorunludur.",
      });
      return;
    }

    if (eventDate <= new Date()) {
      Toast.show({
        type: "error",
        text1: "Geçersiz Tarih",
        text2: "Etkinlik tarihi gelecekte olmalıdır.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("Title", title.trim());
      formData.append("Description", description.trim());
      formData.append("EventDate", eventDate.toISOString());
      formData.append("Location", location.trim());
      formData.append("CategoryId", categoryId);

      if (imageUri) {
        const filename = imageUri.split("/").pop() || "event_image.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1] : "jpeg";

        formData.append("ImageFile", {
          uri: imageUri,
          name: filename,
          type: `image/${ext}`,
        } as any);
      }

      await api.post("/Events/create-event", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Toast.show({
        type: "success",
        text1: "Başarılı",
        text2: "Etkinlik başarıyla paylaşıldı!",
      });

      resetForm();
      router.push("/(tabs)");
    } catch (error: any) {
      const msg =
        typeof error === "string"
          ? error
          : "Etkinlik oluşturulamadı. Lütfen tekrar dene.";
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: msg,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingEvent) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3F4F6" }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 10, color: "#6B7280" }}>Etkinlik durumun kontrol ediliyor...</Text>
      </SafeAreaView>
    );
  }

  if (activeEvent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
        <View style={styles.container}>
          <Text style={[styles.headerTitle, { color: "#10B981", marginBottom: 20 }]}>
            Aktif Bir Etkinliğin Var!
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{activeEvent.title}</Text>
            <Text style={{ color: "#6B7280", marginTop: 8 }}>
              Tarih: {formatDate(new Date(activeEvent.eventDate))}
            </Text>
            <Text style={{ color: "#6B7280", marginTop: 4 }}>
              Konum: {activeEvent.location}
            </Text>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: "#3B82F6", marginTop: 20 }]}
              onPress={() => router.push({ pathname: "/event/[id]", params: { id: activeEvent.id } })}
            >
              <Text style={styles.submitButtonText}>Etkinliğini Yönet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: "#EF4444", marginTop: 12 }]}
              onPress={handleCancelEvent}
            >
              <Text style={styles.submitButtonText}>Etkinliği İptal Et</Text>
            </TouchableOpacity>

          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Etkinlik Adı</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Yazılım Kulübü Tanışma"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Etkinlik detaylarından bahset..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Konum</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: Mühendislik Fakültesi Amfi 1"
            placeholderTextColor="#9CA3AF"
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Tarih ve Saat</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={eventDate ? styles.dateText : styles.datePlaceholder}>
              {eventDate ? formatDate(eventDate) : "Tarih seç"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={eventDate ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              display="default"
              onValueChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  setEventDate(date);
                  setShowTimePicker(true);
                }
              }}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={eventDate ?? new Date()}
              mode="time"
              display="default"
              onValueChange={(event, time) => {
                setShowTimePicker(false);
                if (time && eventDate) {
                  const merged = new Date(eventDate);
                  merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
                  setEventDate(merged);
                }
              }}
              onDismiss={() => setShowTimePicker(false)}
            />
          )}

          <Text style={styles.label}>Kategori</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={styles.selectRow}>
              <View style={styles.selectValue}>
                {selectedCategory && (
                  <View
                    style={[
                      styles.categoryDot,
                      { backgroundColor: selectedCategory.color || "#3B82F6" },
                    ]}
                  />
                )}
                <Text
                  style={
                    selectedCategory ? styles.dateText : styles.datePlaceholder
                  }
                >
                  {selectedCategory ? selectedCategory.name : "Kategori seç"}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={18} color="#6B7280" />
            </View>
          </TouchableOpacity>

          <Text style={styles.label}>Etkinlik Görseli (isteğe bağlı)</Text>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={pickImage}
            >
              <Ionicons name="image-outline" size={28} color="#6B7280" />
              <Text style={styles.imagePickerText}>Galeriden görsel seç</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.submitButton, submitting && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Etkinliği Paylaş</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />

          <Modal
            visible={showCategoryModal}
            animationType="slide"
            transparent={true}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Kategori Seç</Text>
                <FlatList
                  data={categories}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.categoryRow}
                      onPress={() => {
                        setCategoryId(item.id);
                        setShowCategoryModal(false);
                      }}
                    >
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: item.color || "#3B82F6" },
                        ]}
                      />
                      <Text style={styles.categoryRowText}>{item.name}</Text>
                      {categoryId === item.id && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCategoryModal(false)}
                >
                  <Text style={styles.modalCloseText}>Vazgeç</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function formatDate(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} • ${hours}:${minutes}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F4F6" },
  keyboardView: { flex: 1 },
  container: { flex: 1, padding: 16 },
  
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4B5563",
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: "top" },
  dateText: { fontSize: 16, color: "#1F2937" },
  datePlaceholder: { fontSize: 16, color: "#9CA3AF" },
  selectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectValue: { flexDirection: "row", alignItems: "center" },
  categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  categoryRowText: { flex: 1, fontSize: 16, color: "#1F2937" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  modalCloseButton: {
    backgroundColor: "#F3F4F6",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  modalCloseText: { color: "#4B5563", fontWeight: "bold", fontSize: 16 },
  imagePickerButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  imagePickerText: { color: "#6B7280", marginTop: 6, fontSize: 14 },
  imagePreviewContainer: { position: "relative", marginBottom: 16 },
  imagePreview: { width: "100%", height: 180, borderRadius: 12 },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#10B981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});