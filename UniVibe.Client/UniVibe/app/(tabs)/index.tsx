import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { EventCard } from "../../components/EventCard";
import { api } from "../../services/api";

export default function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEvents = async () => {
    try {
      const response: any = await api.get("/Events/all-events", {
        params: {
          pageNumber: 1,
          pageSize: 50,
          onlyActive: true,
        },
      });

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

  const renderEventCard = ({ item }: { item: any }) => {
    return (
      <EventCard
        event={item}
        categoryText={item.categoryName || "Kampüs Hayatı"}
        onPress={() => router.push(`/event/${item.id}`)}
      />
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
            keyExtractor={(item: any) => item.id.toString()}
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

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 16,
  },
});
