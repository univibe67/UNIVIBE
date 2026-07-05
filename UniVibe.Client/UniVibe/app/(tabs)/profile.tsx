import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { api } from '../../services/api'; 
import { tokenService } from '../../services/tokenService'; 

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modal Kontrolü
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  
  // Form State'i (Sadece düzenlenebilir alanlar için)
  const [editForm, setEditForm] = useState({ 
    bio: '', 
    socialMediaLink: '' 
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/Users/profile'); 
      setProfile(response.data);
      
      setEditForm({
        bio: response.data.bio || '',
        socialMediaLink: response.data.socialMediaLink || ''
      });
    } catch (error) {
      console.log("Profil yükleme hatası:", error);
      Alert.alert("Hata", "Profil bilgileri sunucudan alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 2. PROFİL FOTOĞRAFI YÜKLEME
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
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        const newPhotoUrl = response.data.imageUrl + '?t=' + new Date().getTime();

        setProfile((prev: any) => ({
          ...prev,
          profilePictureUrl: newPhotoUrl
        }));

        Alert.alert("Başarılı", "Profil fotoğrafı başarıyla güncellendi!");
      } catch (error) {
        console.log("Fotoğraf yükleme hatası:", error);
        Alert.alert("Hata", "Fotoğraf sunucuya yüklenemedi.");
      } finally {
        setUploading(false);
      }
    }
  };

  // 3. PROFİL BİLGİLERİNİ GÜNCELLE (PUT)
  const handleUpdateProfile = async () => {
    try {
      // Backend'deki UpdateUserProfileDto modeline sadece bio ve sosyal medya gidiyor
      // Eğer backend isim/soyisim de bekliyorsa, onları da profile state'inden ekleyebilirsin kanka
      await api.put('/Users/update-profile', {
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        bio: editForm.bio,
        socialMediaLink: editForm.socialMediaLink
      });
      
      Alert.alert("Başarılı", "Profil bilgileriniz başarıyla güncellendi!");
      setEditModalVisible(false); 
      fetchProfile(); // Ekrandaki verileri tazele
    } catch (error) {
      console.log("Profil güncelleme hatası:", error);
      Alert.alert("Hata", "Değişiklikler kaydedilemedi.");
    }
  };

  // 4. ÇIKIŞ YAPMA
  const handleLogout = async () => {
    Alert.alert("Çıkış Yap", "Oturumu kapatmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış", style: "destructive", onPress: async () => {
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
    <ScrollView style={styles.container}>
      {/* ÜST PROFİL KARTI */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickAndUploadImage} disabled={uploading} style={styles.avatarContainer}>
          {uploading ? (
            <View style={styles.avatarCircle}>
              <ActivityIndicator color="#FFF" />
            </View>
          ) : profile?.profilePictureUrl ? (
            <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatarImage} />
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
        <Text style={styles.userTag}>@{profile?.username}</Text>
        <Text style={styles.userSubText}>{profile?.universityName}</Text>
      </View>

      {/* DETAYLI BİLGİ LİSTESİ */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Akademik Bilgiler</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Üniversite</Text>
          <Text style={styles.infoValue}>{profile?.universityName}</Text>
          <View style={styles.divider} />
          <Text style={styles.infoLabel}>Fakülte</Text>
          <Text style={styles.infoValue}>{profile?.facultyName}</Text>
          <View style={styles.divider} />
          <Text style={styles.infoLabel}>Bölüm</Text>
          <Text style={styles.infoValue}>{profile?.departmentName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Hakkımda & İletişim</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>E-posta</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
          <View style={styles.divider} />
          <Text style={styles.infoLabel}>Biyografi</Text>
          <Text style={styles.infoValue}>{profile?.bio || "Henüz bir biyografi eklenmemiş."}</Text>
          <View style={styles.divider} />
          <Text style={styles.infoLabel}>Sosyal Medya</Text>
          <Text style={styles.infoValue}>{profile?.socialMediaLink || "Bağlantı eklenmemiş."}</Text>
        </View>
      </View>

      {/* BUTONLAR */}
      <View style={styles.btnContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
          <Text style={[styles.menuText, { color: '#3B82F6' }]}>Profili Düzenle</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </View>

      {/* PROFİL GÜNCELLEME MODALI */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Profili Düzenle</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: 20 }}>
              
              {/* 🟢 DOĞRUDAN DÜZENLENEBİLİR ALANLAR */}
              <View style={styles.fieldGroup}>
                <Text style={styles.modalLabel}>Biyografi</Text>
                <TextInput 
                  style={[styles.modalInput, styles.textArea]} 
                  value={editForm.bio} 
                  multiline
                  numberOfLines={3}
                  placeholder="Kendinden bahset kanka..."
                  onChangeText={(text) => setEditForm({...editForm, bio: text})} 
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.modalLabel}>Sosyal Medya Linki</Text>
                <TextInput 
                  style={styles.modalInput} 
                  value={editForm.socialMediaLink} 
                  placeholder="linkedin.com/in/username"
                  onChangeText={(text) => setEditForm({...editForm, socialMediaLink: text})} 
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.modalLabel}>Ad ve Soyad</Text>
                <TextInput style={[styles.modalInput, styles.disabledInput]} value={`${profile?.firstName} ${profile?.lastName}`} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.modalLabel}>Kullanıcı Adı</Text>
                <TextInput style={[styles.modalInput, styles.disabledInput]} value={profile?.username} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.modalLabel}>E-posta Adresi</Text>
                <TextInput style={[styles.modalInput, styles.disabledInput]} value={profile?.email} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.modalLabel}>Telefon No</Text>
                <TextInput style={[styles.modalInput, styles.disabledInput]} value={profile?.phoneNumber} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.modalLabel}>Üniversite Bilgisi</Text>
                <TextInput style={[styles.modalInput, styles.disabledInput]} value={profile?.universityName} editable={false} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.modalLabel}>Bölüm</Text>
                <TextInput style={[styles.modalInput, styles.disabledInput]} value={profile?.departmentName} editable={false} />
              </View>

            </ScrollView>

            {/* Modal Aksiyon Butonları */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
                <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#FFFFFF', paddingVertical: 24, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatarCircle: { width: 94, height: 94, borderRadius: 47, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 94, height: 94, borderRadius: 47 },
  avatarText: { color: '#FFFFFF', fontSize: 34, fontWeight: 'bold' },
  editIconBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#10B981', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  userTag: { fontSize: 15, color: '#4B5563', fontWeight: '500', marginBottom: 4 },
  userSubText: { fontSize: 13, color: '#9CA3AF' },
  
  infoSection: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#6B7280', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 10 },
  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  infoLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#1F2937', fontWeight: '500', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 },

  btnContainer: { paddingHorizontal: 16, marginBottom: 30 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  menuText: { fontSize: 16, marginLeft: 12, fontWeight: 'bold' },
  logoutItem: { marginTop: 10, borderColor: '#FEE2E2' },
  logoutText: { fontSize: 16, color: '#EF4444', marginLeft: 12, fontWeight: 'bold' },

  // Modal Stilleri
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  fieldGroup: { marginBottom: 14 },
  modalLabel: { fontSize: 13, color: '#4B5563', marginBottom: 6, fontWeight: '600', marginLeft: 2 },
  modalInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 16, color: '#1F2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  disabledInput: { backgroundColor: '#F3F4F6', color: '#9CA3AF', borderColor: '#E5E7EB' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cancelButton: { flex: 1, backgroundColor: '#F3F4F6', padding: 14, borderRadius: 12, alignItems: 'center' },
  cancelButtonText: { color: '#4B5563', fontWeight: 'bold', fontSize: 16 },
  saveButton: { flex: 1, backgroundColor: '#3B82F6', padding: 14, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});