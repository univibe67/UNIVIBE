import axios from "axios";
import { tokenService } from "./tokenService";
import i18n from "../i18n";
import { getErrorMessage } from "./errorMessage";

const API_BASE_URL = import.meta.env.VITE_API_URL;
type UserFacingError = Error & { userMessage?: string };

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();
    const isLoginRequest = config.url?.toLowerCase().includes("/auth/login");
    if (config.headers) {
      const currentLang = i18n.language.startsWith("en") ? "en-US" : "tr-TR";
      config.headers['Accept-Language'] = currentLang;
      if (token && !isLoginRequest) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
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
        const error = new Error(
          getErrorMessage({ response: { data: apiResponse } }),
        );
        return Promise.reject(error);
      }
      return apiResponse.data !== null ? apiResponse.data : apiResponse;
    }

    return apiResponse;
  },
  async (error: any) => {
    const originalRequest = error.config;
    const isLoginRequest = originalRequest?.url?.toLowerCase().includes("/auth/login");

    if (error.response?.status === 401 && !isLoginRequest && !originalRequest._retry) {
      const skipRedirect =
        Boolean(originalRequest?.headers?.['X-Skip-Auth-Redirect']) ||
        Boolean(originalRequest?.headers?.['x-skip-auth-redirect']);

      if (skipRedirect) {
        const userMessage = getErrorMessage(error);
        const enrichedError: UserFacingError =
          error instanceof Error ? error : new Error(userMessage);
        enrichedError.userMessage = userMessage;
        enrichedError.message = userMessage;
        return Promise.reject(enrichedError);
      }

      originalRequest._retry = true;
      try {
        const refreshToken = tokenService.getRefreshToken();
        const expiredToken = tokenService.getAccessToken();

        if (!refreshToken) {
          const userMessage = getErrorMessage(error);
          const enrichedError: UserFacingError =
            error instanceof Error ? error : new Error(userMessage);
          enrichedError.userMessage = userMessage;
          enrichedError.message = userMessage;
          return Promise.reject(enrichedError);
        }

        const refreshResponse = await axios.post(
          `${API_BASE_URL}/Auth/tokens/refresh`,
          {
            token: expiredToken,
            refreshToken: refreshToken,
          },
        );

        const { token: newAccessToken, refreshToken: newRefreshToken } =
          refreshResponse.data.data;
        tokenService.saveTokens(newAccessToken, newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        tokenService.clearTokens();
        window.location.href = "/";
          return Promise.reject(new Error(getErrorMessage(refreshError)));
      }
    }

      const userMessage = getErrorMessage(error);
      const enrichedError: UserFacingError =
        error instanceof Error ? error : new Error(userMessage);
      enrichedError.userMessage = userMessage;
      enrichedError.message = userMessage;
      return Promise.reject(enrichedError);
  },
);