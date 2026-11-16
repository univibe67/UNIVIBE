import { normalizeRole, type UserRole } from "../utils/userRole";

type TokenClaims = Record<string, unknown>;

function decodeToken(token: string): TokenClaims | null {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(pad);

    const binaryString = window.atob(padded);
    try {
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoded = new TextDecoder().decode(bytes);
      return JSON.parse(decoded) as TokenClaims;
    } catch {
      return JSON.parse(binaryString) as TokenClaims;
    }
  } catch {
    return null;
  }
}

function getRoleFromClaims(claims: TokenClaims | null): UserRole | null {
  if (!claims || typeof claims !== "object") return null;

  // 1. Standart doğrudan alanlar
  const direct =
    claims.role ??
    claims.Role ??
    claims.roles ??
    claims.Roles ??
    claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"];

  if (Array.isArray(direct)) {
    for (const item of direct) {
      if (typeof item === "string" || typeof item === "number") {
        const norm = normalizeRole(item);
        if (norm) return norm;
      }
    }
  } else if (typeof direct === "string" || typeof direct === "number") {
    const norm = normalizeRole(direct);
    if (norm) return norm;
  }

  // 2. "role" ile biten tüm olası claim anahtarlarını tara
  for (const [key, val] of Object.entries(claims)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "role" || lowerKey.endsWith("/role") || lowerKey.endsWith("role")) {
      if (typeof val === "string" || typeof val === "number") {
        const norm = normalizeRole(val);
        if (norm) return norm;
      }
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === "string" || typeof item === "number") {
            const norm = normalizeRole(item);
            if (norm) return norm;
          }
        }
      }
    }
  }

  return null;
}

let onTokensSaved: (() => void) | null = null;
export function setTokensSavedListener(listener: () => void) {
  onTokensSaved = listener;
}

export const tokenService = {
  getAccessToken: (): string | null => {
    const t = localStorage.getItem("accessToken");
    return t && t !== "undefined" && t !== "null" && t.trim().length > 0 ? t.trim() : null;
  },
  getRefreshToken: (): string | null => {
    const r = localStorage.getItem("refreshToken");
    return r && r !== "undefined" && r !== "null" && r.trim().length > 0 ? r.trim() : null;
  },
  isTokenExpired: (token?: string | null, skewSeconds = 30): boolean => {
    const currentToken = token ?? tokenService.getAccessToken();
    if (!currentToken || currentToken === "undefined" || currentToken === "null" || !currentToken.trim()) {
      return true;
    }
    const claims = decodeToken(currentToken);
    if (!claims || claims.exp === undefined || claims.exp === null) {
      return true;
    }
    const expNum = typeof claims.exp === "number" ? claims.exp : Number(claims.exp);
    if (!expNum || Number.isNaN(expNum)) {
      return true;
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return expNum <= nowInSeconds + skewSeconds;
  },
  hasValidSession: (): boolean => {
    const accessToken = tokenService.getAccessToken();
    const refreshToken = tokenService.getRefreshToken();
    const hasValidAccess = Boolean(accessToken && !tokenService.isTokenExpired(accessToken, 0));
    const hasValidRefresh = Boolean(refreshToken && refreshToken.trim().length > 0);
    return hasValidAccess || hasValidRefresh;
  },
  getUserId: (): string | null => {
    const token = tokenService.getAccessToken();
    if (!token) return null;
    const claims = decodeToken(token);
    if (!claims) return null;
    const id =
      claims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
      claims["nameid"] ||
      claims["sub"] ||
      claims["id"] ||
      claims["UserId"] ||
      claims["userId"];
    return typeof id === "string" ? id : null;
  },
  getRole: (token?: string | null): UserRole | null => {
    const currentToken = token ?? tokenService.getAccessToken() ?? "";
    if (currentToken) {
      const roleFromClaims = getRoleFromClaims(decodeToken(currentToken));
      if (roleFromClaims) return roleFromClaims;
    }
    const storedRole = localStorage.getItem("userRole");
    if (storedRole && storedRole !== "undefined" && storedRole !== "null") {
      const norm = normalizeRole(storedRole);
      if (norm) return norm;
    }
    return null;
  },

  saveTokens: (
    accessToken: string,
    refreshToken?: string | null,
    role?: string | number,
  ) => {
    if (accessToken && typeof accessToken === "string" && accessToken !== "undefined" && accessToken !== "null") {
      localStorage.setItem("accessToken", accessToken.trim());
    }
    if (refreshToken && typeof refreshToken === "string" && refreshToken !== "undefined" && refreshToken !== "null") {
      localStorage.setItem("refreshToken", refreshToken.trim());
    }
    if (role !== undefined && role !== null) {
      const norm = normalizeRole(role);
      if (norm) {
        localStorage.setItem("userRole", norm);
        return;
      }
    }
    const extracted = getRoleFromClaims(decodeToken(accessToken));
    if (extracted) {
      localStorage.setItem("userRole", extracted);
    }
    if (onTokensSaved) {
      onTokensSaved();
    }
  },

  clearTokens: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
  },
};
