// Global store for user profile + credits balance.
// Hydrated from /api/user/me on mount. Credits mutations (from tool runs)
// can optimistically update via setBalance().

import { create } from "zustand";
import type { Plan } from "@/generated/prisma/client";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  plan: Plan;
  creditsBalance: number;
  creditsLimit: number;
  planRenewsAt: string | null;
  createdAt: string;
}

interface UserStore {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;

  fetchUser: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  setBalance: (balance: number) => void;
  clear: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: false,
  error: null,

  async fetchUser() {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/user/me", { cache: "no-store" });
      if (!res.ok) {
        set({ user: null, loading: false, error: res.status === 401 ? null : "failed" });
        return;
      }
      const data = await res.json();
      set({ user: data.user, loading: false });
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "error" });
    }
  },

  setUser(user) { set({ user }); },

  setBalance(balance) {
    set((s) => (s.user ? { user: { ...s.user, creditsBalance: balance } } : s));
  },

  clear() { set({ user: null }); },
}));
