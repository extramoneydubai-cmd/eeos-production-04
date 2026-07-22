import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useEffect, useState } from "react";

const SESSION_KEY = "eeos_session_token";

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(() => {
    return localStorage.getItem(SESSION_KEY);
  });

  const loginMutation = useMutation(api.authHelpers.login);
  const logoutMutation = useMutation(api.authHelpers.logout);
  const validateSessionQuery = useQuery(
    api.authHelpers.validateSession,
    token ? { token } : "skip"
  );

  const isAuthenticated = validateSessionQuery !== undefined && validateSessionQuery !== null;
  const isLoading = token !== null && validateSessionQuery === undefined;

  const user = isAuthenticated ? validateSessionQuery : null;

  const setToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem(SESSION_KEY, newToken);
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setTokenState(newToken);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await loginMutation({ username, password });
      if (result.success && result.token) {
        setToken(result.token);
      }
      return { success: false, error: result.error || "Login failed" };
    },
    [loginMutation, setToken]
  );

  const logout = useCallback(() => {
    if (token) {
      logoutMutation({ token });
    }
    setToken(null);
  }, [token, logoutMutation, setToken]);

  return {
    isLoading,
    isAuthenticated,
    user,
    login,
    logout,
    signOut: logout,
    isDemoMode: false,
  };
}

export function useSession() {
  const token = localStorage.getItem(SESSION_KEY);
  const session = useQuery(
    api.authHelpers.validateSession,
    token ? { token } : "skip"
  );
  return {
    session,
    token,
    isLoading: token !== null && session === undefined,
  };
}
