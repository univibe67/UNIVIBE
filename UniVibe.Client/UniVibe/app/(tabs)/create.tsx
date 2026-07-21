import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { EventCard } from "../../components/EventCard";
import { api } from "../../services/api";

export default function MyEventsScreen() {
  const router = useRouter();

  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [checkingEvent, setCheckingEvent] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchMyData = async () => {
        setCheckingEvent(true);
        try {
          const activeResponse: any = await api.get("/Events/my-active-event");
          if (activeResponse && activeResponse.id) {
            setActiveEvent(activeResponse);
          } else {
            setActiveEvent(null);
          }

          const joinedResponse: any = await api.get("/Events/my-joined-events");
          if (Array.isArray(joinedResponse)) {
            setJoinedEvents(joinedResponse);
          } else {
            setJoinedEvents([]);
          }
        } catch (error) {
          console.log("Veri çekme hatası", error);
          setActiveEvent(null);
          setJoinedEvents([]);
        } finally {
          setCheckingEvent(false);
        }
      };

      fetchMyData();
    }, []),
  );

  const handleCancelEvent = () => {
    if (!activeEvent) return;

    const eventDateObj = new Date(activeEvent.eventDate);
    const now = new Date();

    const timeDiffMs = eventDateObj.getTime() - now.getTime();
    const hoursLeft = timeDiffMs / (1000 * 60 * 60);

    if (hoursLeft < 0) {
      Alert.alert("Uyarı", "Başlamış veya geçmiş bir etkinlik iptal edilemez.");
      return;
    }

    if (hoursLeft < 4) {
      Alert.alert(
        "Kritik Süre!",
        "Etkinliğe 4 saatten az kaldığı için iptal işlemi yapılamaz.",
      );
      return;
    }

    Alert.alert(
      "Etkinliği İptal Et",
      "Bu etkinliği iptal etmek istediğine emin misin? Bu işlem geri alınamaz.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Evet, İptal Et",
          style: "destructive",
          onPress: async () => {
            setCheckingEvent(true);
            try {
              await api.delete(`/Events/delete-event/${activeEvent.id}`);

              Toast.show({
                type: "success",
                text1: "İptal Edildi",
                text2: "Etkinliğin başarıyla yayından kaldırıldı.",
              });

              setActiveEvent(null);
            } catch (error: any) {
              const msg =
                typeof error === "string" ? error : "Etkinlik iptal edilemedi.";
              Alert.alert("Hata", msg);
            } finally {
              setCheckingEvent(false);
            }
          },
        },
      ],
    );
  };

  const sortedJoinedEvents = [...joinedEvents].sort(
    (a: any, b: any) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
  );

  if (checkingEvent) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F3F4F6",
        }}
      >
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: "#6B7280" }}>
          Etkinlik durumun kontrol ediliyor...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {activeEvent ? (
          <Text style={styles.headerTitle}>Aktif Etkinliğim</Text>
        ) : (
          <Text style={styles.headerTitle}>Etkinliklerim</Text>
        )}

        {activeEvent ? (
          <View style={{ marginBottom: 24 }}>
            <EventCard
              event={activeEvent}
              cardHeight={230}
              categoryText="Oluşturduğun Etkinlik"
              categoryBadgeStyle={{ backgroundColor: "#F59E0B" }}
              onPress={() =>
                router.push({
                  pathname: "/event/[id]",
                  params: { id: activeEvent.id },
                })
              }
            >
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#3B82F6" }]}
                  onPress={() =>
                    router.push({
                      pathname: "/event/[id]",
                      params: { id: activeEvent.id },
                    })
                  }
                >
                  <Text style={styles.actionButtonText}>Yönet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#EF4444" }]}
                  onPress={handleCancelEvent}
                >
                  <Text style={styles.actionButtonText}>İptal Et</Text>
                </TouchableOpacity>
              </View>
            </EventCard>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.createBox}
            onPress={() => router.push("../event/create-event")}
          >
            <Ionicons name="add-circle-outline" size={48} color="#999" />
            <Text style={styles.createText}>Oluştur</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.headerTitle}>Yaklaşan Etkinliklerim</Text>

        {sortedJoinedEvents.length > 0 ? (
          sortedJoinedEvents.map((event: any) => (
            <EventCard
              key={event.id}
              event={event}
              categoryText={event.categoryName || "Kampüs Hayatı"}
              onPress={() => router.push(`/event/${event.id}`)}
            />
          ))
        ) : (
          <View style={styles.emptyJoinedBox}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyJoinedText}>
              Henüz hiçbir etkinliğe başvurmadınız.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
    marginTop: 10,
  },
  createBox: {
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
  },
  createText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  emptyJoinedBox: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    borderRadius: 16,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    marginBottom: 20,
  },
  emptyJoinedText: {
    marginTop: 12,
    fontSize: 15,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },
});
