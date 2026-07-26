import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router";
import {
  MessageSquare,
  Bell,
  Send,
  Smartphone,
  Globe,
  Mail,
  Megaphone,
  MessageCircle,
  Users,
  Hash,
  BarChart3,
  Target,
  TrendingUp,
  Rocket,
  Calendar,
  Share2,
  MapPin,
  FileText,
  Settings,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Layers,
  Radio,
  AtSign,
} from "lucide-react";
import { useState } from "react";

const communicationModules = [
  {
    id: "messenger",
    title: "Messenger",
    description: "Team channels and direct messaging",
    icon: MessageSquare,
    href: "/messenger",
    color: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    status: "live" as const,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "In-app notifications and alerts",
    icon: Bell,
    href: "/notifications",
    color: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
    status: "live" as const,
  },
  {
    id: "sms",
    title: "SMS",
    description: "Bulk SMS messaging and campaigns",
    icon: Smartphone,
    href: "/studio/communication/sms",
    color: "bg-green-50 dark:bg-green-950/30",
    iconColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    status: "live" as const,
  },
  {
    id: "whatsapp",
    title: "WhatsApp",
    description: "WhatsApp Business messaging",
    icon: MessageCircle,
    href: "/studio/communication/whatsapp",
    color: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    status: "live" as const,
  },
  {
    id: "email",
    title: "Email",
    description: "Email templates and campaigns",
    icon: Mail,
    href: "/studio/communication/email",
    color: "bg-purple-50 dark:bg-purple-950/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
    status: "live" as const,
  },
  {
    id: "push",
    title: "Push Notifications",
    description: "Push notification delivery",
    icon: Radio,
    href: "/studio/communication/push",
    color: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200 dark:border-rose-800",
    status: "live" as const,
  },
  {
    id: "templates",
    title: "Templates",
    description: "Communication templates library",
    icon: FileText,
    href: "/studios/master-data/communication",
    color: "bg-indigo-50 dark:bg-indigo-950/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    status: "live" as const,
  },
  {
    id: "announcements",
    title: "Announcements",
    description: "Broadcast announcements to all users",
    icon: Megaphone,
    href: "/messenger",
    color: "bg-red-50 dark:bg-red-950/30",
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
    status: "live" as const,
  },
];

const marketingModules = [
  {
    id: "lead-sources",
    title: "Lead Sources",
    description: "Manage lead source channels",
    icon: Share2,
    href: "/studios/master-data/crm/lead-sources",
    color: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-200 dark:border-blue-800",
    status: "live" as const,
  },
  {
    id: "campaigns",
    title: "Campaigns",
    description: "Marketing campaign management",
    icon: Megaphone,
    href: "/studio/marketing/campaigns",
    color: "bg-purple-50 dark:bg-purple-950/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    borderColor: "border-purple-200 dark:border-purple-800",
    status: "live" as const,
  },
  {
    id: "utm-sources",
    title: "UTM Sources",
    description: "Track UTM source parameters",
    icon: Globe,
    href: "/studios/master-data/crm/utm-sources",
    color: "bg-green-50 dark:bg-green-950/30",
    iconColor: "text-green-600 dark:text-green-400",
    borderColor: "border-green-200 dark:border-green-800",
    status: "live" as const,
  },
  {
    id: "utm-mediums",
    title: "UTM Mediums",
    description: "Track UTM medium parameters",
    icon: Layers,
    href: "/studios/master-data/crm/utm-mediums",
    color: "bg-teal-50 dark:bg-teal-950/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderColor: "border-teal-200 dark:border-teal-800",
    status: "live" as const,
  },
  {
    id: "utm-campaigns",
    title: "UTM Campaigns",
    description: "Track UTM campaign parameters",
    icon: Target,
    href: "/studios/master-data/crm/utm-campaigns",
    color: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    borderColor: "border-orange-200 dark:border-orange-800",
    status: "live" as const,
  },
  {
    id: "marketing-channels",
    title: "Marketing Channels",
    description: "Marketing channel configurations",
    icon: Radio,
    href: "/studios/master-data/crm/marketing-channels",
    color: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    borderColor: "border-rose-200 dark:border-rose-800",
    status: "live" as const,
  },
  {
    id: "campaign-channels",
    title: "Campaign Channels",
    description: "Campaign channel types",
    icon: Hash,
    href: "/studios/master-data/crm/campaign-channels",
    color: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    status: "live" as const,
  },
  {
    id: "campaign-types",
    title: "Campaign Types",
    description: "Campaign type classifications",
    icon: Layers,
    href: "/studios/master-data/crm/campaign-types",
    color: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-200 dark:border-violet-800",
    status: "live" as const,
  },
  {
    id: "events",
    title: "Events",
    description: "Event management and tracking",
    icon: Calendar,
    href: "/calendar",
    color: "bg-pink-50 dark:bg-pink-950/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    borderColor: "border-pink-200 dark:border-pink-800",
    status: "live" as const,
  },
  {
    id: "referral-sources",
    title: "Referral Sources",
    description: "Track referral program sources",
    icon: Share2,
    href: "/studios/master-data/crm/referral-sources",
    color: "bg-sky-50 dark:bg-sky-950/30",
    iconColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-200 dark:border-sky-800",
    status: "live" as const,
  },
  {
    id: "funnels",
    title: "Funnels",
    description: "Marketing funnel management",
    icon: TrendingUp,
    href: "/studio/marketing/funnels",
    color: "bg-lime-50 dark:bg-lime-950/30",
    iconColor: "text-lime-600 dark:text-lime-400",
    borderColor: "border-lime-200 dark:border-lime-800",
    status: "planned" as const,
  },
  {
    id: "attribution",
    title: "Attribution",
    description: "Marketing attribution and ROI",
    icon: BarChart3,
    href: "/studio/marketing/attribution",
    color: "bg-yellow-50 dark:bg-yellow-950/30",
    iconColor: "text-yellow-600 dark:text-yellow-400",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    status: "planned" as const,
  },
];

