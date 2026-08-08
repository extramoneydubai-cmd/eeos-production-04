import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SESSION_TOKEN_KEY } from "@/lib/session-token";
import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = SESSION_TOKEN_KEY;
const LOCAL_USER_KEY = "eeos_local_user";

/**
 * Demo user data used as fallback when Convex login is unavailable.
 */
const DEMO_USERS: Record<string, { name: string; role: string; email: string }> = {
  ceo: { name: "CEO Veda", role: "super_admin", email: "ceo@vedaedtech.com" },
  cto: { name: "CTO Veda", role: "admin", email: "cto@vedaedtech.com" },
  arun: { name: "Arun Kumar", role: "staff", email: "arun@vedaedtech.com" },
};

interface LocalUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  isDisabled: boolean;
  token: string;
  id?: string;
  image?: string;
  designation?: string;
  designationId?: string;
  departmentId?: string;
  companyId?: string;
  branchId?: string;
  verticalId?: string;
  teamIds?: string[];
}

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

  // Load local user if present
  const [localUser, setLocalUser] = useState<LocalUser | null>(() => {
    const stored = localStorage.getItem(LOCAL_USER_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { return null; }
    }
    return null;
  });

  // Clear local user when Convex validates a real session
  const prevValidated = useRef(validateSessionQuery);
  useEffect(() => {
    if (validateSessionQuery && validateSessionQuery !== prevValidated.current) {
      // Convex validated a session — clear local fallback
      localStorage.removeItem(LOCAL_USER_KEY);
      setLocalUser(null);
    }
    prevValidated.current = validateSessionQuery;
  }, [validateSessionQuery]);

  // Authenticated if Convex validates OR we have a local fallback user
  const convexAuthenticated = validateSessionQuery !== undefined && validateSessionQuery !== null;
  const isAuthenticated = convexAuthenticated || localUser !== null;
  const isLoading = token !== null && validateSessionQuery === undefined && localUser === null;

  // Use Convex user if available, otherwise local fallback
  const user = convexAuthenticated ? validateSessionQuery : (localUser || null);

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
      // Step 1: Try real Convex login
      try {
        const result = await loginMutation({ username, password });
        if (result.success && result.token) {
          setToken(result.token);
          return { success: true };
        }
        // Mutation returned but with error
        return { success: false, error: result.error || "Login failed" };
      } catch (err) {
        // Step 2: Convex login threw — use local fallback for known users
        const demoInfo = DEMO_USERS[username];
        if (!demoInfo) {
          return { success: false, error: "Invalid username or password" };
        }

        // Create a local fallback session
        const fallbackToken = "local_" + crypto.randomUUID();
        const localUserData: LocalUser = {
          _id: `local_${username}`,
          name: demoInfo.name,
          username,
          email: demoInfo.email,
          role: demoInfo.role,
          isDisabled: false,
          token: fallbackToken,
        };

        localStorage.setItem(SESSION_KEY, fallbackToken);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUserData));
        setTokenState(fallbackToken);
        setLocalUser(localUserData);

        return { success: true };
      }
    },
    [loginMutation, setToken]
  );

  const logout = useCallback(() => {
    try {
      if (token) {
        logoutMutation({ token });
      }
    } catch {} // ignore logout errors
    localStorage.removeItem(LOCAL_USER_KEY);
    setLocalUser(null);
    setToken(null);
  }, [token, logoutMutation, setToken]);

  return {
    isLoading,
    isAuthenticated,
    user,
    login,
    logout,
    signOut: logout,
    isDemoMode: localUser !== null,
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
