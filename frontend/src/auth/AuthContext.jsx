import React, { createContext, useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api/axios";

export const AuthContext = createContext(null);

const TOKEN_KEY = "futsal_token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe(tk) {
    try {
      setAuthToken(tk);
      const res = await api.get("/api/auth/me");
      setUser(res.data.user);
    } catch {
      // token invalid
      setUser(null);
      setToken("");
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadMe(token);
    else {
      setLoading(false);
      setUser(null);
      setAuthToken("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthed: !!token,
      async login(email, password, rememberMe) {
        const res = await api.post("/api/auth/login", { email, password, rememberMe });
        const tk = res.data.token;
        setToken(tk);
        setAuthToken(tk);
        setUser(res.data.user);

        // Remember me: if not checked, store in sessionStorage instead
        if (rememberMe) {
          localStorage.setItem(TOKEN_KEY, tk);
          sessionStorage.removeItem(TOKEN_KEY);
        } else {
          sessionStorage.setItem(TOKEN_KEY, tk);
          localStorage.removeItem(TOKEN_KEY);
        }
      },
      logout() {
        setToken("");
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        setAuthToken("");
      }
    }),
    [token, user, loading]
  );

  // Also restore from sessionStorage if user didn’t remember
  useEffect(() => {
    if (!token) {
      const st = sessionStorage.getItem(TOKEN_KEY);
      if (st) {
        setToken(st);
        loadMe(st);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
