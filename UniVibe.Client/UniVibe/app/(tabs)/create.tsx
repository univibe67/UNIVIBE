import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function CreateEventScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Etkinlik Adı</Text>
      <TextInput style={styles.input} placeholder="Örn: Yazılım Kulübü Tanışma" placeholderTextColor="#9CA3AF" />

      <Text style={styles.label}>Açıklama</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Etkinlik detaylarından bahset..." placeholderTextColor="#9CA3AF" multiline numberOfLines={4} />

      <Text style={styles.label}>Konum</Text>
      <TextInput style={styles.input} placeholder="Örn: Mühendislik Fakültesi Amfi 1" placeholderTextColor="#9CA3AF" />

      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Etkinliği Paylaş</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#4B5563', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }
});