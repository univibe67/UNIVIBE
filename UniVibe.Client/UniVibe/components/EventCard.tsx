import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ImageBackground,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface EventCardProps {
  event: any;
  onPress: () => void;
  categoryBadgeStyle?: any;
  categoryText: string;
  cardHeight?: number;
  children?: React.ReactNode;
}

export const EventCard = ({
  event,
  onPress,
  categoryBadgeStyle,
  categoryText,
  cardHeight = 200,
  children,
}: EventCardProps) => {
  const defaultImage =
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop";
  const imageSource = event.imageUrl
    ? { uri: event.imageUrl }
    : { uri: defaultImage };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.cardContainer}
    >
      <ImageBackground
        source={imageSource}
        style={[styles.cardBackground, { height: cardHeight }]}
        imageStyle={{ borderRadius: 16 }}
      >
        <View style={styles.cardOverlay}>
          <View style={styles.cardHeader}>
            <View style={[styles.categoryBadge, categoryBadgeStyle]}>
              <Text style={styles.cardCategory}>{categoryText}</Text>
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
              {!children && (
                <View style={styles.joinButton}>
                  <Text style={styles.joinButtonText}>İncele</Text>
                </View>
              )}
            </View>

            {children}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

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

function formatDisplayDate(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const styles = StyleSheet.create({
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
