import axios from "axios";
import { router } from "expo-router";
import { tokenService } from "./tokenService";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
}) as any;

api.interceptors.request.use(
  async (config: any) => {
    try {
      const token = await tokenService.getAccessToken();
      if (config.headers) {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (e) {}
    return config;
  },
  (error: any) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: any) => {
    const apiResponse = response.data;

    if (
      apiResponse &&
      typeof apiResponse === "object" &&
      "isSuccessful" in apiResponse
    ) {
      if (apiResponse.isSuccessful === false) {
        const errorMsg =
          apiResponse.message ||
          (apiResponse.errors && apiResponse.errors.join("\n")) ||
          "İşlem başarısız oldu.";
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
        const refreshToken = await tokenService.getRefreshToken();
        const expiredToken = await tokenService.getAccessToken();

        if (!refreshToken) {
          throw new Error("Refresh token bulunamadı, yeniden giriş gerekli.");
        }

        const refreshResponse = await axios.post(
          `${API_BASE_URL}/Auth/refresh-token`,
          {
            token: expiredToken,
            refreshToken: refreshToken,
          },
        );

        const responseBody = refreshResponse.data;
        const tokenData = responseBody.data || responseBody;

        const newAccessToken = tokenData.token;
        const newRefreshToken = tokenData.refreshToken;

        if (!newAccessToken) {
          throw new Error("Yeni token alınamadı.");
        }

        await tokenService.saveTokens(newAccessToken, newRefreshToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError: any) {
        await tokenService.clearTokens();
        router.replace("/(auth)/login");
        return Promise.reject(
          "Oturum süresi doldu, lütfen tekrar giriş yapın.",
        );
      }
    }

    if (error.response && error.response.data) {
      let errorBody = error.response.data;

      // Backend'den gelen ApiResponse Fail durumundaki hata mesajlarını yakalama
      if (
        errorBody &&
        typeof errorBody === "object" &&
        "isSuccessful" in errorBody &&
        errorBody.isSuccessful === false
      ) {
        const msg =
          errorBody.message ||
          (errorBody.errors && errorBody.errors.join("\n")) ||
          "İşlem başarısız oldu.";
        return Promise.reject(msg);
      }

      if (
        errorBody.errors &&
        typeof errorBody.errors === "object" &&
        !Array.isArray(errorBody.errors)
      ) {
        const errorMessages = Object.values(errorBody.errors).flat().join("\n");
        return Promise.reject(errorMessages);
      }

      if (errorBody.errors && Array.isArray(errorBody.errors)) {
        return Promise.reject(errorBody.errors.join("\n"));
      }

      if (typeof errorBody === "string" && errorBody.trim() !== "") {
        return Promise.reject(errorBody);
      }
      if (errorBody.message) {
        return Promise.reject(errorBody.message);
      }
    }

    return Promise.reject(error.message || "Sunucu ile bağlantı kurulamadı.");
  },
);
