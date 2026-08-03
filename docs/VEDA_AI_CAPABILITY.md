# VEDA_AI_CAPABILITY.md — AI Capability Audit

**Patch:** PATCH-FINAL-001 · Phase 8
**Method:** Every claim traced to `src/convex/aiRuntimeEngine.ts` + `src/convex/entityEngine.ts`. Real question → real runtime chain → real response shape. No fabricated outputs.
**Engine:** `aiRuntimeEngine.processQuery` (`query`, read-only), `getAICapabilities`, `getRoleAICapabilities`, `getQuickExamples`, `ROLE_AI_PROFILES` (8 roles).

---

## 1. What Veda AI can actually access (code-derived)

| Data domain | Accessible? | Mechanism | Evidence |
|---|---|---|---|
| Attendance | ✅ (metadata) | entity keyword `attendance` → ENTITY_REGISTRY entry (displayName, searchFields, quickFilters) | `aiRuntimeEngine.ts` keywordMap: `"attendance": "attendance"` |
| Fees | ✅ (metadata) | keyword `fee`/`invoice` → entity `invoice` | keywordMap `"fee": "invoice"` |
| Refund | ✅ (metadata) | keyword `refund` → entity `refund` | keywordMap |
| PDC / Cheque | ✅ (metadata) | keyword `cheque`/`pdc` → entity `cheque` | keywordMap |
| Tasks | ⚠️ | **No `task` keyword in keywordMap** — task entity NOT in ENTITY_DESCRIPTIONS keys found | keywordMap lacks `task` |
| Timeline | ❌ | Not an entity | — |
| Notifications | ❌ | Not an entity | — |
| Approvals | ⚠️ | `workflow` intent references `approvalTemplates` (metadata), no entity | intent handler |
| Reports | ✅ (metadata) | `analytics`/`report` intents list dashboards/metrics | intent handlers |
| Dashboards | ✅ (metadata) | `dashboard` intent returns `ENTITY_REGISTRY[e].dashboardWidgets` | intent handler |
| Workflow | ⚠️ | `workflow` intent returns workflowTemplates/approvalTemplates (suggestions only) | intent handler |
| LMS | ✅ (metadata) | `course`/`batch` entities | keywordMap |
| CRM (lead) | ✅ (metadata) | `lead` entity | keywordMap |
| Finance (invoice/receipt/payroll) | ✅ (metadata) | `invoice`, `receipt`, `payroll` entities | keywordMap |
| Inventory | ✅ (metadata) | `inventory` entity | keywordMap |
| HR (employee/leave) | ✅ (metadata) | `employee`, `leave` entities | keywordMap |
| Marketing (campaign) | ✅ (metadata) | `campaign` entity | keywordMap |
| Support (ticket) | ✅ (metadata) | `ticket` entity | keywordMap |
| Student / Parent | ✅ (metadata) | `student` entity; parent via student | keywordMap |

**Critical finding:** Veda AI is a **metadata/intent assistant, not a data-access AI**. `processQuery` does NOT read rows from any table. It returns: matched entities, display names, descriptions, quickFilters, searchFields, relationships, dashboardWidgets, document templates, workflow/approval template suggestions, and a generated SQL-hint string (`SELECT * FROM "..." WHERE ...`). It never executes the SQL.

---

## 2. Real Runtime Chain — "Show today's progress" (example verification)

| Step | Code path | Output |
|---|---|---|
| 1. User asks | `processQuery({ query: "Show today's progress" })` | args validated (`v.string`) |
| 2. Intent detection | Intent classifier matches `analytics`/`summarize`/`insight` patterns on `"today"` + `"progress"` | intent = `analytics` (per intent list) |
| 3. Entity detection | keywordMap scan of lowercased query — no entity keywords present | entities = [] |
| 4. Fallback | Handler with zero entities → returns capabilities overview / entity list | `{ entityResults: [], query, intents, ... }` |
| 5. Role profile (optional) | `getRoleAICapabilities({ role })` | intents + quickExamples for role |

**Actual response shape (code-derived from handler):**
- `intents` detected, `entities` matched (may be empty),
- per-entity: `displayName`, `description`, `quickFilters`, `searchFields`, `related`,
- `analytics`: available dashboards + widget lists,
- `search`: generated `SELECT * FROM "<tableName>" WHERE <conditions>` hint string (line 190).

