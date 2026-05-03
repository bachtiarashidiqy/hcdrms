"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getDB, hasSeed, resetDB, subscribe } from "@/lib/store";
import { generateSeed } from "@/mocks/seed";
import type { User } from "@/types/domain";

interface AppContextValue {
  currentUser: User | null;
  setCurrentUserId: (id: string) => void;
  logout: () => void;
  resetData: () => void;
  hydrated: boolean;
  version: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const CURRENT_USER_KEY = "hcdrms_current_user";

export function AppProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!hasSeed()) {
      resetDB(generateSeed());
    }
    const db = getDB();
    const stored = window.localStorage.getItem(CURRENT_USER_KEY);
    if (stored && db.users.find((u) => u.id === stored)) {
      setCurrentUserIdState(stored);
    }
    setHydrated(true);
    const unsub = subscribe(() => setVersion((v) => v + 1));
    return () => {
      unsub();
    };
  }, []);

  const setCurrentUserId = (id: string) => {
    setCurrentUserIdState(id);
    window.localStorage.setItem(CURRENT_USER_KEY, id);
  };

  const logout = () => {
    setCurrentUserIdState(null);
    window.localStorage.removeItem(CURRENT_USER_KEY);
  };

  const resetData = () => {
    resetDB(generateSeed());
    setVersion((v) => v + 1);
  };

  const currentUser = hydrated && currentUserId ? getDB().users.find((u) => u.id === currentUserId) ?? null : null;

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUserId, logout, resetData, hydrated, version }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export function useCurrentUser(): User | null {
  return useApp().currentUser;
}
