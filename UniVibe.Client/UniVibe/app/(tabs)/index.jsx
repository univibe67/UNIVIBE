import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { api } from "../../services/api";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const response = await api.get(
        "/Events/all-events?PageNumber=1&PageSize=50&OnlyActive=true",
      );

      const dataList = response.items || response.data?.items || response || [];
      setEvents(dataList);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: "Etkinlikler yüklenemedi.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const renderEventCard = ({ item }) => {
    const defaultImage =
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop";
    const imageSource = item.imageUrl
      ? { uri: item.imageUrl }
      : { uri: defaultImage };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push(`/event/${item.id}`)}
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
                  {item.categoryName || "Kampüs Hayatı"}
                </Text>
              </View>
              <View style={styles.dateBadge}>
                <Text style={styles.cardDate}>
                  {formatDisplayDate(item.eventDate)}
                </Text>
              </View>
            </View>

            <View style={styles.cardBottom}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.iconText}>
                  <Ionicons name="location" size={16} color="#E5E7EB" />
                  <Text style={styles.footerText} numberOfLines={1}>
                    {item.location}
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
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Yaklaşan Etkinlikler</Text>

        {loading ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : events.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ color: "#6B7280", fontSize: 16 }}>
              Şu an ufukta etkinlik görünmüyor.
            </Text>
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEventCard}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3B82F6"]}
              />
            }
          />
        )}
      </View>
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
function formatDisplayDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
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
    backgroundColor: "#10B981", // Daha dikkat çekici yeşil bir buton
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: { color: "#FFFFFF", fontWeight: "bold" },
});
