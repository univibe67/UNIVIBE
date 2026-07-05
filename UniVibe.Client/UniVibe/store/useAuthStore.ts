import { create } from 'zustand';
import { tokenService } from '../services/tokenService';

interface AuthState {
  isAuthenticated: boolean;
  userFirstName: string | null;
  userLastName: string | null;
  login: (token: string, refreshToken: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userFirstName: null,
  userLastName: null,

  login: async (token, refreshToken, firstName, lastName) => {
    await tokenService.saveTokens(token, refreshToken);
    set({ isAuthenticated: true, userFirstName: firstName, userLastName: lastName });
  },

  logout: async () => {
    await tokenService.clearTokens();
    set({ isAuthenticated: false, userFirstName: null, userLastName: null });
  },
}));