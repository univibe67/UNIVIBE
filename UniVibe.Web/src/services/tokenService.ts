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

export const tokenService = {
  getAccessToken: () => localStorage.getItem("accessToken"),
  getRefreshToken: () => localStorage.getItem("refreshToken"),
  getRole: (token?: string): UserRole | null => {
    const currentToken = token ?? localStorage.getItem("accessToken") ?? "";
    if (currentToken) {
      const roleFromClaims = getRoleFromClaims(decodeToken(currentToken));
      if (roleFromClaims) return roleFromClaims;
    }
    const storedRole = localStorage.getItem("userRole");
    if (storedRole) {
      const norm = normalizeRole(storedRole);
      if (norm) return norm;
    }
    return null;
  },

  saveTokens: (
    accessToken: string,
    refreshToken: string,
    role?: string | number,
  ) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
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
  },

  clearTokens: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userRole");
  },
};
