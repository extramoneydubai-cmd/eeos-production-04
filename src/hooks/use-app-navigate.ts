import { useCallback } from "react";

/**
 * Custom navigation hook that works without React Router context.
 * Uses window.history.pushState/replaceState directly so it doesn't
 * depend on react-router's useContext which can fail in certain Vite
 * bundling environments with React 19.
 */
export function useAppNavigate() {
  const navigate = useCallback(
    (to: string, options?: { replace?: boolean; state?: unknown }) => {
      if (options?.replace) {
        window.history.replaceState(options.state || {}, "", to);
      } else {
        window.history.pushState(options?.state || {}, "", to);
      }
      // Dispatch a popstate event so the app can react
      window.dispatchEvent(new PopStateEvent("popstate"));
    },
    []
  );

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return { navigate, goBack };
}
