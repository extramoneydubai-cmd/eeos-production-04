import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

/** A demo user returned by the seed engine */
export interface DemoUser {
  id: Id<"users">;
  name: string;
  email: string;
  image: string | null;
  demoRole: string;
  designation: string;
}

interface DemoAuthContextValue {
  /** Currently logged-in demo user, or null */
  demoUser: DemoUser | null;
  /** Whether the demo environment is seeded */
  seeded: boolean;
  /** Whether we're still loading */
  isDemoLoading: boolean;
  /** Log in as a demo user by role */
  loginAs: (demoRole: string) => Promise<void>;
  /** Switch to a different demo user */
  switchUser: () => void;
  /** Log out of demo mode */
  logoutDemo: () => void;
  /** Reset all demo data */
  resetDemo: () => Promise<void>;
  /** Seed the demo environment */
  seedDemo: () => Promise<void>;
}

const DemoAuthContext = createContext<DemoAuthContextValue | null>(null);

const DEMO_SESSION_KEY = "eeos_demo_session";

function getStoredSession(): string | null {
  try {
    return localStorage.getItem(DEMO_SESSION_KEY);
  } catch {
    return null;
  }
}

function setStoredSession(role: string | null): void {
  try {
    if (role) {
      localStorage.setItem(DEMO_SESSION_KEY, role);
    } else {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [demoUser, setDemoUser] = useState<DemoUser | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(true);

  // Check if demo is seeded
  const isSeededData = useQuery(api.engines.seedEngine.isSeeded);
  const demoUsersData: DemoUser[] | undefined = useQuery(
    api.engines.seedEngine.getDemoUsers,
  );
  const seedWithoutAuth = useMutation(api.engines.seedEngine.seedWithoutAuth);
  const resetDemoMutation = useMutation(api.engines.seedEngine.resetDemo);

  // Initialize — check stored session
  useEffect(() => {
    const storedRole = getStoredSession();
    if (storedRole && demoUsersData && demoUsersData.length > 0) {
      const matched = demoUsersData.find((u) => u.demoRole === storedRole);
      if (matched) {
        setDemoUser(matched);
      }
    }
    setIsDemoLoading(false);
  }, [demoUsersData]);

  // Update seeded state
  useEffect(() => {
    if (isSeededData !== undefined) {
      setSeeded(isSeededData);
    }
  }, [isSeededData]);

  const loginAs = useCallback(
    async (demoRole: string) => {
      setIsDemoLoading(true);
      try {
        // Ensure demo is seeded
        if (!seeded) {
          await seedWithoutAuth();
          // Wait for data to propagate
          await new Promise((r) => setTimeout(r, 1000));
        }

        // Find the user by role from the loaded data
        if (demoUsersData && demoUsersData.length > 0) {
          const matched = demoUsersData.find((u) => u.demoRole === demoRole);
          if (matched) {
            setDemoUser(matched);
            setStoredSession(demoRole);
          }
        }
      } catch (err) {
        console.error("Demo login failed:", err);
      } finally {
        setIsDemoLoading(false);
      }
    },
    [seeded, demoUsersData, seedWithoutAuth],
  );

  const switchUser = useCallback(() => {
    setDemoUser(null);
    setStoredSession(null);
  }, []);

  const logoutDemo = useCallback(() => {
    setDemoUser(null);
    setStoredSession(null);
  }, []);

  const resetDemo = useCallback(async () => {
    await resetDemoMutation();
    setDemoUser(null);
    setStoredSession(null);
    setSeeded(false);
  }, [resetDemoMutation]);

  const seedDemo = useCallback(async () => {
    await seedWithoutAuth();
    setSeeded(true);
  }, [seedWithoutAuth]);

  return (
    <DemoAuthContext.Provider
      value={{
        demoUser,
        seeded,
        isDemoLoading,
        loginAs,
        switchUser,
        logoutDemo,
        resetDemo,
        seedDemo,
      }}
    >
      {children}
    </DemoAuthContext.Provider>
  );
}

export function useDemoAuth(): DemoAuthContextValue {
  const ctx = useContext(DemoAuthContext);
  if (!ctx) {
    throw new Error("useDemoAuth must be used within a DemoAuthProvider");
  }
  return ctx;
}
