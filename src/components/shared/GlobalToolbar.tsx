import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/data/SearchBar";
import { RefreshCw, Download, Upload, Settings, HelpCircle } from "lucide-react";
import type { ReactNode } from "react";

interface GlobalToolbarProps {
  /** Search value */
  search: string;
  /** Search change handler */
  onSearch: (value: string) => void;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Optional primary actions (e.g. "Add" button) */
  actions?: ReactNode;
  /** Optional filter bar to show after search */
  filters?: ReactNode;
  /** Refresh handler */
  onRefresh?: () => void;
  /** Export handler */
  onExport?: () => void;
  /** Import handler */
  onImport?: () => void;
  /** Settings handler */
  onSettings?: () => void;
  /** Help handler */
  onHelp?: () => void;
}

export function GlobalToolbar({
  search,
  onSearch,
  searchPlaceholder = "Search...",
  actions,
  filters,
  onRefresh,
  onExport,
  onImport,
  onSettings,
  onHelp,
}: GlobalToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <SearchBar
            value={search}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            className="flex-1 max-w-xs"
          />
        </div>

        <div className="flex items-center gap-1">
          {/* Toolbar action buttons */}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onRefresh}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          {onExport && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onExport}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Export"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          {onImport && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onImport}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Import"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
          )}
          {onSettings && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onSettings}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Settings"
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          )}
          {onHelp && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onHelp}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Help"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Primary actions slot */}
          {actions && (
            <div className="flex items-center gap-2 ml-2 border-l border-border/50 pl-2">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Filter bar slot */}
      {filters && <div>{filters}</div>}
    </div>
  );
}
