import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  MessageCircle, Mail, MessageSquare, Globe, Webhook, CreditCard,
  Fingerprint, BookOpen, Plug, Plus, Settings, Play, Trash2,
} from "lucide-react";

const CONNECTOR_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <MessageCircle className="h-5 w-5" />,
  email: <Mail className="h-5 w-5" />,
  sms: <MessageSquare className="h-5 w-5" />,
  rest: <Globe className="h-5 w-5" />,
  webhook: <Webhook className="h-5 w-5" />,
  payment: <CreditCard className="h-5 w-5" />,
  payment_gateway: <CreditCard className="h-5 w-5" />,
  biometric: <Fingerprint className="h-5 w-5" />,
  lms: <BookOpen className="h-5 w-5" />,
};

const CONNECTOR_COLORS: Record<string, string> = {
  whatsapp: "text-green-500", email: "text-blue-500", sms: "text-cyan-500",
  rest: "text-indigo-500", webhook: "text-purple-500",
  payment: "text-emerald-500", payment_gateway: "text-emerald-500",
  biometric: "text-teal-500", lms: "text-sky-500",
};

export default function IntegrationStudio() {
  const [tab, setTab] = useState("overview");

  const connectors = useQuery(api.platform.sdk.integrationSdk.list, {}) as
    { instances: any[]; total: number } | undefined;
  const health = useQuery(api.platform.sdk.integrationSdk.getHealth, {}) as
    { total: number; active: number; inactive: number; errored: number } | undefined;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integration Studio</h1>
          <p className="text-sm text-muted-foreground">Connect external services and manage integrations</p>
        </div>
        <Button><Plus className="mr-1 h-4 w-4" /> New Connector</Button>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2"><Plug className="h-5 w-5 text-blue-600" /></div>
          <div><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{health?.total || 0}</p></div>
        </CardContent></Card>
        <Card className="border-green-200"><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-full bg-green-100 p-2"><Play className="h-5 w-5 text-green-600" /></div>
          <div><p className="text-xs text-muted-foreground">Active</p><p className="text-2xl font-bold text-green-600">{health?.active || 0}</p></div>
        </CardContent></Card>
        <Card className="border-amber-200"><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2"><Settings className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Errored</p><p className="text-2xl font-bold text-amber-600">{health?.errored || 0}</p></div>
        </CardContent></Card>
        <Card className="border-red-200"><CardContent className="p-4 flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2"><Trash2 className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-xs text-muted-foreground">Inactive</p><p className="text-2xl font-bold text-red-600">{health?.inactive || 0}</p></div>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-[400px] grid-cols-3">
          <TabsTrigger value="overview">Connectors</TabsTrigger>
          <TabsTrigger value="available">Available Types</TabsTrigger>
          <TabsTrigger value="logs">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-3 gap-4">
            {(connectors?.instances || []).length === 0 ? (
              <>
                {/* Placeholder connector cards for empty state */}
                {["WhatsApp Business", "Email Service", "SMS Gateway", "Payment Gateway", "REST API", "Webhook"].map((name, i) => (
                  <Card key={i} className="border-dashed">
                    <CardContent className="p-6 flex flex-col items-center gap-3 text-center">
                      <div className="rounded-full bg-muted p-3">
                        <Plug className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="font-medium text-muted-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">Not configured</p>
                      <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" /> Configure</Button>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              connectors!.instances.map((conn: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={CONNECTOR_COLORS[conn.connectorType] || "text-gray-500"}>
                          {CONNECTOR_ICONS[conn.connectorType] || <Plug className="h-5 w-5" />}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{conn.name}</p>
                          <p className="text-xs text-muted-foreground">{conn.connectorType}</p>
                        </div>
                      </div>
                      <Badge variant={conn.isActive ? "default" : "secondary"}>
                        {conn.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1"><Settings className="mr-1 h-3 w-3" /> Config</Button>
                      <Button size="sm" variant="outline" className="flex-1"><Play className="mr-1 h-3 w-3" /> Test</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="available" className="mt-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { type: "whatsapp", name: "WhatsApp Business", color: "green", desc: "Send/receive messages via WhatsApp API" },
              { type: "email", name: "Email Service", color: "blue", desc: "Transactional emails via SMTP or API" },
              { type: "sms", name: "SMS Gateway", color: "cyan", desc: "SMS via Twilio, MSG91, custom" },
              { type: "google", name: "Google Workspace", color: "indigo", desc: "Calendar, Drive, Sheets, Gmail" },
              { type: "microsoft", name: "Microsoft 365", color: "sky", desc: "Outlook, Teams, SharePoint" },
              { type: "payment_gateway", name: "Payment Gateway", color: "emerald", desc: "Razorpay, Stripe, PayU" },
              { type: "biometric", name: "Biometric Device", color: "teal", desc: "ZKteco, Mantra, custom devices" },
              { type: "lms", name: "LMS Platform", color: "violet", desc: "Moodle, Canvas, Blackboard" },
              { type: "rest", name: "REST API", color: "slate", desc: "Connect any REST API" },
              { type: "webhook", name: "Webhook", color: "purple", desc: "Outgoing HTTP POST webhooks" },
              { type: "ftp", name: "FTP/SFTP", color: "orange", desc: "File transfer protocol connections" },
              { type: "zoom", name: "Zoom", color: "blue", desc: "Video conferencing integration" },
            ].map((item, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-${item.color}-600 border-${item.color}-200`}>
                      {CONNECTOR_ICONS[item.type] || <Plug className="h-3 w-3" />}
                    </Badge>
                    <p className="font-medium text-sm">{item.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                  <Button variant="ghost" size="sm" className="w-full"><Plus className="mr-1 h-3 w-3" /> Add Connector</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Plug className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>Integration activity log will appear here.</p>
              <p className="text-xs">Test and usage events are recorded when connectors are active.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
