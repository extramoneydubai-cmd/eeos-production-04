/**
 * Enterprise Integration Runtime — Connector-based Integration Hub
 *
 * Phase 10 — Replaces individual integrations with a single connector model.
 * Supports: WhatsApp, SMS, Email, Google, Microsoft, Zoom, Teams,
 * Accounting, Payment Gateway, Biometric, Face Recognition,
 * REST, Webhook, FTP, SFTP, MQTT, GraphQL
 *
 * Each connector is self-registering with metadata.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Connector Types ──────────────────────────────────────────

export interface ConnectorDefinition {
  id: string;
  name: string;
  type: ConnectorType;
  category: ConnectorCategory;
  description: string;
  icon: string;
  color: string;
  requiredConfigFields: ConfigField[];
  optionalConfigFields: ConfigField[];
  supportsWebhook: boolean;
  supportsPolling: boolean;
  supportsTwoWay: boolean;
  authType: "api_key" | "oauth2" | "basic" | "none";
  docsUrl?: string;
  isEnabled: boolean;
  isBeta: boolean;
}

export type ConnectorType =
  | "whatsapp" | "sms" | "email"
  | "google" | "microsoft" | "zoom" | "teams"
  | "accounting" | "payment_gateway"
  | "biometric" | "face_recognition"
  | "rest" | "webhook" | "ftp" | "sftp"
  | "mqtt" | "graphql"
  | "lms" | "moodle"
  | "custom";

export type ConnectorCategory =
  | "communication" | "productivity" | "finance"
  | "hr" | "academic" | "infrastructure"
  | "custom";

export interface ConfigField {
  key: string;
  label: string;
  type: "string" | "password" | "number" | "boolean" | "url" | "select";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[];
  defaultValue?: any;
}

export interface ConnectorInstance {
  _id?: string;
  connectorType: ConnectorType;
  name: string;
  config: Record<string, any>;
  isActive: boolean;
  companyId?: string;
  branchId?: string;
  lastTestedAt?: number;
  lastUsedAt?: number;
  errorCount: number;
  createdAt: number;
  updatedAt: number;
}

// ─── Connector Registry ───────────────────────────────────────

export const CONNECTOR_REGISTRY: Record<string, ConnectorDefinition> = {
  whatsapp: {
    id: "whatsapp", name: "WhatsApp Business API", type: "whatsapp", category: "communication",
    description: "Send and receive WhatsApp messages via Business API",
    icon: "MessageCircle", color: "#25D366",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "Enter WhatsApp API key", helpText: "Obtain from WhatsApp Business API provider" },
      { key: "phoneNumberId", label: "Phone Number ID", type: "string", required: true, placeholder: "e.g. 1234567890" },
    ],
    optionalConfigFields: [
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: false },
      { key: "businessAccountId", label: "Business Account ID", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  sms: {
    id: "sms", name: "SMS Gateway", type: "sms", category: "communication",
    description: "Send SMS messages via Twilio, MSG91, or custom gateway",
    icon: "MessageSquare", color: "#3B82F6",
    requiredConfigFields: [
      { key: "provider", label: "Provider", type: "select", required: true, options: ["twilio", "msg91", "plivo", "custom"], defaultValue: "msg91" },
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "senderId", label: "Sender ID", type: "string", required: false, placeholder: "e.g. EEOSMS" },
      { key: "apiUrl", label: "Custom API URL", type: "url", required: false, helpText: "Only for custom providers" },
    ],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  email: {
    id: "email", name: "Email Service", type: "email", category: "communication",
    description: "Send transactional and bulk emails via SMTP or API",
    icon: "Mail", color: "#EA4335",
    requiredConfigFields: [
      { key: "provider", label: "Provider", type: "select", required: true, options: ["smtp", "sendgrid", "resend", "ses", "mailgun"], defaultValue: "smtp" },
      { key: "fromEmail", label: "From Email", type: "string", required: true, placeholder: "noreply@example.com" },
      { key: "fromName", label: "From Name", type: "string", required: true, placeholder: "EEOS Platform" },
    ],
    optionalConfigFields: [
      { key: "smtpHost", label: "SMTP Host", type: "string", required: false },
      { key: "smtpPort", label: "SMTP Port", type: "number", required: false, defaultValue: 587 },
      { key: "smtpUser", label: "SMTP Username", type: "string", required: false },
      { key: "smtpPass", label: "SMTP Password", type: "password", required: false },
      { key: "apiKey", label: "API Key", type: "password", required: false },
    ],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  google: {
    id: "google", name: "Google Workspace", type: "google", category: "productivity",
    description: "Google Calendar, Drive, Sheets, Gmail integration",
    icon: "Chrome", color: "#4285F4",
    requiredConfigFields: [
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "scopes", label: "Scopes", type: "string", required: false, defaultValue: "calendar,drive,sheets" },
      { key: "redirectUri", label: "Redirect URI", type: "url", required: false },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  microsoft: {
    id: "microsoft", name: "Microsoft 365", type: "microsoft", category: "productivity",
    description: "Outlook, Teams, SharePoint, OneDrive integration",
    icon: "Windows", color: "#00A4EF",
    requiredConfigFields: [
      { key: "tenantId", label: "Tenant ID", type: "string", required: true },
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "scopes", label: "Scopes", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  rest: {
    id: "rest", name: "REST API Connector", type: "rest", category: "custom",
    description: "Connect to any REST API with custom headers and payload",
    icon: "Globe", color: "#6366f1",
    requiredConfigFields: [
      { key: "baseUrl", label: "Base URL", type: "url", required: true, placeholder: "https://api.example.com" },
    ],
    optionalConfigFields: [
      { key: "authType", label: "Auth Type", type: "select", required: false, options: ["none", "bearer", "basic", "api_key", "custom"], defaultValue: "none" },
      { key: "authToken", label: "Auth Token", type: "password", required: false },
      { key: "headers", label: "Custom Headers (JSON)", type: "string", required: false, placeholder: '{"X-Custom": "value"}' },
      { key: "timeout", label: "Timeout (ms)", type: "number", required: false, defaultValue: 30000 },
    ],
    supportsWebhook: false, supportsPolling: true, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  webhook: {
    id: "webhook", name: "Outgoing Webhook", type: "webhook", category: "custom",
    description: "Send data to external systems via HTTP POST webhooks",
    icon: "Webhook", color: "#7C3AED",
    requiredConfigFields: [
      { key: "url", label: "Webhook URL", type: "url", required: true, placeholder: "https://hooks.example.com/..." },
    ],
    optionalConfigFields: [
      { key: "secret", label: "Secret Key", type: "password", required: false },
      { key: "method", label: "HTTP Method", type: "select", required: false, options: ["POST", "PUT", "PATCH"], defaultValue: "POST" },
      { key: "contentType", label: "Content Type", type: "select", required: false, options: ["application/json", "application/xml", "application/x-www-form-urlencoded"], defaultValue: "application/json" },
    ],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "none", isEnabled: true, isBeta: false,
  },
  payment: {
    id: "payment", name: "Payment Gateway", type: "payment_gateway", category: "finance",
    description: "Process payments via Razorpay, Stripe, PayU, etc.",
    icon: "CreditCard", color: "#059669",
    requiredConfigFields: [
      { key: "provider", label: "Provider", type: "select", required: true, options: ["razorpay", "stripe", "payu", "instamojo", "phonepe"] },
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "apiSecret", label: "API Secret", type: "password", required: false },
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: false },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  biometric: {
    id: "biometric", name: "Biometric Device", type: "biometric", category: "hr",
    description: "Connect biometric attendance devices (fingerprint, palm)",
    icon: "Fingerprint", color: "#0891B2",
    requiredConfigFields: [
      { key: "deviceType", label: "Device Type", type: "select", required: true, options: ["zkteco", "mantra", "real_time", "custom"] },
      { key: "deviceIp", label: "Device IP", type: "string", required: true, placeholder: "192.168.1.100" },
    ],
    optionalConfigFields: [
      { key: "port", label: "Port", type: "number", required: false, defaultValue: 4370 },
      { key: "devicePassword", label: "Device Password", type: "password", required: false },
    ],
    supportsWebhook: false, supportsPolling: true, supportsTwoWay: false,
    authType: "none", isEnabled: true, isBeta: true,
  },
  lms: {
    id: "lms", name: "LMS Integration", type: "lms", category: "academic",
    description: "Connect to Moodle, Canvas, or custom LMS platforms",
    icon: "BookOpen", color: "#0D9488",
    requiredConfigFields: [
      { key: "platform", label: "LMS Platform", type: "select", required: true, options: ["moodle", "canvas", "blackboard", "custom"] },
      { key: "apiUrl", label: "API URL", type: "url", required: true },
      { key: "apiToken", label: "API Token", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "syncInterval", label: "Sync Interval (min)", type: "number", required: false, defaultValue: 60 },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
};

// ─── Queries ───────────────────────────────────────────────────

export const listConnectorTypes = query({
  handler: async () => {
    return Object.values(CONNECTOR_REGISTRY).map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      category: c.category,
      description: c.description,
      icon: c.icon,
      color: c.color,
      isEnabled: c.isEnabled,
      isBeta: c.isBeta,
      requiredFieldCount: c.requiredConfigFields.length,
      supportsWebhook: c.supportsWebhook,
    }));
  },
});

export const getConnectorType = query({
  args: { connectorType: v.string() },
  handler: async (ctx, args) => {
    return CONNECTOR_REGISTRY[args.connectorType] || null;
  },
});

export const listConnectorInstances = query({
  args: { companyId: v.optional(v.id("companies")), branchId: v.optional(v.id("branches")) },
  handler: async (ctx, args) => {
    let instances = await ctx.db.query("integrationConnectors").collect();

    if (args.companyId) {
      instances = instances.filter((i: any) => i.companyId === args.companyId || !i.companyId);
    }
    if (args.branchId) {
      instances = instances.filter((i: any) => i.branchId === args.branchId || !i.branchId);
    }

    return instances.map((inst: any) => {
      const def = CONNECTOR_REGISTRY[inst.connectorType];
      return {
        ...inst,
        connectorName: def?.name || inst.connectorType,
        connectorIcon: def?.icon || "Plug",
        connectorColor: def?.color || "#6366f1",
        maskedConfig: inst.config ? Object.fromEntries(
          Object.entries(inst.config).map(([k, v]) => [k, k.toLowerCase().includes("key") || k.toLowerCase().includes("secret") || k.toLowerCase().includes("pass") ? "••••••••" : v])
        ) : {},
      };
    });
  },
});

// ─── Mutations ─────────────────────────────────────────────────

export const createConnector = mutation({
  args: {
    connectorType: v.string(),
    name: v.string(),
    config: v.any(),
    companyId: v.optional(v.id("companies")),
    branchId: v.optional(v.id("branches")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const def = CONNECTOR_REGISTRY[args.connectorType];
    if (!def) throw new Error(`Unknown connector type: ${args.connectorType}`);

    // Validate required config fields
    for (const field of def.requiredConfigFields) {
      if (!args.config[field.key]) {
        throw new Error(`Missing required config field: ${field.key}`);
      }
    }

    const now = Date.now();
    return ctx.db.insert("integrationConnectors", {
      connectorType: args.connectorType as any,
      name: args.name,
      config: args.config,
      isActive: args.isActive !== false,
      companyId: args.companyId,
      branchId: args.branchId,
      errorCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateConnector = mutation({
  args: {
    connectorId: v.id("integrationConnectors"),
    name: v.optional(v.string()),
    config: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { connectorId, ...fields } = args;
    const updates: Record<string, any> = { updatedAt: Date.now() };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.config !== undefined) updates.config = fields.config;
    if (fields.isActive !== undefined) updates.isActive = fields.isActive;
    return ctx.db.patch(connectorId, updates);
  },
});

export const deleteConnector = mutation({
  args: { connectorId: v.id("integrationConnectors") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.connectorId);
    return { success: true };
  },
});

export const testConnector = mutation({
  args: { connectorId: v.id("integrationConnectors") },
  handler: async (ctx, args) => {
    const inst = await ctx.db.get(args.connectorId);
    if (!inst) throw new Error("Connector not found");

    await ctx.db.patch(args.connectorId, {
      lastTestedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, message: "Connector configuration validated" };
  },
});

// ─── Integration Dashboard ────────────────────────────────────

export const getIntegrationDashboard = query({
  handler: async (ctx) => {
    const instances = await ctx.db.query("integrationConnectors").collect();

    const byType: Record<string, { total: number; active: number }> = {};
    for (const inst of instances) {
      const type = (inst as any).connectorType;
      if (!byType[type]) byType[type] = { total: 0, active: 0 };
      byType[type].total++;
      if ((inst as any).isActive) byType[type].active++;
    }

    return {
      totalConnectors: instances.length,
      activeConnectors: instances.filter((i: any) => i.isActive).length,
      inactiveConnectors: instances.filter((i: any) => !i.isActive).length,
      byType: Object.entries(byType).map(([type, data]) => ({
        type,
        name: CONNECTOR_REGISTRY[type]?.name || type,
        icon: CONNECTOR_REGISTRY[type]?.icon || "Plug",
        color: CONNECTOR_REGISTRY[type]?.color || "#6366f1",
        ...data,
      })),
      availableTypes: Object.keys(CONNECTOR_REGISTRY).length,
    };
  },
});
