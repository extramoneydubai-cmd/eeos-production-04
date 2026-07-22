import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  Target,
  TrendingUp,
  BookOpenText,
  Banknote,
  MessageSquare,
  Building2,
  Settings,
  Users,
  Download,
  Upload,
  ClipboardList,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const categories = [
  {
    id: "crm",
    title: "CRM Masters",
    description: "Lead sources, lost reasons, tags, and CRM configuration",
    icon: Target,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    href: "/studios/master-data/crm",
  },
  {
    id: "academic",
    title: "Academic Masters",
    description: "Courses, subjects, academic terms, and program setup",
    icon: BookOpenText,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    href: "/studios/master-data/academic",
  },
  {
    id: "finance",
    title: "Finance Masters",
    description: "Fee structures, payment terms, discounts, and tax codes",
    icon: Banknote,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#fbbc04]",
    href: "/studios/master-data/finance",
  },
  {
    id: "communication",
    title: "Communication Masters",
    description: "Email templates, SMS templates, and notification config",
    icon: MessageSquare,
    color: "bg-[#fce8e6]",
    iconColor: "text-[#ea4335]",
    href: "/studios/master-data/communication",
  },
  {
    id: "organization",
    title: "Organization Masters",
    description: "Departments, teams, branches, and reporting structure",
    icon: Building2,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    href: "/studios/master-data/organization",
  },
  {
    id: "hr",
    title: "HR Masters",
    description: "Employee types, payroll structures, and HR configuration",
    icon: Users,
    color: "bg-[#e8eaf6]",
    iconColor: "text-[#4f46e5]",
    href: "/studios/master-data/hr",
  },
  {
    id: "sales",
    title: "Sales Masters",
    description: "Opportunity stages, pipelines, targets, and sales configuration",
    icon: TrendingUp,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    href: "/studios/master-data/sales",
  },
  {
    id: "system",
    title: "System Masters",
    description: "Roles, permissions, feature flags, and global settings",
    icon: Settings,
    color: "bg-[#f1f3f4]",
    iconColor: "text-[#5f6368]",
    href: "/studios/master-data/system",
  },
];

export default function MasterDataStudio() {
  const { navigate } = useAppNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1a1a2e] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">Master Data Studio</h1>
          </div>
          <p className="text-[13px] text-[#5f6368] mt-1.5">
            Centralized business configuration for all departments.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 text-[12px] border-[#e8eaed] text-[#9aa0a6]"
          >
            <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
            Audit Log
          </Button>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card
              key={cat.id}
              className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${cat.color} shrink-0`}>
                    <Icon className={`h-5 w-5 ${cat.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#1a1a2e]">{cat.title}</h3>
                    <p className="text-[12px] text-[#5f6368] mt-1 leading-relaxed">
                      {cat.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-3 h-7 text-[11px] font-medium text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe] px-0"
                      onClick={() => navigate(cat.href)}
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
  );
}
