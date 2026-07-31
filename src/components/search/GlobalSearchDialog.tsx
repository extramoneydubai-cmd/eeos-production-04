import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import { Search, GraduationCap, Users, FileText, BookOpen, Ticket, DollarSign, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const entityIcons: Record<string, any> = {
  student: GraduationCap,
  lead: User,
  employee: Users,
  ticket: Ticket,
  knowledge: BookOpen,
  invoice: DollarSign,
  user: Users,
};

const entityColors: Record<string, string> = {
  student: "text-blue-500 bg-blue-50",
  lead: "text-purple-500 bg-purple-50",
  employee: "text-green-500 bg-green-50",
  ticket: "text-amber-500 bg-amber-50",
  knowledge: "text-indigo-500 bg-indigo-50",
  invoice: "text-emerald-500 bg-emerald-50",
  user: "text-gray-500 bg-gray-50",
};

export function GlobalSearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState<string | null>(null);
  const navigate = useNavigate();

  const results = useQuery(api.searchEngine.globalSearch, query.length >= 2 ? { query, limit: 15 } : "skip");

  const filteredResults = entityFilter ? (results || []).filter((r: any) => r.entityType === entityFilter) : results;

  const handleSelect = useCallback((url: string) => {
    onOpenChange(false);
    navigate(url);
  }, [navigate, onOpenChange]);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/20" onClick={() => onOpenChange(false)} />
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <Command className="rounded-lg border shadow-2xl bg-white overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search students, leads, articles, tickets..."
              className="flex-1 h-11 px-2 text-sm outline-none bg-transparent"
              autoFocus
            />
            {query.length >= 2 && <span className="text-[10px] text-gray-400 mr-2">{results?.length || 0} results</span>}
          </div>

          {/* Entity type filters */}
          {query.length >= 2 && (
            <div className="flex gap-1 px-3 py-2 border-b overflow-x-auto">
              {["student", "lead", "employee", "ticket", "knowledge", "invoice"].map((type) => {
                const Icon = entityIcons[type] || Search;
                const color = entityColors[type] || "text-gray-500 bg-gray-50";
                return (
                  <button
                    key={type}
                    onClick={() => setEntityFilter(entityFilter === type ? null : type)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                      entityFilter === type ? `${color} ring-1` : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="h-3 w-3" /> {type}
                  </button>
                );
              })}
              {entityFilter && <button onClick={() => setEntityFilter(null)} className="text-[10px] text-gray-400 hover:text-gray-600 ml-1">Clear</button>}
            </div>
          )}

          <Command.List className="max-h-72 overflow-y-auto">
            {query.length < 2 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                Type at least 2 characters to search
              </div>
            ) : !results ? (
              <div className="py-8 text-center text-sm text-gray-400">
                <Loader2 className="h-6 w-6 mx-auto animate-spin mb-2" />
                Searching...
              </div>
            ) : filteredResults && filteredResults.length > 0 ? (
              filteredResults.map((result: any) => {
                const Icon = entityIcons[result.entityType] || Search;
                const color = entityColors[result.entityType] || "text-gray-500 bg-gray-50";
                return (
                  <Command.Item
                    key={`${result.entityType}-${result.id}`}
                    onSelect={() => handleSelect(result.url)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 border-b last:border-0 data-[selected]:bg-blue-50"
                  >
                    <div className={`p-1.5 rounded-md ${color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{result.title}</div>
                      <div className="text-xs text-gray-400 truncate">{result.subtitle}</div>
                    </div>
                    <div className="text-[10px] text-gray-300 capitalize shrink-0">{result.entityType}</div>
                  </Command.Item>
                );
              })
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No results found for "{query}"
              </div>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

export function GlobalSearchButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-[#5f6368] hover:text-[#1a1a2e] hover:bg-[#f1f3f4]"
        onClick={() => setOpen(true)}
        title="Search (Cmd+K)"
      >
        <Search className="h-4 w-4" />
      </Button>
      <GlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
