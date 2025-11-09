// src/stores/useAuthStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthUser = {
  id: string | number;
  email?: string;
  name?: string;
  [k: string]: unknown;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
};

type AuthActions = {
  setToken: (token: string | null) => void;
  clearToken: () => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "auth", // localStorage key
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
