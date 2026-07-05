import { Stack } from 'expo-router';
import Toast, { ToastConfig, ToastProps } from 'react-native-toast-message';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

const toastConfig: ToastConfig = {
  success: ({ text1, text2, ...rest }: any) => ( // props yerine text1 ve text2'yi doğrudan destruct ediyoruz
    <BlurView intensity={80} tint="light" style={styles.toastContainer}>
      <View style={[styles.iconContainer, { backgroundColor: '#ECFDF5' }]}>
        <Ionicons name="checkmark-done-circle" size={26} color="#10B981" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{text1}</Text>
        {text2 ? <Text style={styles.subText}>{text2}</Text> : null}
      </View>
    </BlurView>
  ),
  
  error: ({ text1, text2, ...rest }: any) => (
    <BlurView intensity={80} tint="light" style={styles.toastContainer}>
      <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
        <Ionicons name="alert-circle" size={26} color="#EF4444" />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{text1}</Text>
        {text2 ? <Text style={styles.subText}>{text2}</Text> : null}
      </View>
    </BlurView>
  )
};

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    padding: 16,
    borderRadius: 24, // Tam yuvarlak, modern köşe
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Camın arkasındaki hafif beyazlık
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)', // Cam yansıması hissi
    marginTop: 10,
    
    // Zengin Gölgelendirme (Premium Shadow)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10, // Android için gölge
    overflow: 'hidden', // BlurView'un köşelerden taşmaması için çok kritik!
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  subText: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
    fontWeight: '500',
  },
});