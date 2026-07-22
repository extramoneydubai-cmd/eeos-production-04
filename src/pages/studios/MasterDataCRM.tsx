import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  Home,
  Layers,
  Radio,
  Tags,
  XCircle,
  Flag,
  Phone,
  Megaphone,
  Search,
  Upload,
  Download,
  ArrowRight,
  ChevronDown,
  Target,
  Globe,
  Link,
  CheckCircle,
  HelpCircle,
  UserPlus,
  Handshake,
  Headphones,
  ClipboardList,
  Thermometer,
  Percent,
  Users,
  Sparkles,
  Building,
} from "lucide-react";

/* ── Data ── */

const overviewCards = [
  {
    id: "lead-stages",
    title: "Lead Stages",
    description: "Pipeline stages for lead progression",
    icon: Layers,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 5,
    activeRecords: 5,
    href: "/crm/settings/stages",
    isPlaceholder: false,
  },
  {
    id: "lead-sources",
    title: "Lead Sources",
    description: "Enquiry source channels",
    icon: Radio,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 8,
    activeRecords: 7,
    href: "/studios/master-data/crm/lead-sources",
    isPlaceholder: false,
  },
  {
    id: "lead-tags",
    title: "Lead Tags",
    description: "Reusable lead labels",
    icon: Tags,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#fbbc04]",
    totalRecords: 12,
    activeRecords: 10,
    href: "/studios/master-data/crm/lead-tags",
    isPlaceholder: false,
  },
  {
    id: "lost-reasons",
    title: "Lost Reasons",
    description: "Reasons for lost leads",
    icon: XCircle,
    color: "bg-[#fce8e6]",
    iconColor: "text-[#ea4335]",
    totalRecords: 6,
    activeRecords: 6,
    href: "/studios/master-data/crm/lost-reasons",
    isPlaceholder: false,
  },
  {
    id: "lead-priorities",
    title: "Lead Priorities",
    description: "Hot / Warm / Cold tiers",
    icon: Flag,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 3,
    activeRecords: 3,
    href: "/studios/master-data/crm/lead-priorities",
    isPlaceholder: false,
  },
  {
    id: "campaign-channels",
    title: "Campaign Channels",
    description: "Marketing campaign channels",
    icon: Megaphone,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 16,
    activeRecords: 16,
    href: "/studios/master-data/crm/campaign-channels",
    isPlaceholder: false,
  },
  {
    id: "campaign-types",
    title: "Campaign Types",
    description: "Marketing campaign purpose and categories",
    icon: Target,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 15,
    activeRecords: 15,
    href: "/studios/master-data/crm/campaign-types",
    isPlaceholder: false,
  },
  {
    id: "marketing-channels",
    title: "Marketing Channels",
    description: "Marketing channel classifications",
    icon: Globe,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 15,
    activeRecords: 15,
    href: "/studios/master-data/crm/marketing-channels",
    isPlaceholder: false,
  },
  {
    id: "utm-sources",
    title: "UTM Sources",
    description: "UTM source values for campaign tracking",
    icon: Link,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#fbbc04]",
    totalRecords: 12,
    activeRecords: 12,
    href: "/studios/master-data/crm/utm-sources",
    isPlaceholder: false,
  },
  {
    id: "utm-mediums",
    title: "UTM Mediums",
    description: "Standard UTM medium values",
    icon: Radio,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 12,
    activeRecords: 12,
    href: "/studios/master-data/crm/utm-mediums",
    isPlaceholder: false,
  },
  {
    id: "utm-campaigns",
    title: "UTM Campaigns",
    description: "Reusable campaign naming library",
    icon: Flag,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 10,
    activeRecords: 10,
    href: "/studios/master-data/crm/utm-campaigns",
    isPlaceholder: false,
  },
  {
    id: "follow-up-types",
    title: "Follow-up Types",
    description: "Lead follow-up methods and categories",
    icon: Phone,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 15,
    activeRecords: 15,
    href: "/studios/master-data/crm/follow-up-types",
    isPlaceholder: false,
  },
  {
    id: "follow-up-outcomes",
    title: "Follow-up Outcomes",
    description: "Follow-up outcome codes and classifications",
    icon: CheckCircle,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 15,
    activeRecords: 15,
    href: "/studios/master-data/crm/follow-up-outcomes",
    isPlaceholder: false,
  },
  {
    id: "enquiry-types",
    title: "Enquiry Types",
    description: "Enquiry type classifications",
    icon: HelpCircle,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 12,
    activeRecords: 12,
    href: "/studios/master-data/crm/enquiry-types",
    isPlaceholder: false,
  },
  {
    id: "referral-sources",
    title: "Referral Sources",
    description: "Referral source channels and categories",
    icon: UserPlus,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#d4a017]",
    totalRecords: 14,
    activeRecords: 14,
    href: "/studios/master-data/crm/referral-sources",
    isPlaceholder: false,
  },
  {
    id: "counselling-types",
    title: "Counselling Types",
    description: "Counselling session types and modes",
    icon: Headphones,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#0d9488]",
    totalRecords: 10,
    activeRecords: 10,
    href: "/studios/master-data/crm/counselling-types",
    isPlaceholder: false,
  },
  {
    id: "counselling-outcomes",
    title: "Counselling Outcomes",
    description: "Counselling session outcome codes and actions",
    icon: ClipboardList,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 10,
    activeRecords: 10,
    href: "/studios/master-data/crm/counselling-outcomes",
    isPlaceholder: false,
  },
  {
    id: "lead-qualification",
    title: "Lead Qualification",
    description: "Lead qualification levels and scoring thresholds",
    icon: Thermometer,
    color: "bg-[#fce8e6]",
    iconColor: "text-[#ea4335]",
    totalRecords: 8,
    activeRecords: 8,
    href: "/studios/master-data/crm/lead-qualification",
    isPlaceholder: false,
  },
  {
    id: "lead-scoring-rules",
    title: "Lead Scoring Rules",
    description: "Scoring rules and point values for lead scoring",
    icon: Percent,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 12,
    activeRecords: 12,
    href: "/studios/master-data/crm/lead-scoring-rules",
    isPlaceholder: false,
  },
  {
    id: "lead-categories",
    title: "Lead Categories",
    description: "Lead category classifications for segmenting prospects",
    icon: Users,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 12,
    activeRecords: 12,
    href: "/studios/master-data/crm/lead-categories",
    isPlaceholder: false,
  },
];

