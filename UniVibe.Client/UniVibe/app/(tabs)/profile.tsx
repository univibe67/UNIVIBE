import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { api } from '../../services/api'; 
import { tokenService } from '../../services/tokenService'; 
import Toast from 'react-native-toast-message';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  
  const [editForm, setEditForm] = useState({ 
    bio: '', 
    socialMediaLink: '' 
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get('/Users/profile'); 
      
      let data = response.data ? response.data : response;
      if (data.data) {
        data = data.data;
      }

      setProfile(data);
      setEditForm({
        bio: data.bio || '',
        socialMediaLink: data.socialMediaLink || ''
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erişim Hatası',
        text2: 'Profil bilgileri alınamadı. Lütfen internet bağlantınızı kontrol ediniz.',
      });
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

      formData.append('profileImage', { uri: imageUri, name: filename, type: type } as any);

      try {
        const response = await api.post('/Users/upload-profile-picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        const newPhotoUrl = response.imageUrl + '?t=' + new Date().getTime();
        setProfile((prev: any) => ({ ...prev, profilePictureUrl: newPhotoUrl }));
        
        Toast.show({
          type: 'success',
          text1: 'Güncelleme Başarılı',
          text2: 'Profil fotoğrafınız başarıyla değiştirildi.',
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Yükleme Hatası',
          text2: typeof error === 'string' ? error : 'Fotoğraf sunucuya gönderilemedi.',
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await api.put('/Users/update-profile', {
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        bio: editForm.bio,
        socialMediaLink: editForm.socialMediaLink
      });
      Toast.show({
        type: 'success',
        text1: 'Değişiklikler Kaydedildi',
        text2: 'Profil bilgileriniz güncellenmiştir.',
      });
      setEditModalVisible(false); 
      fetchProfile();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kayıt Hatası',
        text2: 'Değişiklikler kaydedilemedi, tekrar deneyiniz.',
      });
    }
  };

  const handleLogout = async () => {
    Alert.alert("Oturumu Kapat", "Sistemden çıkış yapmak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: async () => {
          await tokenService.clearTokens();
          router.replace('/(auth)/login');
        }
      }
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Hesabı Silme Onayı",
      "Bu işlem geri alınamaz. Tüm verileriniz anonimleştirilecektir.",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Evet, Sil", 
          style: "destructive", 
          onPress: async () => {
            try {
              await api.delete('/Users/delete-account');
              await tokenService.clearTokens();
              Toast.show({ type: 'success', text1: 'Hesap Silindi', text2: 'UniVibe hesabınız kapatılmıştır.' });
              router.replace('/(auth)/login');
            } catch (error) {
              Toast.show({ type: 'error', text1: 'Hata', text2: 'Hesap silinirken bir sorun oluştu.' });
            }
          }
        }
      ]
    );
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
      <View style={styles.header}>
        <TouchableOpacity onPress={pickAndUploadImage} disabled={uploading} style={styles.avatarContainer}>
          {uploading ? (
            <View style={styles.avatarCircle}><ActivityIndicator color="#FFF" /></View>
          ) : profile?.profilePictureUrl ? (
            <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.editIconBadge}><Ionicons name="camera" size={14} color="#FFF" /></View>
        </TouchableOpacity>
        <Text style={styles.userName}>{profile?.firstName} {profile?.lastName}</Text>
        <Text style={styles.userTag}>@{profile?.username}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Akademik Bilgiler</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Üniversite</Text><Text style={styles.infoValue}>{profile?.universityName}</Text>
          <View style={styles.divider} /><Text style={styles.infoLabel}>Fakülte</Text><Text style={styles.infoValue}>{profile?.facultyName}</Text>
          <View style={styles.divider} /><Text style={styles.infoLabel}>Bölüm</Text><Text style={styles.infoValue}>{profile?.departmentName}</Text>
        </View>

        <Text style={styles.sectionTitle}>Hakkımda & İletişim</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>E-posta</Text><Text style={styles.infoValue}>{profile?.email}</Text>
          <View style={styles.divider} /><Text style={styles.infoLabel}>Biyografi</Text><Text style={styles.infoValue}>{profile?.bio || "Henüz bir biyografi eklenmemiş."}</Text>
          <View style={styles.divider} /><Text style={styles.infoLabel}>Sosyal Medya</Text><Text style={styles.infoValue}>{profile?.socialMediaLink || "Bağlantı eklenmemiş."}</Text>
          <View style={styles.divider} /><Text style={styles.infoLabel}>Telefon No</Text><Text style={styles.infoValue}>{profile?.phoneNumber }</Text>
        </View>
      </View>

      <View style={styles.btnContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
          <Ionicons name="create-outline" size={24} color="#3B82F6" /><Text style={[styles.menuText, { color: '#3B82F6' }]}>Profili Düzenle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#EF4444" /><Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderColor: '#FEE2E2', marginTop: 10 }]} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={24} color="#DC2626" /><Text style={[styles.menuText, { color: '#DC2626' }]}>Hesabımı Sil</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Profili Düzenle</Text></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fieldGroup}><Text style={styles.modalLabel}>Biyografi</Text><TextInput style={[styles.modalInput, styles.textArea]} value={editForm.bio} multiline numberOfLines={3} onChangeText={(text) => setEditForm({...editForm, bio: text})} /></View>
              <View style={styles.fieldGroup}><Text style={styles.modalLabel}>Sosyal Medya Linki</Text><TextInput style={styles.modalInput} value={editForm.socialMediaLink} onChangeText={(text) => setEditForm({...editForm, socialMediaLink: text})} /></View>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}><Text style={styles.cancelButtonText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}><Text style={styles.saveButtonText}>Kaydet</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ /* CSS stilin aynı kalsın kanka, dokunmuyoruz */ 
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