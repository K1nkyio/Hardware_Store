import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  type AuthUser,
  getCurrentUser,
  loginCustomer,
  logoutCustomer,
  restoreCustomerSession,
} from "@/lib/api";

type AuthContextValue = {
  currentUser: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  refreshProfile: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshToken = useCallback(async () => {
    const restored = await restoreCustomerSession();
    if (!restored) {
      setCurrentUser(null);
      return false;
    }

    try {
      const profile = await getCurrentUser();
      setCurrentUser(profile.user);
      return true;
    } catch {
      setCurrentUser(null);
      return false;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await loginCustomer(email, password);
    setCurrentUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutCustomer(false);
    setCurrentUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await getCurrentUser();
      setCurrentUser(profile.user);
      return profile.user;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const ok = await refreshToken();
      if (!active) return;
      if (!ok) setCurrentUser(null);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refreshToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isLoading,
      login,
      logout,
      refreshToken,
      refreshProfile,
    }),
    [currentUser, isLoading, login, logout, refreshToken, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
