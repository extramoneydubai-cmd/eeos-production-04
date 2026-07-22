import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { routes } from "@/lib/routes";
import { appConfig } from "@/config/app";
import { LayoutDashboard, ArrowRight, Search } from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      setSearch("");
      navigate(href);
    },
    [navigate, onOpenChange],
  );

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    function down(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const visibleRoutes = routes.filter((r) => r.visible);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages, modules, or type a command..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick actions */}
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleSelect("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleSelect("/settings")}>
            <ArrowRight className="mr-2 h-4 w-4" />
            <span>Go to Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Studios */}
        <CommandGroup heading="Studios">
          {visibleRoutes
            .filter((r) => r.group === "Studios")
            .map((route) => (
              <CommandItem
                key={route.href}
                onSelect={() => handleSelect(route.href)}
              >
                <route.icon className="mr-2 h-4 w-4" />
                <span>{route.label}</span>
                {route.isPlaceholder && (
                  <span className="ml-auto text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                    Coming Soon
                  </span>
                )}
              </CommandItem>
            ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Business Modules */}
        <CommandGroup heading="Business Modules">
          {visibleRoutes
            .filter((r) => r.group === "Business Modules")
            .map((route) => (
              <CommandItem
                key={route.href}
                onSelect={() => handleSelect(route.href)}
              >
                <route.icon className="mr-2 h-4 w-4" />
                <span>{route.label}</span>
                {route.isPlaceholder && (
                  <span className="ml-auto text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                    Coming Soon
                  </span>
                )}
              </CommandItem>
            ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/** Trigger button shown in the header */
export function CommandPaletteTrigger({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/60 border border-border/50 rounded-sm hover:text-foreground hover:border-border transition-colors duration-200"
    >
      <Search className="h-3 w-3" />
      <span className="hidden sm:inline">Search...</span>
      <kbd className="hidden sm:inline-flex ml-2 h-4 min-w-[16px] items-center justify-center rounded-[2px] bg-muted px-1 text-[9px] text-muted-foreground/60 font-mono">
        ⌘K
      </kbd>
    </button>
  );
}
