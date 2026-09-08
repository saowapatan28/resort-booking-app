"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSession, saveSession, clearSession } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read localStorage only after mount (it's unavailable during SSR) and
    // gate the first paint on `ready` so client/server markup still matches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession(getSession());
    setReady(true);
  }, []);

  const login = useCallback((newSession) => {
    saveSession(newSession);
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
