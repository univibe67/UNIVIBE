import axios from 'axios';
import { tokenService } from './tokenService';
import { router } from 'expo-router';

const API_BASE_URL = 'http://10.0.2.2:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await tokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config; 
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; 
      try {
        const refreshToken = await tokenService.getRefreshToken();
        
        if (!refreshToken) {
          throw new Error("Refresh token bulunamadı, yeniden giriş gerekli.");
        }

        const refreshResponse = await axios.post(`${API_BASE_URL}/Auth/refresh-token`, {
          refreshToken: refreshToken 
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        await tokenService.saveTokens(newAccessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);

      } catch (refreshError) {
        
        await tokenService.clearTokens();
        
        router.replace('/(auth)/login');
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);