const moduleCards = [
  {
    id: "lead-stages",
    title: "Lead Stages",
    description: "Configure the complete lead pipeline.",
    icon: Layers,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/crm/settings/stages",
    isPlaceholder: false,
  },
  {
    id: "lead-sources",
    title: "Lead Sources",
    description: "Configure enquiry sources.",
    icon: Radio,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/crm/lead-sources",
    isPlaceholder: false,
  },
  {
    id: "lead-tags",
    title: "Lead Tags",
    description: "Manage reusable lead labels.",
    icon: Tags,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#fbbc04]",
    status: "active" as const,
    href: "/studios/master-data/crm/lead-tags",
    isPlaceholder: false,
  },
  {
    id: "lost-reasons",
    title: "Lost Reasons",
    description: "Configure reasons for lost leads.",
    icon: XCircle,
    color: "bg-[#fce8e6]",
    iconColor: "text-[#ea4335]",
    status: "active" as const,
    href: "/studios/master-data/crm/lost-reasons",
    isPlaceholder: false,
  },
  {
    id: "lead-priorities",
    title: "Lead Priorities",
    description: "Manage Hot/Warm/Cold priorities.",
    icon: Flag,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/crm/lead-priorities",
    isPlaceholder: false,
  },
  {
    id: "campaign-channels",
    title: "Campaign Channels",
    description: "Manage marketing campaign channels.",
    icon: Megaphone,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/crm/campaign-channels",
    isPlaceholder: false,
  },
  {
    id: "campaign-types",
    title: "Campaign Types",
    description: "Manage marketing campaign types.",
    icon: Target,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/crm/campaign-types",
    isPlaceholder: false,
  },
  {
    id: "marketing-channels",
    title: "Marketing Channels",
    description: "Manage marketing channel classifications.",
    icon: Globe,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/crm/marketing-channels",
    isPlaceholder: false,
  },
  {
    id: "utm-sources",
    title: "UTM Sources",
    description: "Manage UTM source values.",
    icon: Link,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#fbbc04]",
    status: "active" as const,
    href: "/studios/master-data/crm/utm-sources",
    isPlaceholder: false,
  },
  {
    id: "utm-mediums",
    title: "UTM Mediums",
    description: "Manage UTM medium values.",
    icon: Radio,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/crm/utm-mediums",
    isPlaceholder: false,
  },
  {
    id: "utm-campaigns",
    title: "UTM Campaigns",
    description: "Manage reusable campaign names.",
    icon: Flag,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/crm/utm-campaigns",
    isPlaceholder: false,
  },
  {
    id: "follow-up-types",
    title: "Follow-up Types",
    description: "Manage lead follow-up methods.",
    icon: Phone,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/crm/follow-up-types",
    isPlaceholder: false,
  },
  {
    id: "follow-up-outcomes",
    title: "Follow-up Outcomes",
    description: "Manage follow-up outcome codes.",
    icon: CheckCircle,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/crm/follow-up-outcomes",
    isPlaceholder: false,
  },
  {
    id: "enquiry-types",
    title: "Enquiry Types",
    description: "Manage enquiry type classifications.",
    icon: HelpCircle,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/crm/enquiry-types",
    isPlaceholder: false,
  },
  {
    id: "referral-sources",
    title: "Referral Sources",
    description: "Manage referral source channels.",
    icon: UserPlus,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#d4a017]",
    status: "active" as const,
    href: "/studios/master-data/crm/referral-sources",
    isPlaceholder: false,
  },
  {
    id: "counselling-types",
    title: "Counselling Types",
    description: "Manage counselling session types.",
    icon: Headphones,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#0d9488]",
    status: "active" as const,
    href: "/studios/master-data/crm/counselling-types",
    isPlaceholder: false,
  },
  {
    id: "counselling-outcomes",
    title: "Counselling Outcomes",
    description: "Manage counselling session outcomes.",
    icon: ClipboardList,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/crm/counselling-outcomes",
    isPlaceholder: false,
  },
  {
    id: "lead-qualification",
    title: "Lead Qualification",
    description: "Manage lead qualification levels.",
    icon: Thermometer,
    color: "bg-[#fce8e6]",
    iconColor: "text-[#ea4335]",
    status: "active" as const,
    href: "/studios/master-data/crm/lead-qualification",
    isPlaceholder: false,
  },
  {
    id: "lead-scoring-rules",
    title: "Lead Scoring Rules",
    description: "Manage lead scoring rule definitions.",
    icon: Percent,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/crm/lead-scoring-rules",
    isPlaceholder: false,
  },
  {
    id: "lead-categories",
    title: "Lead Categories",
    description: "Manage lead category classifications.",
    icon: Users,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/crm/lead-categories",
    isPlaceholder: false,
  },
  {
    id: "industries", title: "Industries", description: "Define industry sectors for lead and organization classification.",
    icon: Building, color: "bg-[#fef7e0]", iconColor: "text-[#e8710a]", status: "active" as const, href: "/studios/master-data/crm/industries",    isPlaceholder: false,
  },
];

