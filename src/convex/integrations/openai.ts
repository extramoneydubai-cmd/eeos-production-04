// @ts-nocheck — This file is type-checked by `npx convex dev`, not by the frontend `tsc`.

/**
 * EEOS OpenAI Integration
 *
 * Connects EEOS to OpenAI's GPT models, embeddings, and generation APIs.
 * Supports:
 * - API key verification (models list)
 * - Chat completions (GPT-4o / GPT-4o-mini / GPT-4-turbo)
 * - Text embeddings (text-embedding-3-small)
 * - Document / email / notice drafting via natural language prompts
 *
 * The `openai` connector is also registered in the Integration Hub
 * (integrationEngine.ts CONNECTOR_REGISTRY), so it can be configured
 * through the connector studio as well.
 *
 * Requires env vars:
 * - OPENAI_API_KEY: OpenAI API key (required)
 */

import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action } from "../_generated/server";

// ─── Helpers ───────────────────────────────────────────────────

const OPENAI_BASE_URL = "https://api.openai.com/v1";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY not configured. Add it in the Keys tab.");
  }
  return key;
}

async function openaiFetch(path: string, init: RequestInit = {}): Promise<any> {
  const apiKey = getApiKey();
  const res = await fetch(`${OPENAI_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.error?.message || JSON.stringify(body);
    } catch {
      // non-JSON error body — fall through to status text
    }
    throw new Error(`OpenAI API error ${res.status}: ${detail || res.statusText}`);
  }

  return res.json();
}

// ─── Actions ───────────────────────────────────────────────────

/**
 * Verify the OPENAI_API_KEY is valid by listing available models.
 * Returns model metadata on success, or { valid: false, error } on failure.
 */
export const verifyKey = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    try {
      const data = await openaiFetch("/models");
      const models = (data.data || []).map((m: any) => m.id);
      return {
        valid: true,
        modelCount: models.length,
        models: models.slice(0, 10),
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return { valid: false, error: msg };
    }
  },
});

/**
 * Run a chat completion against a GPT model.
 * Returns the assistant reply plus usage and model metadata.
 */
export const chatCompletion = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("system"), v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const model = args.model || "gpt-4o-mini";
    const data = await openaiFetch("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model,
        messages: args.messages,
        temperature: args.temperature ?? 0.7,
        max_tokens: args.maxTokens ?? 1024,
      }),
    });

    const choice = data.choices?.[0];
    return {
      content: choice?.message?.content ?? "",
      role: choice?.message?.role ?? "assistant",
      model: data.model || model,
      usage: data.usage || null,
      finishReason: choice?.finish_reason ?? null,
    };
  },
});

/**
 * Generate an embedding vector for a piece of text
 * (used for semantic search, similarity, and AI-assisted matching).
 */
export const createEmbedding = action({
  args: {
    input: v.string(),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const model = args.model || "text-embedding-3-small";
    const data = await openaiFetch("/embeddings", {
      method: "POST",
      body: JSON.stringify({
        model,
        input: args.input,
      }),
    });

    return {
      vector: data.data?.[0]?.embedding ?? [],
      model: data.model || model,
      usage: data.usage || null,
      dimensions: data.data?.[0]?.embedding?.length ?? 0,
    };
  },
});

/**
 * Draft a business document (certificate, letter, email, notice, report)
 * using a contextual prompt. Thin wrapper over chatCompletion that
 * composes a system prompt from the requested document type.
 */
export const draftDocument = action({
  args: {
    documentType: v.union(
      v.literal("certificate"),
      v.literal("letter"),
      v.literal("email"),
      v.literal("notice"),
      v.literal("report"),
      v.literal("custom"),
    ),
    topic: v.string(),
    context: v.optional(v.string()),
    model: v.optional(v.string()),
    tone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const typeLabels: Record<string, string> = {
      certificate: "a formal certificate",
      letter: "a formal letter",
      email: "a professional email",
      notice: "an official notice/circular",
      report: "a concise business report",
      custom: "a document",
    };

    const systemPrompt =
      `You are EEOS AI, an executive assistant for an education enterprise operating system. ` +
      `Draft ${typeLabels[args.documentType] || "a document"} about "${args.topic}". ` +
      `Tone: ${args.tone || "professional and clear"}. ` +
      `Use clean structure with a title, body, and any appropriate placeholders like [Name], [Date], or [Amount]. ` +
      `Do not invent specific facts that were not provided.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: args.context ? `Context to incorporate:\n${args.context}` : `Topic: ${args.topic}` },
    ];

    const model = args.model || "gpt-4o-mini";
    const data = await openaiFetch("/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1536,
      }),
    });

    const choice = data.choices?.[0];
    return {
      documentType: args.documentType,
      topic: args.topic,
      content: choice?.message?.content ?? "",
      model: data.model || model,
      usage: data.usage || null,
    };
  },
});
