import axios from 'axios';
import { tokenService } from './tokenService';

// DİKKAT: Telefonun backend'e ulaşabilmesi için kendi bilgisayarının local IP adresini yazmalısın.
// CMD'ye 'ipconfig' yazarak IPv4 adresini bulabilirsin (Örn: 192.168.1.50)
// Eğer Android Emulator kullanıyorsan: 'http://10.0.2.2:5000/api' yapabilirsin.
const API_BASE_URL = 'http://10.0.2.2:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Her istekten önce otomatik olarak çalışır ve Token'ı ekler
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