import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── HELPERS ───────────────────────────────────────────────

function extractVariables(text: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const vars: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (!vars.includes(match[1])) vars.push(match[1]);
  }
  return vars;
}

function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || `{{${key}}}`);
}

// ─── TEMPLATE CRUD ─────────────────────────────────────────

export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    channel: v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push"), v.literal("in_app")),
    subject: v.optional(v.string()),
    body: v.string(),
    category: v.optional(v.string()),
    isSystem: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const variables = extractVariables(args.body);
    if (args.subject) {
      const subjectVars = extractVariables(args.subject);
      variables.push(...subjectVars.filter((v) => !variables.includes(v)));
    }

    const id = await ctx.db.insert("communicationTemplates", {
      name: args.name,
      code: args.code,
      description: args.description,
      channel: args.channel,
      subject: args.subject,
      body: args.body,
      variables: variables.length > 0 ? variables : undefined,
      category: args.category,
      isActive: true,
      isSystem: args.isSystem || false,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("communicationTemplates"),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    body: v.optional(v.string()),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const patch: Record<string, any> = { ...fields, updatedAt: Date.now() };

    if (fields.body) {
      const variables = extractVariables(fields.body);
      patch.variables = variables.length > 0 ? variables : undefined;
    }
    if (fields.subject) {
      const existing = await ctx.db.get(id);
      const body = fields.body || existing?.body || "";
      const subject = fields.subject;
      const allVars = extractVariables(body);
      const subjectVars = extractVariables(subject);
      allVars.push(...subjectVars.filter((v) => !allVars.includes(v)));
      patch.variables = allVars.length > 0 ? allVars : undefined;
    }

    await ctx.db.patch(id, patch);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("communicationTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const duplicate = mutation({
  args: { id: v.id("communicationTemplates") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const original = await ctx.db.get(args.id);
    if (!original) throw new Error("Template not found");

    return ctx.db.insert("communicationTemplates", {
      name: `${original.name} (Copy)`,
      code: `${original.code}_copy`,
      description: original.description,
      channel: original.channel,
      subject: original.subject,
      body: original.body,
      variables: original.variables,
      category: original.category,
      isActive: true,
      isSystem: false,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const list = query({
  args: {
    channel: v.optional(v.union(v.literal("email"), v.literal("whatsapp"), v.literal("sms"), v.literal("push"), v.literal("in_app"))),
    category: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("communicationTemplates");
    const filters: any[] = [];
    if (args.channel) {
      query = query.filter((q: any) => q.eq(q.field("channel"), args.channel));
    }
    if (args.category) {
      query = query.filter((q: any) => q.eq(q.field("category"), args.category));
    }
    if (args.isActive !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("isActive"), args.isActive));
    }
    let results = await query.order("desc").collect();
    if (args.searchQuery) {
      const q = args.searchQuery.toLowerCase();
      results = results.filter((t: any) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    }
    return results;
  },
});

export const get = query({
  args: { id: v.id("communicationTemplates") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const getByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return ctx.db.query("communicationTemplates")
      .withIndex("code", (q: any) => q.eq("code", args.code))
      .first();
  },
});

// ─── TEMPLATE RENDERING ────────────────────────────────────

export const render = mutation({
  args: {
    templateId: v.id("communicationTemplates"),
    variables: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.get(args.templateId);
    if (!template) throw new Error("Template not found");

    let vars: Record<string, string> = {};
    try { vars = JSON.parse(args.variables); } catch {}

    const renderedBody = renderTemplate(template.body, vars);
    const renderedSubject = template.subject ? renderTemplate(template.subject, vars) : undefined;

    return {
      subject: renderedSubject,
      body: renderedBody,
      channel: template.channel,
      templateCode: template.code,
    };
  },
});

export const renderFromCode = mutation({
  args: {
    templateCode: v.string(),
    variables: v.string(),
  },
  handler: async (ctx, args) => {
    const template = await ctx.db.query("communicationTemplates")
      .withIndex("code", (q: any) => q.eq("code", args.templateCode))
      .first();
    if (!template) throw new Error(`Template not found: ${args.templateCode}`);

    let vars: Record<string, string> = {};
    try { vars = JSON.parse(args.variables); } catch {}

    return {
      subject: template.subject ? renderTemplate(template.subject, vars) : undefined,
      body: renderTemplate(template.body, vars),
      channel: template.channel,
      templateCode: template.code,
    };
  },
});

// ─── SEED DEFAULT TEMPLATES ────────────────────────────────

export const seedDefaults = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const seedTemplates = [
      {
        name: "Admission Confirmation",
        code: "admission_confirmation",
        channel: "email" as const,
        subject: "Welcome to {{institution}} — Admission Confirmed",
        body: "Dear {{studentName}},\n\nCongratulations! Your admission to {{course}} at {{institution}} has been confirmed.\n\nAdmission Number: {{admissionNumber}}\n\nPlease visit the campus on or before {{joiningDate}} to complete your enrollment.\n\nBest regards,\n{{institution}}",
        category: "admission",
        isSystem: true,
      },
      {
        name: "Fee Reminder",
        code: "fee_reminder",
        channel: "email" as const,
        subject: "Fee Reminder — {{dueAmount}} Due on {{dueDate}}",
        body: "Dear {{studentName}},\n\nThis is a reminder that your fee of {{dueAmount}} is due on {{dueDate}}.\n\nOutstanding Balance: {{outstandingBalance}}\n\nPlease make the payment before the due date to avoid late fees.\n\nBest regards,\n{{institution}}",
        category: "fee",
        isSystem: true,
      },
      {
        name: "Meeting Reminder",
        code: "meeting_reminder",
        channel: "whatsapp" as const,
        subject: "",
        body: "Dear {{recipientName}},\n\nThis is a reminder for your {{meetingType}} scheduled on {{meetingDate}} at {{meetingTime}}.\n\nLocation: {{location}}\n\nPlease be on time.\n\nThank you,\n{{institution}}",
        category: "meeting",
        isSystem: true,
      },
      {
        name: "WhatsApp Admission Alert",
        code: "whatsapp_admission_alert",
        channel: "whatsapp" as const,
        subject: "",
        body: "Admission Confirmed\n\nStudent: {{studentName}}\nCourse: {{course}}\nAdmission No: {{admissionNumber}}\n\nWelcome to {{institution}}!",
        category: "admission",
        isSystem: true,
      },
      {
        name: "SMS Fee Alert",
        code: "sms_fee_alert",
        channel: "sms" as const,
        subject: "",
        body: "Dear {{studentName}}, fee of {{dueAmount}} is due on {{dueDate}}. Pay now to avoid late fee. - {{institution}}",
        category: "fee",
        isSystem: true,
      },
      {
        name: "In-App Notification — Task Assigned",
        code: "task_assigned",
        channel: "in_app" as const,
        subject: "Task Assigned: {{taskTitle}}",
        body: "You have been assigned a new task:\n\n{{taskTitle}}\n\nPriority: {{priority}}\nDue Date: {{dueDate}}\n\nAssigned by: {{assignedBy}}",
        category: "task",
        isSystem: true,
      },
      {
        name: "Push — Lead Assignment",
        code: "push_lead_assigned",
        channel: "push" as const,
        subject: "New Lead Assigned",
        body: "Lead {{leadName}} has been assigned to you. Priority: {{priority}}. Please follow up.",
        category: "lead",
        isSystem: true,
      },
      {
        name: "Birthday Wishes",
        code: "birthday_wishes",
        channel: "email" as const,
        subject: "Happy Birthday {{recipientName}}!",
        body: "Dear {{recipientName}},\n\nWishing you a very happy birthday! May your day be filled with joy and success.\n\nWarm regards,\n{{institution}}",
        category: "celebrations",
        isSystem: true,
      },
      {
        name: "SMS Attendance Alert",
        code: "sms_attendance_alert",
        channel: "sms" as const,
        subject: "",
        body: "Dear Parent, {{studentName}} was absent on {{date}}. Please ensure regular attendance. - {{institution}}",
        category: "attendance",
        isSystem: true,
      },
    ];

    const results: string[] = [];
    for (const tmpl of seedTemplates) {
      const existing = await ctx.db.query("communicationTemplates")
        .withIndex("code", (q: any) => q.eq("code", tmpl.code))
        .first();
      if (!existing) {
        const id = await ctx.db.insert("communicationTemplates", {
          ...tmpl,
          variables: extractVariables(tmpl.body),
          isActive: true,
          createdBy: userId ?? undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.push(tmpl.code);
      }
    }
    return { seeded: results };
  },
});
