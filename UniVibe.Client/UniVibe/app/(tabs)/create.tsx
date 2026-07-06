import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { eventService, EventCategoryDto } from '../../services/eventService';

export default function CreateEventScreen() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [categories, setCategories] = useState<EventCategoryDto[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  useEffect(() => {
    eventService.getCategories().then(setCategories).catch(() => {});
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setEventDate(null);
    setCategoryId(null);
    setImageUri(null);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !eventDate || !categoryId) {
      Alert.alert('Eksik Bilgi', 'Etkinlik adı, tarih, kategori ve konum zorunludur.');
      return;
    }
    if (eventDate <= new Date()) {
      Alert.alert('Geçersiz Tarih', 'Etkinlik tarihi gelecekte olmalıdır.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('Title', title.trim());
      formData.append('Description', description.trim());
      formData.append('EventDate', eventDate.toISOString());
      formData.append('Location', location.trim());
      formData.append('CategoryId', categoryId);

      if (imageUri) {
        const filename = imageUri.split('/').pop() ?? 'event.jpg';
        const ext = /\.(\w+)$/.exec(filename)?.[1];
        formData.append('ImageFile', {
          uri: imageUri,
          name: filename,
          type: ext ? `image/${ext}` : 'image',
        } as any);
      }

      await api.post('/Events/create-event', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Başarılı', 'Etkinliğin paylaşıldı!');
      resetForm();
      router.push('/(tabs)');
    } catch (error: any) {
      // api.ts'deki interceptor hataları string olarak fırlatıyor
      const msg = typeof error === 'string' ? error : 'Etkinlik oluşturulamadı. Tekrar dene.';
      Alert.alert('Hata', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Etkinlik Adı</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Yazılım Kulübü Tanışma"
        placeholderTextColor="#9CA3AF"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Açıklama</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Etkinlik detaylarından bahset..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={4}
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Konum</Text>
      <TextInput
        style={styles.input}
        placeholder="Örn: Mühendislik Fakültesi Amfi 1"
        placeholderTextColor="#9CA3AF"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Tarih ve Saat</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
        <Text style={eventDate ? styles.dateText : styles.datePlaceholder}>
          {eventDate ? formatDate(eventDate) : 'Tarih seç'}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={eventDate ?? new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={(e, date) => {
            setShowDatePicker(false);
            if (date) {
              setEventDate(date);
              setShowTimePicker(true);
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={eventDate ?? new Date()}
          mode="time"
          onChange={(e, time) => {
            setShowTimePicker(false);
            if (time && eventDate) {
              const merged = new Date(eventDate);
              merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
              setEventDate(merged);
            }
          }}
        />
      )}

      <Text style={styles.label}>Kategori</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowCategoryModal(true)}>
        <View style={styles.selectRow}>
          <View style={styles.selectValue}>
            {selectedCategory && (
              <View style={[styles.categoryDot, { backgroundColor: selectedCategory.color || '#3B82F6' }]} />
            )}
            <Text style={selectedCategory ? styles.dateText : styles.datePlaceholder}>
              {selectedCategory ? selectedCategory.name : 'Kategori seç'}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </View>
      </TouchableOpacity>

      <Text style={styles.label}>Etkinlik Görseli (isteğe bağlı)</Text>
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
            <Ionicons name="close" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <Ionicons name="image-outline" size={28} color="#6B7280" />
          <Text style={styles.imagePickerText}>Galeriden görsel seç</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.submitButton, submitting && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Etkinliği Paylaş</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategori Seç</Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryRow}
                  onPress={() => {
                    setCategoryId(item.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <View style={[styles.categoryDot, { backgroundColor: item.color || '#3B82F6' }]} />
                  <Text style={styles.categoryRowText}>{item.name}</Text>
                  {categoryId === item.id && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCloseText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

function formatDate(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} • ${hours}:${minutes}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#4B5563', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  dateText: { fontSize: 16, color: '#1F2937' },
  datePlaceholder: { fontSize: 16, color: '#9CA3AF' },
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectValue: { flexDirection: 'row', alignItems: 'center' },
  categoryDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  categoryRowText: { flex: 1, fontSize: 16, color: '#1F2937' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '60%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 16 },
  modalCloseButton: { backgroundColor: '#F3F4F6', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalCloseText: { color: '#4B5563', fontWeight: 'bold', fontSize: 16 },
  imagePickerButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16 },
  imagePickerText: { color: '#6B7280', marginTop: 6, fontSize: 14 },
  imagePreviewContainer: { position: 'relative', marginBottom: 16 },
  imagePreview: { width: '100%', height: 180, borderRadius: 12 },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  submitButton: { backgroundColor: '#10B981', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});