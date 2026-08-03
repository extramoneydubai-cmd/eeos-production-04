# GUIDED_ONBOARDING.md — Guided Onboarding Tutorial (Odoo-style)

**Patch:** PATCH-FINAL-001 · Phase 11
**Method:** Describes the onboarding task model, completion tracking, and step-by-step wizard flow. References actual screens/engines. Where a wizard does not exist in code, it is marked ❌ NOT IMPLEMENTED (proposed model below is derived from existing screens and `onboardingEngine.ts`).
**Verified anchor:** `onboardingEngine.ts` exists (onboarding tasks) + `seed.ts` seeds org/departments/users. First login: `ceo/admin123`.

---

## 1. First Login Experience (verified)

| Step | Screen | Code path |
|---|---|---|
| 1 | Navigate to app → `/` or `/login` | `Login.tsx` → `authHelpers.login` |
| 2 | Sign in `ceo` / `admin123` | `seedUserPasswords` seeds password; session created |
| 3 | Land on `/dashboard` | `Login.tsx` navigates to `/dashboard`; `Dashboard.tsx` → `api.dashboard.getDashboardData` |
| 4 | (Proposed) Onboarding wizard banner | ❌ NOT IMPLEMENTED — no first-run wizard in code |

---

## 2. Onboarding Task Model (proposed, Odoo-style)

### Task fields (modeled on `onboardingTasks` table + `onboardingEngine.ts`)

| Field | Type | Purpose |
|---|---|---|
| `id` | Id | task key |
| `title` | string | "Create your first branch" |
| `description` | string | guidance text |
| `route` | string | deep link (e.g. `/studios/master-data/organization/branches`) |
| `dependencies` | string[] | prerequisite task ids |
| `status` | todo / in_progress / done / skipped | completion state |
| `completionRule` | query | how the app detects "done" (row exists? count > 0?) |
| `order` | number | wizard sequencing |

### Task list (derived from `CLIENT_IMPLEMENTATION_GUIDE.md` steps + real screens)

| # | Task | Route | Dependency | Completion rule (proposed) |
|---|---|---|---|---|
| 1 | Create your first company | `/studios/master-data/organization/companies` | — | `companies` count > 0 |
| 2 | Create your first branch | `/studios/master-data/organization/branches` | 1 | `branches` count > 0 |
| 3 | Create your first department | `/studios/master-data/organization/departments` | 2 | `departments` count > 0 |
| 4 | Add a designation (e.g. CEO) | `/studios/master-data/organization/designations` | 3 | `designations` count > 0 |
| 5 | Create your first team | `/studios/master-data/organization/teams` | 3 | `teams` count > 0 |
| 6 | Create your first user | `/users` | 4 | `users` count > seeded |
| 7 | Assign user scope | `/users` (scope editor) | 6 | `userScopes` count > 0 |
| 8 | Configure academic vertical | `/studios/master-data/academic/verticals` | 3 | `academicVerticals` count > 0 |
| 9 | Add a program | `/studios/master-data/academic/programs` | 8 | `academicPrograms` count > 0 |
| 10 | Add a subject | `/studios/master-data/academic/subjects` | 9 | `academicSubjects` count > 0 |
| 11 | Create a batch | `/studios/master-data/academic/batches` | 10 | `academicBatches` count > 0 |
| 12 | Add faculty | `/faculty` / `/employees` | 11 | `faculty` count > 0 |
| 13 | Enroll your first student | `/students` | 12 | `studentMaster` count > 0 |
| 14 | Create a fee structure | `/finance` | 13 | `feeStructures` count > 0 |
| 15 | Record your first payment | `/collections` | 14 | `paymentTransactions` count > 0 |
| 16 | Mark attendance for a batch | `/attendance` | 13 | `attendance` count > 0 |
| 17 | Create your first task | `/tasks` | 6 | `tasks` count > 0 |
| 18 | Send an announcement | `/messenger` | 6 | `messages` type=announcement count > 0 |

### Completion % (proposed formula)

```
Completion % = (done + skipped) / totalTasks × 100
```

Per-group progress: Governance / Academics / Finance / Operations — each with own % (modeled on Odoo module-level progress).

---

## 3. Wizard UI Spec (proposed — NOT IMPLEMENTED)

| Element | Behavior | Reference screen |
|---|---|---|
| Welcome card | "Welcome to EEOS Lite — let's set up Veda EdTech in 18 steps" | `/dashboard` banner slot |
| Progress ring | overall completion % | header widget |
| Task card | title, description, "Go" button → deep link to real screen, status pill | dashboard card |
| Dependencies | locked tasks show "Complete X first" | card lock state |
| Checkbox | mark done / skip | task card |
| Next recommended task | highlights first incomplete dependency-satisfied task | card highlight |

**Where to implement (proposed):** new `OnboardingWizard` component on `/dashboard` reading `api.onboardingEngine.*`; completion rules as `query`s over existing tables (no schema change beyond `onboardingTasks` which already exists).

---

## 4. Implementation status

| Item | Status | Evidence |
|---|---|---|
| `onboardingEngine.ts` (tasks) | ✅ engine exists | `src/convex/onboardingEngine.ts` |
| `onboardingTasks` table | ✅ | `enterprise.ts` schema (`onboardingTasks`) |
| Seed data ready (org/users) | ✅ | `seed.ts` |
| First-run wizard UI | ❌ NOT IMPLEMENTED | no component found |
| Completion queries | ❌ NOT IMPLEMENTED | — |
| Task dependency engine | ❌ NOT IMPLEMENTED | — |

**Recommended build order (post-audit):**
1. `onboardingEngine` queries: `getOnboardingProgress`, `getNextTask` (reuse existing table)
2. Dashboard wizard card component
3. Deep links to the 18 real screens listed above (all routes verified in Phase 2)

*Guided onboarding generated by PATCH-FINAL-001 — engine + route derived.*
