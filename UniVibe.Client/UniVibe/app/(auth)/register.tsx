import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../services/api';

export default function RegisterInitScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegisterInit = async () => {
    if (!email.trim()) {
      Alert.alert("Eksik Bilgi", "Lütfen üniversite e-posta adresinizi girin.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/Auth/register-init', { email });

      Alert.alert(
        "Onay Maili Gönderildi!", 
        "Lütfen e-posta kutunuzu kontrol edin ve gelen linke tıklayarak kaydınızı tamamlayın.",
        [{ text: "Anladım", onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error: any) {

      const errorMessage = error.response?.data?.message || error.response?.data || "İşlem başarısız.";
      
      Alert.alert("Uyarı", typeof errorMessage === 'string' ? errorMessage : "Bu e-posta ile ilgili bir sorun var.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Kayıt Başlat</Text>
        <Text style={styles.subtitle}>Sadece üniversite e-postanla ilk adımı at</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>E-Posta (Üniversite Uzantılı)</Text>
          <TextInput
            style={styles.input}
            placeholder="ornek@beun.edu.tr"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity 
          style={[styles.registerButton, loading && { opacity: 0.7 }]} 
          onPress={handleRegisterInit} disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.registerButtonText}>Doğrulama Kodu Gönder</Text>}
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Vazgeçtim, </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginLink}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Stiller login ile aynı kalabilir...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  formContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 40 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#1F2937' },
  registerButton: { backgroundColor: '#10B981', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginLink: { color: '#10B981', fontSize: 14, fontWeight: 'bold' },
});