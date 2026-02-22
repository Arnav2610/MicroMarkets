import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import {
  getOrCreateUser,
  hydrateStore,
  type User,
} from "@/data/store";
import {
  loadFromStorage,
  loadLastUser,
  saveLastUser,
  clearLastUser,
} from "@/lib/backend";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (name: string) => void;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const state = await loadFromStorage();
      if (state) hydrateStore(state);
      const lastName = await loadLastUser();
      if (lastName) {
        try {
          const u = getOrCreateUser(lastName);
          setUser(u);
        } catch {
          // invalid name, ignore
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const signIn = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const u = getOrCreateUser(trimmed);
    setUser(u);
    void saveLastUser(trimmed);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    void clearLastUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
