/**
 * FinanceScheduleWidget — Finance Scheduling Integration
 *
 * Displays finance-related schedules:
 * - Invoice follow-ups
 * - Collection reminders
 * - Cheque deposit dates
 * - Salary processing dates
 * - GST/Tax filing deadlines
 * - Vendor payment schedules
 * - Customer meetings
 *
 * Uses ScheduleWidget with finance-specific filters and icons.
 * Every module must consume this instead of maintaining its own schedule logic.
 */

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate } from "react-router";
import {
  DollarSign, CreditCard, Landmark, Receipt, Calendar,
  TrendingUp, ArrowUpRight, ArrowDownRight, Clock,
  FileText, AlertTriangle, CheckCircle, Loader2,
} from "lucide-react";
import ScheduleWidget, { SCHEDULE_TYPE_CONFIG } from "@/components/scheduling/ScheduleWidget";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Finance-specific schedule types ──────────────────────────────

export const FINANCE_SCHEDULE_TYPES = {
  invoice_followup: { label: "Invoice Follow-up", color: "#4285f4", icon: Receipt },
  collection_reminder: { label: "Collection Reminder", color: "#34a853", icon: CreditCard },
  cheque_deposit: { label: "Cheque Deposit", color: "#1a73e8", icon: Landmark },
  cheque_clearance: { label: "Cheque Clearance", color: "#1557b0", icon: Landmark },
  salary_processing: { label: "Salary Processing", color: "#ea4335", icon: DollarSign },
  gst_filing: { label: "GST Filing", color: "#f59e0b", icon: FileText },
  tax_filing: { label: "Tax Filing", color: "#e8710a", icon: FileText },
  vendor_payment: { label: "Vendor Payment", color: "#5f6368", icon: ArrowUpRight },
  customer_meeting: { label: "Customer Meeting", color: "#a855f7", icon: Calendar },
  budget_review: { label: "Budget Review", color: "#06b6d4", icon: TrendingUp },
  financial_report: { label: "Financial Report", color: "#14b8a6", icon: FileText },
};

// ─── Finance Schedule Widget ──────────────────────────────────────

interface FinanceScheduleWidgetProps {
  companyId?: string;
  branchId?: string;
  limit?: number;
  showToday?: boolean;
  compact?: boolean;
  sidebar?: boolean;
  onScheduleClick?: (scheduleId: string) => void;
}

