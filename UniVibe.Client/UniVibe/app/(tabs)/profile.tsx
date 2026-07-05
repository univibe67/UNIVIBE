import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { api } from '../../services/api'; // api.ts yolunu kendi projene göre ayarla
import { tokenService } from '../../services/tokenService'; // tokenService yolunu ayarla

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', phoneNumber: '' });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/Users/profile'); 
      setProfile(response.data);
      setEditForm({
        firstName: response.data.firstName || '',
        lastName: response.data.lastName || '',
        phoneNumber: response.data.phoneNumber || ''
      });
    } catch (error) {
      console.log("Profil çekilemedi:", error);
      Alert.alert("Hata", "Profil bilgileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const pickAndUploadImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploading(true);
      const imageUri = result.assets[0].uri;
      
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      formData.append('profileImage', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);

      try {
        const response = await api.post('/Users/upload-profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        const newPhotoUrl = response.data.imageUrl + '?t=' + new Date().getTime();

        setProfile((prev: any) => ({
          ...prev,
          profileImageUrl: newPhotoUrl
        }));

        Alert.alert("Başarılı", "Profil fotoğrafı güncellendi!");
        
      } catch (error) {
        console.log("Fotoğraf yükleme hatası:", error);
        Alert.alert("Hata", "Fotoğraf yüklenemedi.");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.put('/User/update-profile', editForm);
      Alert.alert("Başarılı", "Profil bilgileri güncellendi!");
      setEditModalVisible(false);
      fetchProfile(); 
    } catch (error) {
      console.log("Güncelleme hatası:", error);
      Alert.alert("Hata", "Profil güncellenemedi.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Çıkış", "Emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: async () => {
          await tokenService.clearTokens();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={pickAndUploadImage} disabled={uploading}>
          {uploading ? (
            <View style={styles.avatarCircle}>
              <ActivityIndicator color="#FFF" />
            </View>
          ) : profile?.profileImageUrl ? (
            <Image source={{ uri: profile.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.editIconBadge}>
            <Ionicons name="camera" size={14} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{profile?.firstName} {profile?.lastName}</Text>
        <Text style={styles.userDepartment}>@{profile?.username}</Text> 
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
          <Ionicons name="person-circle-outline" size={24} color="#4B5563" />
          <Text style={styles.menuText}>Profili Düzenle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="calendar-outline" size={24} color="#4B5563" />
          <Text style={styles.menuText}>Katıldığım Etkinlikler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profili Düzenle</Text>
            <ScrollView>
              <Text style={styles.label}>Kullanıcı Adı (Değiştirilemez)</Text>
              <TextInput style={[styles.input, styles.disabledInput]} value={profile?.username} editable={false} />

              <Text style={styles.label}>Bölüm (Değiştirilemez)</Text>
              <TextInput style={[styles.input, styles.disabledInput]} value="Bilgisayar Mühendisliği" editable={false} />

              <Text style={styles.label}>Ad</Text>
              <TextInput style={styles.input} value={editForm.firstName} onChangeText={(text) => setEditForm({...editForm, firstName: text})} />

              <Text style={styles.label}>Soyad</Text>
              <TextInput style={styles.input} value={editForm.lastName} onChangeText={(text) => setEditForm({...editForm, lastName: text})} />

              <Text style={styles.label}>Telefon Numarası</Text>
              <TextInput style={styles.input} value={editForm.phoneNumber} keyboardType="phone-pad" onChangeText={(text) => setEditForm({...editForm, phoneNumber: text})} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#FFFFFF', padding: 30, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative' },
  avatarImage: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  editIconBadge: { position: 'absolute', bottom: 12, right: 0, backgroundColor: '#10B981', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  userDepartment: { fontSize: 15, color: '#6B7280' },
  
  menuContainer: { padding: 16, marginTop: 10 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10 },
  menuText: { fontSize: 16, color: '#4B5563', marginLeft: 12, fontWeight: '500' },
  logoutItem: { marginTop: 20 },
  logoutText: { fontSize: 16, color: '#EF4444', marginLeft: 12, fontWeight: 'bold' },

  // Modal Stilleri
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, color: '#4B5563', marginBottom: 6, fontWeight: '600' },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 16 },
  disabledInput: { backgroundColor: '#E5E7EB', color: '#9CA3AF' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelButton: { flex: 1, backgroundColor: '#F3F4F6', padding: 14, borderRadius: 10, marginRight: 8, alignItems: 'center' },
  cancelButtonText: { color: '#4B5563', fontWeight: 'bold', fontSize: 16 },
  saveButton: { flex: 1, backgroundColor: '#3B82F6', padding: 14, borderRadius: 10, marginLeft: 8, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});