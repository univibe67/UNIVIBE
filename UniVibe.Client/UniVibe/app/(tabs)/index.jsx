import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      
      <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Yaklaşan Etkinlikler</Text>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardCategory}>Kampüs Hayatı</Text>
            <Text style={styles.cardDate}>15 Temmuz</Text>
          </View>
          <Text style={styles.cardTitle}>Bahar Şenliği Konseri</Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.iconText}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.footerText}>Ana Kampüs Meydanı</Text>
            </View>
            <TouchableOpacity style={styles.joinButton}>
              <Text style={styles.joinButtonText}>Katıl</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 }, 
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardCategory: { color: '#3B82F6', fontWeight: 'bold', fontSize: 12 },
  cardDate: { color: '#EF4444', fontWeight: 'bold', fontSize: 12 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconText: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { color: '#6B7280', fontSize: 14 },
  joinButton: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  joinButtonText: { color: '#FFFFFF', fontWeight: 'bold' }
});