---

## 3. Per-Role Capability Matrix (from `ROLE_AI_PROFILES`)

| Role | Intents | Example questions (from profile quickExamples) | Runtime answer source |
|---|---|---|---|
| CEO | analytics, insight, predict, recommend, summarize, anomaly, report, dashboard | "Which branches are underperforming?" | `processQuery` metadata + `EXECUTIVE_ROLES` dashboards |
| CFO | analytics, insight, predict, anomaly, report, rule, email_draft | "List high-risk bounced cheques" | `processQuery` (cheque entity) |
| HR | analytics, insight, predict, recommend, report, document, email_draft | "Which employees have excess leave balances?" | `processQuery` (employee/leave entities) |
| Faculty | search, analytics, generate, document, schedule, recommend, email_draft | "Find students below 75% attendance" | `processQuery` (student entity + SQL hint) |
| Parent | search, summarize, recommend, email_draft, help | "How is my child performing?" | `processQuery` (student entity) |
| Student | search, summarize, recommend, schedule, help | "What is my timetable?" | `processQuery` (schedule entity) |
| Counsellor | search, analytics, insight, predict, recommend, email_draft | "Prioritize my follow-up calls today" | `processQuery` (lead entity) |
| Marketing | analytics, insight, predict, recommend, report, email_draft, notice | "Which campaign had best ROI?" | `processQuery` (campaign entity) |

---

## 4. Question → Runtime → Actual Response (verified chains)

| Question | Intent | Entity | Actual runtime output |
|---|---|---|---|
| "Show today's progress" | analytics | none | capabilities + empty entity list (generic) |
| "Find students below 75% attendance" | search | student | student displayName/description, `SELECT * FROM "student" WHERE ...` hint |
| "Show collection efficiency by branch" | analytics | (branch not matched → generic) | dashboards list; branch entity exists in keywordMap |
| "List high-risk bounced cheques" | insight/anomaly | cheque | cheque entity + quickFilters |
| "Generate a bonafide certificate" | generate/document | student | documentTemplates for student entity |
| "Create admission approval workflow" | workflow | (admission NOT in keywordMap → generic) | workflowTemplates/approvalTemplates suggestions |
| "Set refund policy" | rule | refund | RULE_DEFINITIONS references |
| "Help me raise a support ticket" | help | ticket | ticket entity description + actions |

---

## 5. Verified AI gaps

1. **Read-only.** `processQuery` is `query` — zero mutations; no AI can create/approve/send anything.
2. **No live data reads.** No `ctx.db.query` on business tables inside AI handler — answers are metadata + SQL hints.
3. **No LLM.** No OpenAI/Anthropic call in `aiRuntimeEngine` (integration `openai.ts` exists as a thin wrapper — NOT VERIFIED wired).
4. **Task entity missing.** No `task` keyword — task-domain AI questions fall to generic.
5. **Admission entity missing.** `admission` keyword absent — workflow questions about admission return generic suggestions.
6. **No chat history / streaming / conversation memory.** Stateless query.
7. **No per-role UI.** Only `AIStudio` page consumes the runtime; no executive AI panel, no portal AI widget.
8. **SQL hints are cosmetic.** `SELECT * FROM "<table>"` strings are returned to the UI, never executed.

---

## 6. AI integration readiness checklist

| Item | Status | Evidence |
|---|---|---|
| Runtime exists | ✅ | `aiRuntimeEngine.ts` |
| Entity registry | ✅ 26+ | `entityEngine.ts` |
| Role profiles | ✅ 8 | `ROLE_AI_PROFILES` |
| UI surface | ⚠️ 1 page | `studios/AIStudio.tsx` |
| Data-access layer | ❌ | no DB reads in AI |
| Action/mutation layer | ❌ | query-only |
| LLM provider wiring | ❌ | `integrations/openai.ts` thin wrapper, no consumer in AI engine |
| Conversation memory | ❌ | stateless |
| Embedded assistant (header/exec/portal) | ❌ | not found |

*Veda AI capability audit generated by PATCH-FINAL-001 — `aiRuntimeEngine.ts` + `entityEngine.ts` tracing.*
