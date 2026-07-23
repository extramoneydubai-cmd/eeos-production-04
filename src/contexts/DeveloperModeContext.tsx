import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useLocation } from "react-router";
import { platformPages } from "@/lib/platform-studio-data";
import { useAuth } from "@/hooks/use-auth";

export interface DevModePageInfo {
  pageId: string;
  route: string;
  filePath: string;
  componentIds: string[];
  apiNames: string[];
  databaseTables: string[];
  permissionScope: string;
}

interface DeveloperModeContextType {
  enabled: boolean;
  toggle: () => void;
  currentPageInfo: DevModePageInfo | null;
}

const DeveloperModeContext = createContext<DeveloperModeContextType>({
  enabled: false,
  toggle: () => {},
  currentPageInfo: null,
});

export function useDeveloperMode() {
  return useContext(DeveloperModeContext);
}

const STORAGE_KEY = "eeos:dev-mode";

export function DeveloperModeProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });
  const location = useLocation();
  const { user } = useAuth();
  const [currentPageInfo, setCurrentPageInfo] = useState<DevModePageInfo | null>(null);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        sessionStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      } catch {}
      return next;
    });
  }, []);

  // Ctrl+Shift+D toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  // Derive current page info from route path
  useEffect(() => {
    const path = location.pathname;
    // Match against page routes (from most specific to least)
    const sorted = [...platformPages].sort((a, b) => b.route.length - a.route.length);
    const match = sorted.find((p) => {
      // Convert route pattern to regex for matching dynamic segments
      const pattern = p.route.replace(/:\w+/g, "[^/]+");
      return new RegExp(`^${pattern}$`).test(path);
    });

    if (match) {
      setCurrentPageInfo({
        pageId: match.id,
        route: match.route,
        filePath: match.filePath,
        componentIds: match.sections.map((s) => s.id),
        apiNames: [...match.queries, ...match.mutations],
        databaseTables: match.tables,
        permissionScope: match.permissions.join(", "),
      });
    } else {
      setCurrentPageInfo(null);
    }
  }, [location.pathname]);

  // Show badge when dev mode is on
  useEffect(() => {
    if (enabled) {
      const badge = document.createElement("div");
      badge.id = "eeos-dev-mode-badge";
      badge.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:99999;background:#ea4335;color:white;text-align:center;font-size:10px;font-weight:600;padding:2px 0;letter-spacing:1px;text-transform:uppercase;";
      badge.textContent = "⚠ Developer Mode Active — Ctrl+Shift+D to toggle";
      document.body.prepend(badge);
      document.body.style.paddingTop = "18px";
    } else {
      const badge = document.getElementById("eeos-dev-mode-badge");
      if (badge) badge.remove();
      document.body.style.paddingTop = "";
    }
    return () => {
      const badge = document.getElementById("eeos-dev-mode-badge");
      if (badge) badge.remove();
      document.body.style.paddingTop = "";
    };
  }, [enabled]);

  return (
    <DeveloperModeContext.Provider value={{ enabled, toggle, currentPageInfo }}>
      {children}
      {enabled && currentPageInfo && (
        <div
          className="fixed bottom-20 right-4 z-[9999] bg-[#1a1a2e] text-white rounded-lg shadow-2xl border border-[#333] text-[11px] max-w-[300px] backdrop-blur-sm"
          style={{ opacity: 0.95 }}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#333]">
            <span className="font-semibold text-[10px] uppercase tracking-wider text-[#fbbc04]">Dev Info</span>
            <span className="text-[9px] text-[#9aa0a6]">Ctrl+Shift+D</span>
          </div>
          <div className="p-3 space-y-1.5">
            <InfoRow label="Page ID" value={currentPageInfo.pageId} />
            <InfoRow label="Route" value={currentPageInfo.route} />
            <InfoRow label="File" value={currentPageInfo.filePath.split("/").pop() || ""} />
            <InfoRow label="Components" value={`${currentPageInfo.componentIds.length} IDs`} />
            <InfoRow label="APIs" value={`${currentPageInfo.apiNames.length} endpoints`} />
            <InfoRow label="Tables" value={`${currentPageInfo.databaseTables.length} tables`} />
            <InfoRow label="Access" value={currentPageInfo.permissionScope} />
          </div>
        </div>
      )}
    </DeveloperModeContext.Provider>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[#9aa0a6] shrink-0">{label}:</span>
      <span className="text-right font-mono text-[10px] truncate max-w-[180px]" title={value}>
        {value}
      </span>
    </div>
  );
}
