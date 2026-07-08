import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, ImageBackground } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../services/api";
import Toast from "react-native-toast-message";

export default function MyEventsScreen() {
  const router = useRouter();

  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [checkingEvent, setCheckingEvent] = useState(true);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);

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
      Alert.alert("Kritik Süre!", "Etkinliğe 4 saatten az kaldığı için iptal işlemi yapılamaz.");
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

  const sortedJoinedEvents = [...joinedEvents].sort(
    (a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  if (checkingEvent) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F3F4F6" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ marginTop: 10, color: "#6B7280" }}>Etkinlik durumun kontrol ediliyor...</Text>
      </SafeAreaView>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop";

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
            <View style={styles.cardContainer}>
              <ImageBackground
                source={activeEvent.imageUrl ? { uri: activeEvent.imageUrl } : { uri: defaultImage }}
                style={[styles.cardBackground, { height: 230 }]} 
                imageStyle={{ borderRadius: 16 }} 
              >
                <View style={styles.cardOverlay}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: '#F59E0B' }]}>
                      <Text style={styles.cardCategory}>
                        Oluşturduğun Etkinlik
                      </Text>
                    </View>
                    <View style={styles.dateBadge}>
                      <Text style={styles.cardDate}>
                        {formatDisplayDate(activeEvent.eventDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {activeEvent.title}
                    </Text>

                    <View style={styles.cardFooter}>
                      <View style={styles.iconText}>
                        <Ionicons name="location" size={16} color="#E5E7EB" />
                        <Text style={styles.footerText} numberOfLines={1}>
                          {activeEvent.location}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                      <TouchableOpacity 
                        style={[styles.joinButton, { flex: 1, backgroundColor: '#3B82F6', alignItems: 'center' }]}
                        onPress={() => router.push({ pathname: "/event/[id]", params: { id: activeEvent.id } })}
                      >
                        <Text style={styles.joinButtonText}>Yönet</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.joinButton, { flex: 1, backgroundColor: '#EF4444', alignItems: 'center' }]}
                        onPress={handleCancelEvent}
                      >
                        <Text style={styles.joinButtonText}>İptal Et</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.createBox} 
            onPress={() => router.push('/create-event')} 
          >
            <Ionicons name="add-circle-outline" size={48} color="#999" />
            <Text style={styles.createText}>Oluştur</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.headerTitle}>Yaklaşan Etkinliklerim</Text>
        
        {sortedJoinedEvents.length > 0 ? (
          sortedJoinedEvents.map((event: any) => {
            const imageSource = event.imageUrl
              ? { uri: event.imageUrl }
              : { uri: defaultImage };

            return (
              <TouchableOpacity
                key={event.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/event/${event.id}`)}
                style={styles.cardContainer}
              >
                <ImageBackground
                  source={imageSource}
                  style={styles.cardBackground}
                  imageStyle={{ borderRadius: 16 }} 
                >
                  <View style={styles.cardOverlay}>
                    <View style={styles.cardHeader}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.cardCategory}>
                          {event.categoryName || "Kampüs Hayatı"}
                        </Text>
                      </View>
                      <View style={styles.dateBadge}>
                        <Text style={styles.cardDate}>
                          {formatDisplayDate(event.eventDate)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardBottom}>
                      <Text style={styles.cardTitle} numberOfLines={2}>
                        {event.title}
                      </Text>

                      <View style={styles.cardFooter}>
                        <View style={styles.iconText}>
                          <Ionicons name="location" size={16} color="#E5E7EB" />
                          <Text style={styles.footerText} numberOfLines={1}>
                            {event.location}
                          </Text>
                        </View>
                        <View style={styles.joinButton}>
                          <Text style={styles.joinButtonText}>İncelemek İçin Tıklayınız</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyJoinedBox}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyJoinedText}>Henüz hiçbir etkinliğe başvurmadınız.</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
function formatDisplayDate(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
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
    borderColor: '#D1D5DB', 
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  createText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  emptyJoinedBox: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    marginBottom: 20,
  },
  emptyJoinedText: {
    marginTop: 12,
    fontSize: 15,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  cardContainer: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cardBackground: {
    width: "100%",
    height: 200,
    justifyContent: "flex-end",
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  categoryBadge: {
    backgroundColor: "rgba(59,130,246,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardCategory: { color: "#FFFFFF", fontWeight: "bold", fontSize: 12 },
  dateBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cardDate: { color: "#FFFFFF", fontWeight: "bold", fontSize: 12 },
  cardBottom: {
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  iconText: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  footerText: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 10,
  },
  joinButton: {
    backgroundColor: "#10B981", 
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: { color: "#FFFFFF", fontWeight: "bold" },
});