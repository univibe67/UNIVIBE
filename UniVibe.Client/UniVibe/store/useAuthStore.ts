import { create } from 'zustand';
import { tokenService } from '../services/tokenService';

interface AuthState {
  isAuthenticated: boolean;
  userFirstName: string | null;
  userLastName: string | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userFirstName: null,
  userLastName: null,
  isLoading: true,

  login: async (token, refreshToken, firstName, lastName) => {
    await tokenService.saveTokens(token, refreshToken);
    set({ isAuthenticated: true, userFirstName: firstName, userLastName: lastName });
  },

  logout: async () => {
    await tokenService.clearTokens();
    set({ isAuthenticated: false, userFirstName: null, userLastName: null });
  },
  checkAuth: async () => {
    try {
      const token = await tokenService.getAccessToken();
      
      if (token) {
        set({ isAuthenticated: true, isLoading: false });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ isAuthenticated: false, isLoading: false });
    }
  },
}));