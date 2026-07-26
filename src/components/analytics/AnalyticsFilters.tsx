import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Filter, RefreshCw, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface AnalyticsFilterValues {
  companyId?: string;
  branchId?: string;
  departmentId?: string;
  dateFrom?: number;
  dateTo?: number;
  comparePeriod?: string;
  status?: string;
}

interface AnalyticsFiltersProps {
  values: AnalyticsFilterValues;
  onChange: (values: AnalyticsFilterValues) => void;
  onRefresh?: () => void;
  branchOptions?: { id: string; name: string }[];
  departmentOptions?: { id: string; name: string }[];
  className?: string;
}

const presets = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 30 Days", days: 30 },
  { label: "This Month", days: undefined, month: true },
  { label: "Last Month", days: undefined, prevMonth: true },
  { label: "This Quarter", days: undefined, quarter: true },
  { label: "This Year", days: undefined, year: true },
  { label: "Custom", days: undefined, custom: true },
] as const;

export const AnalyticsFilters = memo(function AnalyticsFilters({
  values,
  onChange,
  onRefresh,
  branchOptions,
  departmentOptions,
  className,
}: AnalyticsFiltersProps) {
  const [datePreset, setDatePreset] = useState("custom");
  const [dateOpen, setDateOpen] = useState(false);

  const handlePreset = (preset: string) => {
    setDatePreset(preset);
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    let dateFrom: number | undefined;
    let dateTo: number | undefined = now;

    switch (preset) {
      case "today": dateFrom = todayTs; break;
      case "yesterday": dateFrom = todayTs - 86400000; dateTo = todayTs; break;
      case "last7": dateFrom = todayTs - 7 * 86400000; break;
      case "last30": dateFrom = todayTs - 30 * 86400000; break;
      case "thisMonth": dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).getTime(); break;
      case "lastMonth": {
        const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        dateFrom = lm.getTime();
        dateTo = new Date(today.getFullYear(), today.getMonth(), 0).getTime();
        break;
      }
      case "thisQuarter": {
        const q = Math.floor(today.getMonth() / 3);
        dateFrom = new Date(today.getFullYear(), q * 3, 1).getTime();
        break;
      }
      case "thisYear": dateFrom = new Date(today.getFullYear(), 0, 1).getTime(); break;
      default: dateFrom = todayTs - 30 * 86400000;
    }

    onChange({ ...values, dateFrom, dateTo });
  };

  const activeFilters = [
    values.branchId && "Branch",
    values.departmentId && "Department",
    values.dateFrom && "Date Range",
    values.status && "Status",
  ].filter(Boolean);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* Date Presets */}
      {presets.map((p) => (
        <Button
          key={p.label}
          variant={datePreset === p.label.toLowerCase().replace(/\s+/g, "") ? "default" : "outline"}
          size="sm"
          className="h-7 text-[11px] px-2"
          onClick={() => handlePreset(p.label.toLowerCase().replace(/\s+/g, ""))}
        >
          {p.label}
        </Button>
      ))}

      {/* Custom Date Picker */}
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 gap-1">
            <CalendarIcon className="h-3 w-3" />
            {values.dateFrom ? format(new Date(values.dateFrom), "MMM dd") : "From"}
            {" - "}
            {values.dateTo ? format(new Date(values.dateTo), "MMM dd") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2" align="start">
          <div className="space-y-2">
            <div>
              <Label className="text-[10px]">From</Label>
              <Input
                type="date"
                className="h-8 text-[12px]"
                value={values.dateFrom ? format(new Date(values.dateFrom), "yyyy-MM-dd") : ""}
                onChange={(e) => onChange({ ...values, dateFrom: e.target.value ? new Date(e.target.value).getTime() : undefined })}
              />
            </div>
            <div>
              <Label className="text-[10px]">To</Label>
              <Input
                type="date"
                className="h-8 text-[12px]"
                value={values.dateTo ? format(new Date(values.dateTo), "yyyy-MM-dd") : ""}
                onChange={(e) => onChange({ ...values, dateTo: e.target.value ? new Date(e.target.value).getTime() : undefined })}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Branch Filter */}
      {branchOptions && (
        <Select
          value={values.branchId || "all"}
          onValueChange={(v) => onChange({ ...values, branchId: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-7 text-[11px] w-[140px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[12px]">All Branches</SelectItem>
            {branchOptions.map((b) => (
              <SelectItem key={b.id} value={b.id} className="text-[12px]">{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Department Filter */}
      {departmentOptions && (
        <Select
          value={values.departmentId || "all"}
          onValueChange={(v) => onChange({ ...values, departmentId: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="h-7 text-[11px] w-[140px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-[12px]">All Departments</SelectItem>
            {departmentOptions.map((d) => (
              <SelectItem key={d.id} value={d.id} className="text-[12px]">{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status Filter */}
      <Select
        value={values.status || "all"}
        onValueChange={(v) => onChange({ ...values, status: v === "all" ? undefined : v })}
      >
        <SelectTrigger className="h-7 text-[11px] w-[100px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-[12px]">All Status</SelectItem>
          <SelectItem value="active" className="text-[12px]">Active</SelectItem>
          <SelectItem value="pending" className="text-[12px]">Pending</SelectItem>
          <SelectItem value="completed" className="text-[12px]">Completed</SelectItem>
          <SelectItem value="cancelled" className="text-[12px]">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      {/* Active Filters Badge */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-1 text-[10px] text-[#5f6368] bg-[#f1f3f4] px-2 py-1 rounded-md">
          <Filter className="h-3 w-3" />
          <span>{activeFilters.length} active</span>
          <button
            onClick={() => onChange({})}
            className="ml-1 hover:text-[#1a1a2e]"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Refresh */}
      {onRefresh && (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-auto" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
});
