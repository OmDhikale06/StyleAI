import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, tokenStore } from "../services/api.js";
import { useToast } from "./ToastContext.jsx";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
const USER_KEY = "styleai_user";

function loadUser() {
  try {
    const u = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return u && tokenStore.get() ? u : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(loadUser);

  const persist = (data) => {
    tokenStore.set(data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = async (email, password) => persist(await api("/api/auth/login", { method: "POST", body: { email, password } }));
  const signup = async (form) => persist(await api("/api/auth/signup", { method: "POST", body: form }));

  useEffect(() => {
    const onUnauthorized = () => { logout(); toast("Session expired. Please log in again.", "error"); };
    window.addEventListener("styleai:unauthorized", onUnauthorized);
    return () => window.removeEventListener("styleai:unauthorized", onUnauthorized);
  }, [logout, toast]);

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}
