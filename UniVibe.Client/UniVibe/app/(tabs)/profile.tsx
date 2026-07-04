import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>MD</Text>
        </View>
        <Text style={styles.userName}>Mehmet Metin Delibaş</Text>
        <Text style={styles.userDepartment}>Bilgisayar Mühendisliği</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="calendar-outline" size={24} color="#4B5563" />
          <Text style={styles.menuText}>Katıldığım Etkinlikler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={24} color="#4B5563" />
          <Text style={styles.menuText}>Ayarlar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#FFFFFF', padding: 30, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  userDepartment: { fontSize: 14, color: '#6B7280' },
  menuContainer: { padding: 16, marginTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10 },
  menuText: { fontSize: 16, color: '#4B5563', marginLeft: 12, fontWeight: '500' },
  logoutItem: { marginTop: 20 },
  logoutText: { fontSize: 16, color: '#EF4444', marginLeft: 12, fontWeight: 'bold' }
});