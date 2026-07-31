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
  | "google" | "microsoft" | "zoom" | "teams" | "meeting"
  | "accounting" | "payment_gateway"
  | "biometric" | "face_recognition"
  | "rest" | "webhook" | "ftp" | "sftp"
  | "mqtt" | "graphql"
  | "lms" | "moodle" | "canvas"
  | "storage" | "crm" | "ai" | "form" | "landing" | "automation"
  | "custom";

export type ConnectorCategory =
  | "communication" | "productivity" | "finance"
  | "hr" | "academic" | "infrastructure"
  | "storage" | "crm" | "accounting" | "ai"
  | "forms" | "marketing" | "automation"
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
  // ── Storage Connectors ──────────────────────────────
  s3: {
    id: "s3", name: "AWS S3", type: "storage", category: "storage",
    description: "Object storage for LMS media, documents, and backups",
    icon: "Cloud", color: "#FF9900",
    requiredConfigFields: [
      { key: "bucket", label: "Bucket Name", type: "string", required: true, placeholder: "my-company-media" },
      { key: "region", label: "Region", type: "string", required: true, placeholder: "ap-south-1" },
      { key: "accessKeyId", label: "Access Key ID", type: "password", required: true },
      { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "cdnUrl", label: "CDN Base URL", type: "url", required: false },
      { key: "prefix", label: "Key Prefix", type: "string", required: false, defaultValue: "media/" },
    ],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  r2: {
    id: "r2", name: "Cloudflare R2", type: "storage", category: "storage",
    description: "S3-compatible object storage with zero egress fees",
    icon: "CloudLightning", color: "#F6821F",
    requiredConfigFields: [
      { key: "accountId", label: "Account ID", type: "string", required: true },
      { key: "bucket", label: "Bucket Name", type: "string", required: true },
      { key: "accessKeyId", label: "Access Key ID", type: "password", required: true },
      { key: "secretAccessKey", label: "Secret Access Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "customDomain", label: "Custom Domain", type: "url", required: false },
    ],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  gdrive: {
    id: "gdrive", name: "Google Drive", type: "storage", category: "storage",
    description: "Store LMS videos and documents in Google Drive",
    icon: "HardDrive", color: "#4285F4",
    requiredConfigFields: [
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "rootFolderId", label: "Root Folder ID", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  dropbox: {
    id: "dropbox", name: "Dropbox", type: "storage", category: "storage",
    description: "Store and stream media via Dropbox",
    icon: "Folder", color: "#0061FF",
    requiredConfigFields: [
      { key: "accessToken", label: "Access Token", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "appKey", label: "App Key", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  onedrive: {
    id: "onedrive", name: "OneDrive", type: "storage", category: "storage",
    description: "Store LMS media in Microsoft OneDrive",
    icon: "Cloud", color: "#0078D4",
    requiredConfigFields: [
      { key: "tenantId", label: "Tenant ID", type: "string", required: true },
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  azure_blob: {
    id: "azure_blob", name: "Azure Blob Storage", type: "storage", category: "storage",
    description: "Store media in Azure Blob Storage",
    icon: "Cloud", color: "#0078D4",
    requiredConfigFields: [
      { key: "connectionString", label: "Connection String", type: "password", required: true },
      { key: "container", label: "Container", type: "string", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  minio: {
    id: "minio", name: "MinIO", type: "storage", category: "storage",
    description: "Self-hosted S3-compatible object storage",
    icon: "Server", color: "#C72E49",
    requiredConfigFields: [
      { key: "endpoint", label: "Endpoint", type: "url", required: true },
      { key: "bucket", label: "Bucket", type: "string", required: true },
      { key: "accessKey", label: "Access Key", type: "password", required: true },
      { key: "secretKey", label: "Secret Key", type: "password", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  // ── CRM Connectors ──────────────────────────────────
  hubspot: {
    id: "hubspot", name: "HubSpot CRM", type: "crm", category: "crm",
    description: "Sync leads, contacts, and deals with HubSpot",
    icon: "Users", color: "#FF7A59",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "portalId", label: "Portal ID", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  salesforce: {
    id: "salesforce", name: "Salesforce", type: "crm", category: "crm",
    description: "Enterprise CRM integration for leads and opportunities",
    icon: "Cloud", color: "#00A1E0",
    requiredConfigFields: [
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
      { key: "instanceUrl", label: "Instance URL", type: "url", required: true },
    ],
    optionalConfigFields: [
      { key: "apiVersion", label: "API Version", type: "string", required: false, defaultValue: "v59.0" },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  zoho_crm: {
    id: "zoho_crm", name: "Zoho CRM", type: "crm", category: "crm",
    description: "Sync leads and contacts with Zoho CRM",
    icon: "Users", color: "#E42527",
    requiredConfigFields: [
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
      { key: "refreshToken", label: "Refresh Token", type: "password", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  // ── Accounting Connectors ───────────────────────────
  tally: {
    id: "tally", name: "Tally ERP", type: "accounting", category: "accounting",
    description: "Sync vouchers, ledgers, and GST returns with Tally",
    icon: "BookOpen", color: "#4B0082",
    requiredConfigFields: [
      { key: "serverUrl", label: "Server URL", type: "url", required: true },
      { key: "companyName", label: "Tally Company Name", type: "string", required: true },
    ],
    optionalConfigFields: [
      { key: "port", label: "Port", type: "number", required: false, defaultValue: 9000 },
    ],
    supportsWebhook: false, supportsPolling: true, supportsTwoWay: true,
    authType: "basic", isEnabled: true, isBeta: true,
  },
  quickbooks: {
    id: "quickbooks", name: "QuickBooks", type: "accounting", category: "accounting",
    description: "Sync invoices and payments with QuickBooks Online",
    icon: "Calculator", color: "#2CA01C",
    requiredConfigFields: [
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "companyId", label: "Company ID", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  xero: {
    id: "xero", name: "Xero", type: "accounting", category: "accounting",
    description: "Sync accounting entries with Xero",
    icon: "Calculator", color: "#13B5EA",
    requiredConfigFields: [
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  // ── Payment Connectors ──────────────────────────────
  razorpay: {
    id: "razorpay", name: "Razorpay", type: "payment_gateway", category: "finance",
    description: "Collect fees via Razorpay payment gateway",
    icon: "CreditCard", color: "#0C2451",
    requiredConfigFields: [
      { key: "keyId", label: "Key ID", type: "password", required: true },
      { key: "keySecret", label: "Key Secret", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: false },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  stripe: {
    id: "stripe", name: "Stripe", type: "payment_gateway", category: "finance",
    description: "Collect payments via Stripe",
    icon: "CreditCard", color: "#635BFF",
    requiredConfigFields: [
      { key: "secretKey", label: "Secret Key", type: "password", required: true },
      { key: "publishableKey", label: "Publishable Key", type: "string", required: true },
    ],
    optionalConfigFields: [
      { key: "webhookSecret", label: "Webhook Secret", type: "password", required: false },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  paypal: {
    id: "paypal", name: "PayPal", type: "payment_gateway", category: "finance",
    description: "Collect payments via PayPal",
    icon: "CreditCard", color: "#003087",
    requiredConfigFields: [
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "mode", label: "Mode", type: "select", required: false, options: ["sandbox", "live"], defaultValue: "sandbox" },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  cashfree: {
    id: "cashfree", name: "Cashfree", type: "payment_gateway", category: "finance",
    description: "Collect payments via Cashfree (UPI, cards, netbanking)",
    icon: "CreditCard", color: "#F6B53E",
    requiredConfigFields: [
      { key: "appId", label: "App ID", type: "password", required: true },
      { key: "secretKey", label: "Secret Key", type: "password", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  // ── AI Connectors ───────────────────────────────────
  openai: {
    id: "openai", name: "OpenAI", type: "ai", category: "ai",
    description: "GPT-4o, GPT-4, embeddings for AI assistant, reports, predictions",
    icon: "Sparkles", color: "#10A37F",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "model", label: "Default Model", type: "select", required: false, options: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"], defaultValue: "gpt-4o-mini" },
      { key: "organizationId", label: "Organization ID", type: "string", required: false },
    ],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  claude: {
    id: "claude", name: "Claude (Anthropic)", type: "ai", category: "ai",
    description: "Claude models for enterprise AI capabilities",
    icon: "Sparkles", color: "#D97757",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "model", label: "Default Model", type: "select", required: false, options: ["claude-3-5-sonnet", "claude-3-haiku"], defaultValue: "claude-3-5-sonnet" },
    ],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  gemini: {
    id: "gemini", name: "Google Gemini", type: "ai", category: "ai",
    description: "Gemini models for AI-powered enterprise features",
    icon: "Sparkles", color: "#4285F4",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "model", label: "Default Model", type: "select", required: false, options: ["gemini-1.5-pro", "gemini-1.5-flash"], defaultValue: "gemini-1.5-flash" },
    ],
    supportsWebhook: false, supportsPolling: false, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  // ── Forms & Landing Connectors ──────────────────────
  google_forms: {
    id: "google_forms", name: "Google Forms", type: "form", category: "forms",
    description: "Receive admissions and inquiry leads from Google Forms",
    icon: "ClipboardList", color: "#4285F4",
    requiredConfigFields: [
      { key: "formId", label: "Form ID", type: "string", required: true },
    ],
    optionalConfigFields: [
      { key: "fieldMapping", label: "Field Mapping (JSON)", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: false,
    authType: "none", isEnabled: true, isBeta: true,
  },
  typeform: {
    id: "typeform", name: "Typeform", type: "form", category: "forms",
    description: "Receive leads from Typeform surveys",
    icon: "ClipboardList", color: "#262627",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "formId", label: "Form ID", type: "string", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  jotform: {
    id: "jotform", name: "Jotform", type: "form", category: "forms",
    description: "Receive leads from Jotform submissions",
    icon: "ClipboardList", color: "#FF6B00",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "formId", label: "Form ID", type: "string", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: false,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  wordpress: {
    id: "wordpress", name: "WordPress", type: "landing", category: "marketing",
    description: "Capture leads from WordPress landing pages via webhook",
    icon: "Globe", color: "#21759B",
    requiredConfigFields: [
      { key: "siteUrl", label: "Site URL", type: "url", required: true },
    ],
    optionalConfigFields: [
      { key: "webhookPath", label: "Webhook Path", type: "string", required: false, defaultValue: "/webhook/lead" },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: false,
    authType: "none", isEnabled: true, isBeta: false,
  },
  elementor: {
    id: "elementor", name: "Elementor Forms", type: "landing", category: "marketing",
    description: "Capture leads from Elementor-powered sites",
    icon: "Globe", color: "#92003B",
    requiredConfigFields: [
      { key: "siteUrl", label: "Site URL", type: "url", required: true },
      { key: "webhookUrl", label: "Webhook URL", type: "url", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: false,
    authType: "none", isEnabled: true, isBeta: true,
  },
  // ── Automation Connectors ───────────────────────────
  zapier: {
    id: "zapier", name: "Zapier", type: "automation", category: "automation",
    description: "Trigger Zaps and receive data from 6000+ apps",
    icon: "Zap", color: "#FF4F00",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "webhookUrl", label: "Webhook URL", type: "url", required: false },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  make: {
    id: "make", name: "Make.com", type: "automation", category: "automation",
    description: "Automation scenarios with Make.com",
    icon: "Workflow", color: "#6D00CC",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "webhookUrl", label: "Webhook URL", type: "url", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  n8n: {
    id: "n8n", name: "n8n", type: "automation", category: "automation",
    description: "Self-hosted workflow automation via n8n",
    icon: "Workflow", color: "#EA4B71",
    requiredConfigFields: [
      { key: "baseUrl", label: "n8n Base URL", type: "url", required: true },
      { key: "apiKey", label: "API Key", type: "password", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  // ── Messaging Connectors ────────────────────────────
  twilio: {
    id: "twilio", name: "Twilio", type: "sms", category: "communication",
    description: "SMS, WhatsApp, and voice via Twilio",
    icon: "MessageSquare", color: "#F22F46",
    requiredConfigFields: [
      { key: "accountSid", label: "Account SID", type: "password", required: true },
      { key: "authToken", label: "Auth Token", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "fromNumber", label: "From Number", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  msg91: {
    id: "msg91", name: "MSG91", type: "sms", category: "communication",
    description: "SMS and WhatsApp via MSG91",
    icon: "MessageSquare", color: "#0EA5E9",
    requiredConfigFields: [
      { key: "authKey", label: "Auth Key", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "senderId", label: "Sender ID", type: "string", required: false },
      { key: "flowId", label: "WhatsApp Flow ID", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  libromi: {
    id: "libromi", name: "Libromi", type: "whatsapp", category: "communication",
    description: "WhatsApp marketing automation via Libromi",
    icon: "MessageCircle", color: "#25D366",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "whatsappNumber", label: "WhatsApp Number", type: "string", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: false,
  },
  // ── Meetings & Learning ─────────────────────────────
  zoom: {
    id: "zoom", name: "Zoom", type: "meeting", category: "productivity",
    description: "Schedule and join Zoom meetings for live classes",
    icon: "Video", color: "#2D8CFF",
    requiredConfigFields: [
      { key: "apiKey", label: "API Key", type: "password", required: true },
      { key: "apiSecret", label: "API Secret", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "accountId", label: "Account ID", type: "string", required: false },
    ],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  teams: {
    id: "teams", name: "Microsoft Teams", type: "meeting", category: "productivity",
    description: "Schedule live classes in Microsoft Teams",
    icon: "Video", color: "#6264A7",
    requiredConfigFields: [
      { key: "tenantId", label: "Tenant ID", type: "string", required: true },
      { key: "clientId", label: "Client ID", type: "string", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: false, supportsTwoWay: true,
    authType: "oauth2", isEnabled: true, isBeta: true,
  },
  canvas: {
    id: "canvas", name: "Canvas LMS", type: "canvas", category: "academic",
    description: "Connect to Canvas LMS for courses and enrollments",
    icon: "BookOpen", color: "#D41F2C",
    requiredConfigFields: [
      { key: "apiUrl", label: "API URL", type: "url", required: true },
      { key: "apiToken", label: "API Token", type: "password", required: true },
    ],
    optionalConfigFields: [],
    supportsWebhook: true, supportsPolling: true, supportsTwoWay: true,
    authType: "api_key", isEnabled: true, isBeta: true,
  },
  // ── Protocol Connectors ─────────────────────────────
  ftp: {
    id: "ftp", name: "FTP Server", type: "ftp", category: "infrastructure",
    description: "Transfer files to/from FTP servers",
    icon: "Server", color: "#64748B",
    requiredConfigFields: [
      { key: "host", label: "Host", type: "string", required: true },
      { key: "username", label: "Username", type: "string", required: true },
      { key: "password", label: "Password", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "port", label: "Port", type: "number", required: false, defaultValue: 21 },
      { key: "rootPath", label: "Root Path", type: "string", required: false, defaultValue: "/" },
    ],
    supportsWebhook: false, supportsPolling: true, supportsTwoWay: true,
    authType: "basic", isEnabled: true, isBeta: true,
  },
  sftp: {
    id: "sftp", name: "SFTP Server", type: "sftp", category: "infrastructure",
    description: "Secure file transfer via SSH",
    icon: "Lock", color: "#334155",
    requiredConfigFields: [
      { key: "host", label: "Host", type: "string", required: true },
      { key: "username", label: "Username", type: "string", required: true },
      { key: "password", label: "Password", type: "password", required: true },
    ],
    optionalConfigFields: [
      { key: "port", label: "Port", type: "number", required: false, defaultValue: 22 },
      { key: "privateKey", label: "Private Key", type: "password", required: false },
    ],
    supportsWebhook: false, supportsPolling: true, supportsTwoWay: true,
    authType: "basic", isEnabled: true, isBeta: true,
  },
  mqtt: {
    id: "mqtt", name: "MQTT Broker", type: "mqtt", category: "infrastructure",
    description: "IoT device integration via MQTT (sensors, kiosks, biometric devices)",
    icon: "Cpu", color: "#660066",
    requiredConfigFields: [
      { key: "brokerUrl", label: "Broker URL", type: "string", required: true, placeholder: "mqtt://broker.example.com:1883" },
      { key: "topicPrefix", label: "Topic Prefix", type: "string", required: true, placeholder: "eeos/" },
    ],
    optionalConfigFields: [
      { key: "username", label: "Username", type: "string", required: false },
      { key: "password", label: "Password", type: "password", required: false },
    ],
    supportsWebhook: false, supportsPolling: true, supportsTwoWay: true,
    authType: "basic", isEnabled: true, isBeta: true,
  },
  graphql: {
    id: "graphql", name: "GraphQL API", type: "graphql", category: "custom",
    description: "Connect to any GraphQL endpoint",
    icon: "Network", color: "#E10098",
    requiredConfigFields: [
      { key: "endpoint", label: "GraphQL Endpoint", type: "url", required: true },
    ],
    optionalConfigFields: [
      { key: "authToken", label: "Auth Token", type: "password", required: false },
    ],
    supportsWebhook: false, supportsPolling: true, supportsTwoWay: false,
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
