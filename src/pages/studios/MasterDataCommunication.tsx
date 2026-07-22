import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Home, Megaphone, Mail, MessageSquare, MessageCircle, ArrowRight, Sparkles,
} from "lucide-react";

const moduleCards = [
  {
    id: "notification-types", title: "Notification Types", description: "Configure system notification categories and delivery channels.",
    icon: Megaphone, color: "bg-[#e8f0fe]", iconColor: "text-[#1a73e8]",
    href: "/studios/master-data/communication/notification-types",
  },
  {
    id: "email-templates", title: "Email Templates", description: "Manage reusable email templates for communication.",
    icon: Mail, color: "bg-[#fce8e6]", iconColor: "text-[#ea4335]",
    href: "/studios/master-data/communication/email-templates",
  },
  {
    id: "sms-templates", title: "SMS Templates", description: "Manage reusable SMS message templates.",
    icon: MessageSquare, color: "bg-[#e6f4ea]", iconColor: "text-[#34a853]",
    href: "/studios/master-data/communication/sms-templates",
  },
  {
    id: "whatsapp-templates", title: "WhatsApp Templates", description: "Manage reusable WhatsApp message templates.",
    icon: MessageCircle, color: "bg-[#fef7e0]", iconColor: "text-[#25D366]",
    href: "/studios/master-data/communication/whatsapp-templates",
  },
];

export default function MasterDataCommunication() {
  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/dashboard" className="flex items-center gap-1"><Home className="h-3.5 w-3.5" /> Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/studios/master-data">Master Data Studio</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Communication Masters</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1a1a2e] flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">Communication Masters</h1>
          </div>
          <p className="text-[13px] text-[#5f6368] mt-1.5">
            Configure communication templates and notification types across all channels.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#5f6368]" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Communication Masters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.id} className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${mod.color} shrink-0`}><Icon className={`h-5 w-5 ${mod.iconColor}`} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#1a1a2e]">{mod.title}</h3>
                        <Badge className="shrink-0 text-[10px] px-1.5 py-0 h-4 font-medium bg-[#e6f4ea] text-[#34a853] hover:bg-[#e6f4ea]">Active</Badge>
                      </div>
                      <p className="text-[12px] text-[#5f6368] mt-1.5 leading-relaxed">{mod.description}</p>
                      <Button variant="ghost" size="sm" className="mt-3 h-7 text-[11px] font-medium px-0 text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe]"
                        onClick={() => window.location.href = mod.href}>
                        Open <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
