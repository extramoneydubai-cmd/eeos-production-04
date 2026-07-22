import { useCallback } from "react";
import { useNavigate } from "react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { routes } from "@/lib/routes";
import { Search } from "lucide-react";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      navigate(href);
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {routes
          .filter((r) => r.visible)
          .reduce<string[]>((groups, r) => {
            if (!groups.includes(r.group)) groups.push(r.group);
            return groups;
          }, [])
          .map((group) => (
            <CommandGroup key={group} heading={group}>
              {routes
                .filter((r) => r.visible && r.group === group)
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
          ))}
      </CommandList>
    </CommandDialog>
  );
}
