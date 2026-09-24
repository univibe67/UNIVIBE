import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface InfoItem {
  label: string;
  value: string;
}

interface ProfileInfoCardProps {
  title: string;
  items: InfoItem[];
}

export const ProfileInfoCard = ({ title, items }: ProfileInfoCardProps) => {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.infoCard}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <Text style={styles.infoLabel}>{item.label}</Text>
            <Text style={styles.infoValue}>{item.value}</Text>
            {index < items.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#6B7280",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 10,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoLabel: { fontSize: 12, color: "#9CA3AF", marginBottom: 2 },
  infoValue: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
    marginBottom: 10,
  },
  divider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 4 },
});
