import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest, meRequest, registerRequest } from "../api/authApi.js";

const AuthContext = createContext(null);
const tokenKey = "estario_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const applyAuth = useCallback((auth) => {
    localStorage.setItem(tokenKey, auth.token);
    setToken(auth.token);
    setUser(auth.user);
  }, []);

  const login = useCallback(
    async (payload) => {
      const auth = await loginRequest(payload);
      applyAuth(auth);
      return auth.user;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (payload) => {
      const auth = await registerRequest(payload);
      applyAuth(auth);
      return auth.user;
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await meRequest();
        if (isMounted) {
          setUser(data.user);
        }
      } catch {
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [logout, token]);

  const value = useMemo(
    () => ({
      isAdmin: user?.role === "ADMIN",
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      register,
      token,
      updateUser,
      user
    }),
    [isLoading, login, logout, register, token, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