export default function FinanceScheduleWidget({
  companyId, branchId, limit = 5, showToday,
  compact, sidebar, onScheduleClick,
}: FinanceScheduleWidgetProps) {
  const navigate = useNavigate();

  // Fetch finance schedules using the scheduling SDK
  const schedules = useQuery(
    (api.schedulingSdk.getByDateRange as any),
    {
      start: Date.now(),
      end: Date.now() + 30 * 24 * 60 * 60 * 1000,
      companyId: companyId as any,
      branchId: branchId as any,
      limit: limit || 20,
    },
  ) as any[] | undefined;

  const financeTypes = Object.keys(FINANCE_SCHEDULE_TYPES);

  // Filter to finance-related schedules only
  const financeSchedules = useMemo(() => {
    if (!schedules) return [];
    return schedules.filter((s: any) =>
      financeTypes.includes(s.scheduleType) || s.tags?.some((t: string) => t.startsWith("finance"))
    ).slice(0, limit);
  }, [schedules, limit]);

  // Delegate to ScheduleWidget with finance type filter
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <DollarSign className="h-3.5 w-3.5 text-[#34a853]" />
          <h3 className="text-[12px] font-semibold text-[#1a1a2e]">Finance Schedule</h3>
          {financeSchedules.length > 0 && (
            <Badge variant="secondary" className="text-[9px] h-4">{financeSchedules.length}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-[#1a73e8]"
          onClick={() => navigate("/scheduling")}
        >
          View All
        </Button>
      </div>

      {financeSchedules.length === 0 ? (
        <div className="text-center py-6 bg-white rounded-lg border border-[#e8eaed]">
          <DollarSign className="h-6 w-6 text-[#9aa0a6] mx-auto mb-2" />
          <p className="text-[11px] text-[#5f6368]">No finance schedules</p>
          <p className="text-[9px] text-[#9aa0a6] mt-0.5">Invoice follow-ups, payments, and deadlines will appear here</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {financeSchedules.map((s: any) => {
            const config = FINANCE_SCHEDULE_TYPES[s.scheduleType as keyof typeof FINANCE_SCHEDULE_TYPES] ||
              SCHEDULE_TYPE_CONFIG[s.scheduleType] ||
              { label: s.scheduleType, color: "#9aa0a6", icon: Calendar };
            const Icon = config.icon || Calendar;

            return (
              <div
                key={s._id}
                onClick={() => onScheduleClick ? onScheduleClick(s._id) : navigate(`/scheduling/${s._id}`)}
                className="flex items-center gap-2.5 p-2 rounded-lg border border-[#e8eaed] bg-white hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="p-1.5 rounded-full shrink-0" style={{ backgroundColor: `${config.color}12` }}>
                  <Icon className="h-3 w-3" style={{ color: config.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{s.title}</p>
                  <p className="text-[9px] text-[#5f6368]">
                    {s.start ? new Date(s.start).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                    {" · "}
                    <span style={{ color: config.color }}>{config.label}</span>
                  </p>
                </div>
                {s.status === "pending_approval" && (
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 text-amber-600 border-amber-200">Pending</Badge>
                )}
                {s.status === "completed" && (
                  <CheckCircle className="h-3 w-3 text-[#34a853] shrink-0" />
                )}
                {s.status === "cancelled" && (
                  <AlertTriangle className="h-3 w-3 text-[#ea4335] shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Finance Deadline Cards ──────────────────────────────────────

export function FinanceDeadlineCards({ companyId, branchId }: { companyId?: string; branchId?: string }) {
  const schedules = useQuery(
    (api.schedulingSdk.getUpcoming as any),
    { days: 30, companyId: companyId as any, branchId: branchId as any },
  ) as any[] | undefined;

  const deadlines = useMemo(() => {
    if (!schedules) return [];
    const now = Date.now();
    return schedules
      .filter((s: any) => Object.keys(FINANCE_SCHEDULE_TYPES).includes(s.scheduleType) || s.tags?.includes("finance"))
      .map((s: any) => ({
        ...s,
        daysUntil: Math.ceil((s.start - now) / (24 * 60 * 60 * 1000)),
        urgency:
          s.start - now < 24 * 60 * 60 * 1000 ? "critical" :
          s.start - now < 3 * 24 * 60 * 60 * 1000 ? "warning" : "normal",
      }))
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 4);
  }, [schedules]);

  if (!schedules) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-[#9aa0a6]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {deadlines.map((d: any) => (
        <Card key={d._id} className={cn(
          "p-2.5 border cursor-pointer hover:shadow-sm transition-all",
          d.urgency === "critical" ? "border-red-200 bg-red-50" :
          d.urgency === "warning" ? "border-yellow-200 bg-yellow-50" :
          "border-[#e8eaed]"
        )}>
          <p className="text-[10px] font-medium text-[#1a1a2e] truncate">{d.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Clock className="h-2.5 w-2.5 text-[#9aa0a6]" />
            <span className={cn(
              "text-[9px] font-medium",
              d.urgency === "critical" ? "text-red-600" :
              d.urgency === "warning" ? "text-yellow-600" : "text-[#5f6368]"
            )}>
              {d.daysUntil <= 0 ? "Today" : `${d.daysUntil}d`}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ─── Finance Calendar Quick View ──────────────────────────────────

export function FinanceCalendarQuickView() {
  const navigate = useNavigate();

  const upcomingFinancialEvents = [
    { date: "15th", label: "Salary Processing", type: "payment", icon: DollarSign, color: "#ea4335" },
    { date: "20th", label: "GST Filing", type: "filing", icon: FileText, color: "#f59e0b" },
    { date: "25th", label: "Vendor Payments", type: "payment", icon: ArrowUpRight, color: "#5f6368" },
    { date: "30th", label: "Financial Report", type: "report", icon: TrendingUp, color: "#14b8a6" },
  ];

  return (
    <div className="space-y-1.5">
      {upcomingFinancialEvents.map((event) => (
        <button
          key={event.label}
          className="w-full flex items-center gap-2.5 p-2 rounded-lg border border-[#e8eaed] bg-white hover:shadow-sm transition-all text-left"
          onClick={() => navigate("/finance")}
        >
          <div className="w-8 h-8 rounded-lg bg-[#f8f9fa] flex flex-col items-center justify-center shrink-0">
            <span className="text-[8px] font-bold text-[#5f6368]">{event.date}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[#1a1a2e]">{event.label}</p>
            <p className="text-[9px] text-[#5f6368]">Monthly recurring</p>
          </div>
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${event.color}12` }}>
            <event.icon className="h-3 w-3" style={{ color: event.color }} />
          </div>
        </button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full h-7 text-[10px] text-[#1a73e8]"
        onClick={() => navigate("/finance/reports")}
      >
        View Financial Calendar
      </Button>
    </div>
  );
}
