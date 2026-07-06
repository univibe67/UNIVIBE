import axios from 'axios';
import { tokenService } from './tokenService';
import { router } from 'expo-router';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}) as any; 

api.interceptors.request.use(
  async (config: any) => {
    console.log(`🚀 [İSTEK ÇIKIYOR]: URL -> ${config.url}`);
    const token = await tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: any) => {
    const apiResponse = response.data;

    if (apiResponse && typeof apiResponse === 'object' && 'isSuccessful' in apiResponse) {
        return apiResponse.data !== null ? apiResponse.data : apiResponse;
    }

    return apiResponse;
  },
  async (error: any) => {
    const originalRequest = error.config; 
    console.log(`📡 API HATA DÖNDÜ! Status: ${error.response?.status} | URL: ${originalRequest.url}`);
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 
      console.log("🕵️ GÜMRÜK MEMURU: Access Token ölmüş! Refresh Token süreci başlıyor...");
      try {
        const refreshToken = await tokenService.getRefreshToken();
        
        // 🚨 YENİ EKLENEN: Eski (süresi dolmuş) token'ı da cepten çıkarıyoruz
        const expiredToken = await tokenService.getAccessToken(); 
        
        if (!refreshToken) {
          console.log("❌ Cepler boş, Refresh Token cihazda bulunamadı!");
          throw new Error("Refresh token bulunamadı, yeniden giriş gerekli.");
        }
        console.log("🔄 Backend'e yeni token için istek atılıyor...");

        // 🚨 İŞTE SİHİRLİ DOKUNUŞ: C#'ın beklediği "token" alanını da pakete koyuyoruz!
        const refreshResponse = await axios.post(`${API_BASE_URL}/Auth/refresh-token`, {
          token: expiredToken,         // 👈 Eksik olan evrak buydu!
          refreshToken: refreshToken 
        });
        
        console.log("✅ YENİLEME BAŞARILI: Backend yeni tokenları verdi. Cihaza kaydediliyor...");
        console.log("✅ YENİLEME BAŞARILI: Backend yeni tokenları verdi. Cihaza kaydediliyor...");

        const { token: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

        await tokenService.saveTokens(newAccessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        console.log("🚀 İstek yeni Access Token ile arka planda tekrarlanıyor...");

        return api(originalRequest);

      } catch (refreshError:any) {
        console.log("🚨 REFRESH İSTEĞİ PATLADI! Detay:", refreshError.response?.data || refreshError.message);
        console.log("❌ REFRESH TOKEN DA ÖLMÜŞ: Sistem seni kurtaramaz, Login ekranına şutluyor!");
        await tokenService.clearTokens();
        router.replace('/(auth)/login');
        return Promise.reject(refreshError);
      }
    }

    if (error.response && error.response.data) {
      let errorBody = error.response.data;

      if (errorBody.errors && Array.isArray(errorBody.errors)) {
        return Promise.reject(errorBody.errors.join('\n'));
      }
      if (typeof errorBody === 'string' && errorBody.trim() !== '') {
        return Promise.reject(errorBody);
      }
      if (errorBody.message) {
        return Promise.reject(errorBody.message);
      }
    }

    return Promise.reject(error.message || "Sunucu ile bağlantı kurulamadı.");
  }
);