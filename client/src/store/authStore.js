import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../api/auth.api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: true,

      setUser: (user) => set({ user }),

      checkAuth: async () => {
        const { token } = get();
        if (!token) return set({ isLoading: false });
        try {
          const { data } = await authApi.getMe();
          set({ user: data.data.user, isLoading: false });
        } catch {
          set({ user: null, token: null, refreshToken: null, isLoading: false });
        }
      },

      login: async (credentials) => {
        const { data } = await authApi.login(credentials);
        set({
          user: data.data.user,
          token: data.data.token,
          refreshToken: data.data.refreshToken,
        });
        return data.data.user;
      },

      register: async (payload) => {
        const { data } = await authApi.register(payload);
        set({
          user: data.data.user,
          token: data.data.token,
          refreshToken: data.data.refreshToken,
        });
        return data.data.user;
      },

      logout: async () => {
        try {
          await authApi.logout(get().refreshToken);
        } catch { /* silent */ }
        set({ user: null, token: null, refreshToken: null });
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'chatsphere-auth',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken }),
    }
  )
);