export default function CommunicationMarketingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("communication");

  const channels = useQuery(api.messenger.listChannels, user ? { userId: user._id } : "skip");
  const notifications = useQuery(api.notifications.listNotifications, user ? { userId: user._id } : "skip");
  const unreadCount = useQuery(api.notifications.getUnreadCount, user ? { userId: user._id } : "skip");
  const smsStats = useQuery(api.smsEngine.getSmsStats);
  const whatsappStats = useQuery(api.whatsappEngine.getWhatsAppStats);
  const pushStats = useQuery(api.pushEngine.getPushStats);
  const templates = useQuery(api.templateEngine.list, {});

  const totalChannels = channels?.length || 0;
  const announcementChannels = channels?.filter((c) => c.type === "announcement").length || 0;
  const totalNotifications = notifications?.length || 0;

  const smsQueued = smsStats?.queued || 0;
  const smsSent = smsStats?.sent || 0;
  const smsFailed = smsStats?.failed || 0;

  const waQueued = whatsappStats?.queued || 0;
  const waSent = whatsappStats?.sent || 0;
  const waFailed = whatsappStats?.failed || 0;

  const pushQueued = pushStats?.queued || 0;
  const pushSent = pushStats?.sent || 0;

  const templateCount = templates?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a1a2e] dark:text-white">
            Communication & Marketing
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1">
            Centralized platform for all communication channels and marketing activities
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#f1f3f4] dark:bg-[#1a1a2e] p-0.5 h-10">
          <TabsTrigger value="communication" className="text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#2d2d4a] flex-1">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            Communication
          </TabsTrigger>
          <TabsTrigger value="marketing" className="text-[13px] data-[state=active]:bg-white dark:data-[state=active]:bg-[#2d2d4a] flex-1">
            <Target className="h-4 w-4 mr-1.5" />
            Marketing
          </TabsTrigger>
        </TabsList>

        {/* ─── COMMUNICATION TAB ─── */}
        <TabsContent value="communication" className="space-y-6 mt-6">
          {/* Communication KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 mx-auto mb-1.5">
                  <Hash className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{totalChannels}</p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Channels</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 mx-auto mb-1.5">
                  <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{totalNotifications}</p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Notifications</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-green-50 dark:bg-green-950/30 mx-auto mb-1.5">
                  <Smartphone className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{smsSent + smsQueued}</p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">SMS Total</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 mx-auto mb-1.5">
                  <MessageCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{waSent + waQueued}</p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">WhatsApp Total</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 mx-auto mb-1.5">
                  <Radio className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{pushSent + pushQueued}</p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Push Total</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 mx-auto mb-1.5">
                  <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{templateCount}</p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Templates</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-50 dark:bg-red-950/30 mx-auto mb-1.5">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">{smsFailed + waFailed}</p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Failed</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 mx-auto mb-1.5">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">
                  {unreadCount ?? 0}
                </p>
                <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6]">Unread</p>
              </CardContent>
            </Card>
          </div>

          {/* Channel Distribution & Message Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Channels Summary */}
            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e] dark:text-white flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#5f6368]" />
                  Channels Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Standard Channels</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a2e] dark:text-white">
                      {totalChannels - announcementChannels}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Announcement Channels</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a2e] dark:text-white">
                      {announcementChannels}
                    </span>
                  </div>
                  <Separator className="bg-[#e8eaed] dark:bg-[#2d2d4a]" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-[12px] border-[#e8eaed] dark:border-[#2d2d4a]"
                    onClick={() => navigate("/messenger")}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Open Messenger
                    <ArrowRight className="h-3 w-3 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* SMS Status */}
            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e] dark:text-white flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  SMS Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Queued</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a2e] dark:text-white">{smsQueued}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Sent</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a2e] dark:text-white">{smsSent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Failed</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a2e] dark:text-white">{smsFailed}</span>
                  </div>
                  <div className="w-full bg-[#f1f3f4] dark:bg-[#2d2d4a] rounded-full h-1.5 mt-1">
                    <div
                      className="bg-green-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${smsSent + smsQueued > 0 ? ((smsSent) / (smsSent + smsQueued + smsFailed) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Status */}
            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-[#1a1a2e] dark:text-white flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-600" />
                  WhatsApp Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                      <span className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Queued</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a2e] dark:text-white">{waQueued}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Sent</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a2e] dark:text-white">{waSent}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6]">Failed</span>
                    </div>
                    <span className="text-[13px] font-medium text-[#1a1a2e] dark:text-white">{waFailed}</span>
                  </div>
                  <div className="w-full bg-[#f1f3f4] dark:bg-[#2d2d4a] rounded-full h-1.5 mt-1">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${waSent + waQueued > 0 ? ((waSent) / (waSent + waQueued + waFailed) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communication Modules Grid */}
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Communication Channels
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {communicationModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => navigate(mod.href)}
                  className={`p-3 rounded-xl border ${mod.borderColor} ${mod.color} hover:shadow-md transition-all text-left group`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${mod.color} ${mod.iconColor}`}>
                      <mod.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[13px] font-semibold text-[#1a1a2e] dark:text-white truncate">{mod.title}</h4>
                        <Badge
                          className={`h-4 px-1 text-[8px] font-medium rounded-sm ${
                            mod.status === "live"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {mod.status === "live" ? "Live" : "Planned"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5 line-clamp-1">{mod.description}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#9aa0a6] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Notifications */}
          <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e] dark:text-white flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Recent Notifications
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] text-[#5f6368]"
                onClick={() => navigate("/notifications")}
              >
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {!notifications ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-[#9aa0a6]" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-6">
                  <Bell className="h-6 w-6 text-[#dadce0] mx-auto mb-2" />
                  <p className="text-[12px] text-[#9aa0a6]">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[#e8eaed] dark:divide-[#2d2d4a]">
                  {notifications.slice(0, 5).map((notif) => (
                    <div key={notif._id} className="flex items-start gap-2 py-2">
                      <div className={`p-1 rounded-lg shrink-0 ${
                        notif.type === "announcement" ? "bg-red-50 text-red-600" :
                        notif.type === "message" ? "bg-blue-50 text-blue-600" :
                        notif.type === "task" ? "bg-amber-50 text-amber-600" :
                        "bg-gray-50 text-gray-600"
                      }`}>
                        {notif.type === "announcement" ? <Megaphone className="h-3 w-3" /> :
                         notif.type === "message" ? <MessageSquare className="h-3 w-3" /> :
                         notif.type === "task" ? <CheckCircle2 className="h-3 w-3" /> :
                         <Bell className="h-3 w-3" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#1a1a2e] dark:text-white truncate">
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] truncate">{notif.message}</p>
                      </div>
                      <span className="text-[10px] text-[#9aa0a6] shrink-0">
                        {new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── MARKETING TAB ─── */}
        <TabsContent value="marketing" className="space-y-6 mt-6">
          {/* Marketing KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/30 mx-auto mb-2">
                  <Share2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">8</p>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">Lead Sources</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/30 mx-auto mb-2">
                  <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">3</p>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">Campaign Types</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950/30 mx-auto mb-2">
                  <Globe className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">3</p>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">UTM Dimensions</p>
              </CardContent>
            </Card>

            <Card className="border-[#e8eaed] dark:border-[#2d2d4a] shadow-sm bg-white dark:bg-[#1a1a2e]">
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 mx-auto mb-2">
                  <Radio className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <p className="text-lg font-bold text-[#1a1a2e] dark:text-white">2</p>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6]">Channel Configs</p>
              </CardContent>
            </Card>
          </div>

          {/* Marketing Modules Grid */}
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a2e] dark:text-white mb-3 flex items-center gap-2">
              <Rocket className="h-4 w-4 text-purple-500" />
              Marketing Tools
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {marketingModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => mod.status === "live" ? navigate(mod.href) : undefined}
                  className={`p-3 rounded-xl border ${mod.borderColor} ${mod.color} hover:shadow-md transition-all text-left group ${
                    mod.status === "planned" ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${mod.color} ${mod.iconColor}`}>
                      <mod.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[13px] font-semibold text-[#1a1a2e] dark:text-white truncate">{mod.title}</h4>
                        <Badge
                          className={`h-4 px-1 text-[8px] font-medium rounded-sm ${
                            mod.status === "live"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}
                        >
                          {mod.status === "live" ? "Live" : "Planned"}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5 line-clamp-1">{mod.description}</p>
                    </div>
                    {mod.status === "live" && (
                      <ArrowRight className="h-3.5 w-3.5 text-[#9aa0a6] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
