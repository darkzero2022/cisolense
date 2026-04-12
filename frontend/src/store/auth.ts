import { create } from "zustand";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const { data } = await api.post<{ user: User }>("/auth/login", { email, password });
    await api.get("/auth/csrf").catch(() => {});
    set({ user: data.user, isAuthenticated: true });
  },

  logout: async () => {
    await api.post("/auth/logout").catch(() => {});
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const { data } = await api.get<{ user: User }>("/auth/me");
      await api.get("/auth/csrf").catch(() => {});
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