const futureModules = [
  "Lead Status",
  "Lead Types",
  "Counselor Categories",
  "Demo Outcomes",
  "Call Outcomes",
  "Admission Status",
  "Communication Templates",
];

/* ── Helpers ── */

function OverviewStatCard({
  title,
  description,
  icon: Icon,
  color,
  iconColor,
  totalRecords,
  activeRecords,
  href,
  isPlaceholder,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconColor: string;
  totalRecords: number;
  activeRecords: number;
  href: string;
  isPlaceholder: boolean;
}) {
  const { navigate } = useAppNavigate();
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-[12px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-[11px] text-[#9aa0a6] leading-snug">{description}</p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-[#5f6368]">
                Total: <span className="font-semibold text-[#1a1a2e]">{totalRecords}</span>
              </span>
              <span className="text-[11px] text-[#5f6368]">
                Active: <span className="font-semibold text-[#34a853]">{activeRecords}</span>
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`mt-2 h-6 text-[10px] font-medium px-0 ${
                isPlaceholder
                  ? "text-[#9aa0a6] cursor-not-allowed"
                  : "text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe]"
              }`}
              onClick={() => {
                if (!isPlaceholder) window.location.href = href;
              }}
              disabled={isPlaceholder}
            >
              Open
              <ArrowRight className="h-2.5 w-2.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
          <div className={`p-2 rounded-lg ${color} shrink-0 ml-3`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Page ── */

export default function MasterDataCRM() {
  const { navigate } = useAppNavigate();
  const [futureOpen, setFutureOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/studios/master-data">Master Data Studio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>CRM Masters</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1a73e8] flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">CRM Masters</h1>
          </div>
          <p className="text-[13px] text-[#5f6368] mt-1.5">
            Manage all CRM business configurations from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6] pointer-events-none" />
            <Input
              placeholder="Search..."
              className="h-8 w-40 text-[12px] pl-8 border-[#e8eaed] rounded-md"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 text-[12px] border-[#e8eaed] text-[#9aa0a6]"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 text-[12px] border-[#e8eaed] text-[#9aa0a6]"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        </div>
      </div>

      {/* ── Section 1: Overview Cards ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#5f6368]" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {overviewCards.map((card) => (
            <OverviewStatCard key={card.id} {...card} />
          ))}
        </div>
      </div>

      {/* ── Section 2: CRM Masters Grid ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-[#5f6368]" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">CRM Masters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.status === "active";
            return (
              <Card
                key={mod.id}
                className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${mod.color} shrink-0`}>
                      <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#1a1a2e]">{mod.title}</h3>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className={`shrink-0 text-[10px] px-1.5 py-0 h-4 font-medium ${
                            isActive
                              ? "bg-[#e6f4ea] text-[#34a853] hover:bg-[#e6f4ea]"
                              : "bg-[#f1f3f4] text-[#9aa0a6] hover:bg-[#f1f3f4]"
                          }`}
                        >
                          {isActive ? "Active" : "Coming Soon"}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-[#5f6368] mt-1.5 leading-relaxed">
                        {mod.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`mt-3 h-7 text-[11px] font-medium px-0 ${
                          isActive
                            ? "text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe]"
                            : "text-[#9aa0a6] cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (!mod.isPlaceholder) {
                            window.location.href = mod.href;
                          }
                        }}
                        disabled={mod.isPlaceholder}
                      >
                        Open
                        <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Future Modules ── */}
      <Collapsible open={futureOpen} onOpenChange={setFutureOpen}>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#9aa0a6]" />
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                    Upcoming CRM Masters
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-medium bg-[#f1f3f4] text-[#9aa0a6]"
                  >
                    {futureModules.length}
                  </Badge>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#9aa0a6] transition-transform duration-200 ${
                    futureOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              <CardDescription className="text-[11px] text-[#9aa0a6]">
                Future CRM master data modules in development
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-5">
              <div className="flex flex-wrap gap-2">
                {futureModules.map((name) => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="text-[11px] px-3 py-1 font-normal text-[#5f6368] bg-[#f1f3f4] border border-[#e8eaed] opacity-60 cursor-not-allowed"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
