import axios from 'axios';
import { tokenService } from './tokenService';

const API_BASE_URL = 'http://localhost:5000/api'; 

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Senin mobildeki cevabı karşılama (Response) ve Hata yakalama mantığın
api.interceptors.response.use(
  (response: any) => {
    const apiResponse = response.data;

    if (apiResponse && typeof apiResponse === 'object' && 'isSuccessful' in apiResponse) {
      if (apiResponse.isSuccessful === false) {
        const errorMsg = apiResponse.message || (apiResponse.errors && apiResponse.errors.join('\n')) || "İşlem başarısız oldu.";
        return Promise.reject(errorMsg);
      }
      return apiResponse.data !== null ? apiResponse.data : apiResponse;
    }

    return apiResponse;
  },
  async (error: any) => {
    const originalRequest = error.config; 
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 
      try {
        const refreshToken = tokenService.getRefreshToken();
        const expiredToken = tokenService.getAccessToken(); 
        
        if (!refreshToken) {
          throw new Error("Refresh token bulunamadı, yeniden giriş gerekli.");
        }

        const refreshResponse = await axios.post(`${API_BASE_URL}/Auth/refresh-token`, {
          token: expiredToken,         
          refreshToken: refreshToken 
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
        tokenService.saveTokens(newAccessToken, newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError: any) {
        tokenService.clearTokens();
        window.location.href = '/'; 
        return Promise.reject("Oturum süresi doldu, lütfen tekrar giriş yapın.");
      }
    }

    if (error.response && error.response.data) {
      let errorBody = error.response.data;
      if (errorBody.errors && typeof errorBody.errors === 'object' && !Array.isArray(errorBody.errors)) {
        const errorMessages = Object.values(errorBody.errors).flat().join('\n');
        return Promise.reject(errorMessages);
      }
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