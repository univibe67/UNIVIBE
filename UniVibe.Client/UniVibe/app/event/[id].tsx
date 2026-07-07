import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ImageBackground, 
  TouchableOpacity, 
  ActivityIndicator,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api'; 
import Toast from 'react-native-toast-message';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        const response = await api.get(`/Events/${id}`);
        setEvent(response.data || response);
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: 'Etkinlik detayları yüklenemedi.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEventDetail();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontSize: 16, color: '#6B7280' }}>Etkinlik bulunamadı.</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => router.back()}>
          <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const defaultImage = "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1000&auto=format&fit=crop";
  const imageSource = event.imageUrl ? { uri: event.imageUrl } : { uri: defaultImage };

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        
        <ImageBackground source={imageSource} style={styles.headerImage}>
          <SafeAreaView edges={['top']} style={styles.headerOverlay}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{event.categoryName || 'Kampüs Hayatı'}</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>

        <View style={styles.contentContainer}>
          
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Tarih & Saat</Text>
                <Text style={styles.infoValue}>{formatDisplayDate(event.eventDate)}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { marginTop: 16 }]}>
              <View style={styles.iconContainer}>
                <Ionicons name="location" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.infoLabel}>Konum</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
              </View>
            </View>
          </View>

          <View style={styles.creatorSection}>
            <Text style={styles.sectionTitle}>Düzenleyen</Text>
            <View style={styles.creatorCard}>
              <View style={styles.creatorAvatar}>
                <Ionicons name="person" size={24} color="#9CA3AF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.creatorName}>{event.creatorName || "Bilinmeyen Kullanıcı"}</Text>
                <Text style={styles.creatorRole}>Organizatör</Text>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Etkinlik Hakkında</Text>
            <Text style={styles.descriptionText}>
              {event.description || "Bu etkinlik için henüz bir açıklama girilmemiş."}
            </Text>
          </View>
          
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {!event.isCreator && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.joinButton}>
            <Text style={styles.joinButtonText}>Etkinliğe Katıl</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
function formatDisplayDate(dateString: string) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, Saat: ${hours}:${minutes}`;
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  headerImage: { width: '100%', height: 300, justifyContent: 'flex-start' },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 16, paddingTop: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  categoryBadge: { position: 'absolute', bottom: 20, left: 16, backgroundColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  categoryText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  contentContainer: { flex: 1, backgroundColor: '#F3F4F6', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 20 },
  infoBox: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  infoLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  infoValue: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  creatorSection: { marginBottom: 24 },
  creatorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 16 },
  creatorAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  creatorName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  creatorRole: { fontSize: 14, color: '#6B7280' },
  descriptionSection: { marginBottom: 24 },
  descriptionText: { fontSize: 16, color: '#4B5563', lineHeight: 24 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingBottom: 30 },
  joinButton: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  joinButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
});