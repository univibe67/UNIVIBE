import { normalizeRole, type UserRole } from "../utils/userRole";

type TokenClaims = Record<string, unknown>;

function decodeToken(token: string): TokenClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((character) => `%${("00" + character.charCodeAt(0).toString(16)).slice(-2)}`)
          .join(""),
      ),
    ) as TokenClaims;
  } catch {
    return null;
  }
}

function getRoleFromClaims(claims: TokenClaims | null): UserRole | null {
  const claim =
    claims?.role ??
    claims?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

  if (Array.isArray(claim)) {
    for (const value of claim) {
      if (typeof value === "string" || typeof value === "number") {
        const role = normalizeRole(value);
        if (role) return role;
      }
    }
    return null;
  }

  return typeof claim === "string" || typeof claim === "number"
    ? normalizeRole(claim)
    : null;
}

export const tokenService = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  getRole: (token?: string) => getRoleFromClaims(decodeToken(token ?? localStorage.getItem("accessToken") ?? "")),
  
  saveTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  },
  
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};