import axios from "axios";
import { tokenService, setTokensSavedListener } from "./tokenService";
import i18n from "../i18n";
import { getErrorMessage } from "./errorMessage";

const rawApiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");
type UserFacingError = Error & { userMessage?: string };

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise: Promise<string> | null = null;
let refreshFailed = false;
let isRedirecting = false;

export function resetRefreshState() {
  refreshFailed = false;
  refreshPromise = null;
  isRedirecting = false;
}

setTokensSavedListener(resetRefreshState);

function redirectToLogin() {
  if (isRedirecting) return;
  isRedirecting = true;
  tokenService.clearTokens();
  const currentPath = window.location.pathname;
  if (!currentPath.includes("/login")) {
    const isAdminRoute = currentPath.startsWith("/admin");
    const target = isAdminRoute ? "/admin/login" : "/login";
    window.location.replace(target);
  }
}

export async function requestTokenRefresh(): Promise<string> {
  if (refreshFailed) {
    redirectToLogin();
    return Promise.reject(new Error("Refresh token session expired"));
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = tokenService.getRefreshToken();
  const expiredToken = tokenService.getAccessToken();

  if (!refreshToken || refreshToken === "undefined" || refreshToken === "null" || !refreshToken.trim()) {
    refreshFailed = true;
    redirectToLogin();
    return Promise.reject(new Error("No refresh token available"));
  }

  refreshPromise = (async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/tokens/refresh`,
        {
          token: expiredToken || "",
          refreshToken: refreshToken.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Accept-Language": i18n.language.startsWith("en") ? "en-US" : "tr-TR",
          },
          timeout: 4000,
        }
      );

      const responseData = response?.data;
      const data = responseData?.data || responseData;
      const newAccessToken = data?.token || data?.accessToken;
      const newRefreshToken = data?.refreshToken;
      const role = data?.role;

      if (!newAccessToken || !newRefreshToken) {
        throw new Error("Invalid token refresh payload");
      }

      refreshFailed = false;
      tokenService.saveTokens(newAccessToken, newRefreshToken, role);
      return newAccessToken;
    } catch (err) {
      refreshFailed = true;
      redirectToLogin();
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.request.use(
  async (config) => {
    const url = (config.url || "").toLowerCase();
    const isAuthEndpoint = url.includes("auth/");

    if (config.headers) {
      const currentLang = i18n.language.startsWith("en") ? "en-US" : "tr-TR";
      config.headers["Accept-Language"] = currentLang;
    }

    if (isAuthEndpoint) {
      return config;
    }

    let token = tokenService.getAccessToken();
    const refreshToken = tokenService.getRefreshToken();

    // Check if access token is expired or expiring in next 30 seconds
    if (token && tokenService.isTokenExpired(token, 30)) {
      if (refreshToken && refreshToken.trim().length > 0) {
        try {
          token = await requestTokenRefresh();
        } catch {
          token = null;
        }
      } else {
        tokenService.clearTokens();
        token = null;
      }
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
        const userMessage = getErrorMessage({ response: { data: apiResponse } });
        const error: UserFacingError = new Error(userMessage);
        error.userMessage = userMessage;
        error.message = userMessage;
        return Promise.reject(error);
      }
      return apiResponse.data !== null ? apiResponse.data : apiResponse;
    }

    return apiResponse;
  },
  async (error: any) => {
    const originalRequest = error.config;
    const originalUrl = (originalRequest?.url || "").toLowerCase();
    const isAuthEndpoint = originalUrl.includes("auth/");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      const skipRedirect =
        Boolean(originalRequest?.headers?.["X-Skip-Auth-Redirect"]) ||
        Boolean(originalRequest?.headers?.["x-skip-auth-redirect"]);

      if (skipRedirect) {
        const userMessage = getErrorMessage(error);
        const enrichedError: UserFacingError =
          error instanceof Error ? error : new Error(userMessage);
        enrichedError.userMessage = userMessage;
        enrichedError.message = userMessage;
        return Promise.reject(enrichedError);
      }

      // If request has already been retried once, do not retry in loop!
      if (originalRequest._retry) {
        redirectToLogin();
        return Promise.reject(new Error("Unauthorized request after retry"));
      }

      originalRequest._retry = true;

      try {
        const newAccessToken = await requestTokenRefresh();
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        redirectToLogin();
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
