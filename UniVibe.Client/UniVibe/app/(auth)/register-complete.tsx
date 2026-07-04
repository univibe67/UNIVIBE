import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

export default function RegisterCompleteScreen() {
  const router = useRouter();
  
  const { token } = useLocalSearchParams<{ token: string }>();
  const loginAction = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [grade, setGrade] = useState('');
  
  const [departmentId, setDepartmentId] = useState('1'); 

  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        Alert.alert("Hata", "Geçersiz kayıt linki.");
        router.replace('/(auth)/login');
        return;
      }

      try {
        await api.get(`/Auth/verify-token?token=${token}`);
        setIsValidatingToken(false);
      } catch (error: any) {
        Alert.alert("Bağlantı Süresi Dolmuş", "Bu kayıt linki geçersiz veya süresi dolmuş.");
        router.replace('/(auth)/register');
      }
    };

    verifyToken();
  }, [token]);

  const handleCompleteRegistration = async () => {
  if (!username || !firstName || !lastName || !password || !departmentId) {
    Alert.alert("Eksik Bilgi", "Lütfen zorunlu alanları doldurun.");
    return;
  }

  setIsSubmitting(true);
  try {
    const requestData = {
      token: token,              
      username: username.trim(),
      password: password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim() || null, 
      departmentId: departmentId, 
      grade: parseInt(grade) || 0 
    };

    const response = await api.post('/Auth/complete-registration', requestData);
    const { token: receivedToken, refreshToken, firstName: resName, lastName: resLastName } = response.data;

    // Başarılı ise login işlemini yap ve içeri al
    await loginAction(receivedToken, refreshToken, resName, resLastName);
    router.replace('/(tabs)');

  } catch (error: any) {
    console.log("🚨 Detaylı Hata:", JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.data?.errors) {
      const validationErrors = Object.values(error.response.data.errors).flat().join('\n');
      Alert.alert("Form Hatası", validationErrors);
    } else {
      const errorMessage = error.response?.data?.message || "Kayıt tamamlanamadı.";
      Alert.alert("Hata", errorMessage);
    }
  } finally {
    setIsSubmitting(false);
  }
};

  if (isValidatingToken) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Bağlantı doğrulanıyor...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Hoş Geldin!</Text>
          <Text style={styles.subtitle}>Profilini tamamla ve kampüse katıl</Text>

          {/* Form Alanları */}
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Ad</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Soyad</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput style={styles.input} value={username} onChangeText={setUsername} autoCapitalize="none" />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre Belirle</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Sınıf (Örn: 3)</Text>
              <TextInput style={styles.input} value={grade} onChangeText={setGrade} keyboardType="numeric" />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Telefon (Opsiyonel)</Text>
              <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
            </View>
          </View>

          {/* BURAYA BİR SONRAKİ ADIMDA CASCADING DROPDOWN GELECEK */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bölüm ID (Şimdilik Elle Gir - Örn: 1)</Text>
            <TextInput style={styles.input} value={departmentId} onChangeText={setDepartmentId} keyboardType="numeric" />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]} 
            onPress={handleCompleteRegistration} 
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Kaydı Tamamla</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  formContainer: { paddingHorizontal: 24, paddingVertical: 40 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  inputContainer: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1F2937' },
  submitButton: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10, shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});