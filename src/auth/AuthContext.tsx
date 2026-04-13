import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { apiJson, getToken, setToken } from "../api/client";

export type ApiUser = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  role: string;
  isActive: boolean;
  profileCompleted?: boolean;
  createdAt: string;
};

export type CompleteProfilePayload = {
  currentPassword: string;
  newEmail: string;
  newPassword: string;
  confirmPassword: string;
  phone: string;
};

type AuthState = {
  user: ApiUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeProfile: (payload: CompleteProfilePayload) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  /** Admin or deputy Manager — operational “manager” views (tasks, sessions, settings, etc.). */
  isElevated: boolean;
  /** Primary tenant administrator — user management only. */
  isAdmin: boolean;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const u = await apiJson<ApiUser>("/api/auth/me");
    setUser(u);
  }, []);

  useEffect(() => {
    void (async () => {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        await refreshMe();
      } catch {
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const r = await apiJson<{ token: string; user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(r.token);
    setUser(r.user);
  }, []);

  const completeProfile = useCallback(async (payload: CompleteProfilePayload) => {
    const r = await apiJson<{ token: string; user: ApiUser }>("/api/auth/complete-profile", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    setToken(r.token);
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login,
      completeProfile,
      logout,
      refreshMe,
      isElevated: user?.role === "Admin" || user?.role === "Manager",
      isAdmin: user?.role === "Admin",
    }),
    [user, loading, login, completeProfile, logout, refreshMe],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
