import { create } from 'zustand';
import { api } from '@/lib/api';

export interface UserSession {
  username: string;
  role: 'admin' | 'doctor' | 'patient';
  patient_id: number | null;
}

interface AuthState {
  token: string | null;
  user: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (usernameOrId: string, password?: string) => Promise<UserSession>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  initialize: () => {
    if (typeof window === 'undefined') return;
    try {
      const storedToken = localStorage.getItem('neuroai_token');
      const storedUser = localStorage.getItem('neuroai_user');
      
      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
        });
      }
    } catch (e) {
      console.error('Failed to initialize auth store from localStorage:', e);
      localStorage.removeItem('neuroai_token');
      localStorage.removeItem('neuroai_user');
    }
  },

  login: async (usernameOrId, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(
        '/auth/login',
        {
          username_or_id: usernameOrId,
          password: password || undefined,
        },
        { silent: true } as any
      );

      const { token, role, username, patient_id } = response.data;
      const userSession: UserSession = { username, role, patient_id };

      localStorage.setItem('neuroai_token', token);
      localStorage.setItem('neuroai_user', JSON.stringify(userSession));

      set({
        token,
        user: userSession,
        isAuthenticated: true,
        isLoading: false,
      });

      return userSession;
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Login failed';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('neuroai_token');
    localStorage.removeItem('neuroai_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
    // Redirect to home/login
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      });
      set({ isLoading: false });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to change password';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },
}));
