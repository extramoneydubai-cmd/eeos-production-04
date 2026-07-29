# EEOS Enterprise Cheque Bounce Workflow

**Version:** 0.95  
**Status:** Architecture Reference  

---

## Overview

The Cheque Bounce Workflow is a configurable business process that handles cheque/PDS returns from the bank. It integrates with the Workflow Engine, Notification Engine, and Event Pipeline to automate the complete bounce lifecycle.

## Default Policy (Configurable)

### First Bounce
- Penalty: 500 (configurable)
- Notify parent via SMS/Email/WhatsApp
- Notify counselor via in-app notification
- Reschedule payment within 7 days
- Record in student timeline

### Second Bounce
- Penalty: 500 (configurable)
- Escalate to Finance Manager
- Block additional PDC/cheque acceptance
- Remaining balance becomes immediately payable
- Future payments limited to approved digital/bank methods (unless overridden)

### Third Bounce / Legal Threshold
- Escalate to Director/CEO
- Initiate legal notice
- Send final collection notice
- Trigger recovery workflow
- Mark student account as high-risk

---

## Configurable Rules

| Rule | Default | Configurable |
|------|---------|-------------|
| Penalty amount | $500 | Yes (per bounce) |
| Maximum bounce count | 3 | Yes |
| Grace period for resubmission | 7 days | Yes |
| Allowed payment modes after bounce | Digital/Bank | Yes |
| Escalation chain | Counselor → Finance → Director → CEO | Yes |
| Legal notice trigger | 3rd bounce | Yes |

---

## Workflow Steps

```
1. PDC Bounce Detected
   ↓
2. Record Bounce Details
   ├── Bank return memo
   ├── Bounce reason (insufficient funds, signature mismatch, etc.)
   ├── Bank memo date
   └── Penalty calculated
   ↓
3. Determine Bounce Count
   ├── First Bounce → Step 4a
   ├── Second Bounce → Step 4b
   └── Third+ Bounce → Step 4c
   ↓
4. Execute Bounce Policy
   ├── 4a First: Penalty + Notify + Reschedule
   ├── 4b Second: Penalty + Escalate + Restrict Payments
   └── 4c Third: Legal + Recovery + Account Mark
   ↓
5. Generate Timeline Event
   ↓
6. Send Notifications
   ├── Parent/SMS
   ├── Student/App
   ├── Counselor/App
   └── Finance Manager/Email (if escalated)
   ↓
7. Update PDC Record
   └── Status → Bounced
       └── Replacement PDC or Alternative Payment
```

---

## Integration Points

| Component | Integration |
|-----------|-------------|
| Workflow Engine | Configurable approval chains, escalation rules |
| Notification Engine | Email, SMS, WhatsApp, Push, In-app |
| Event Pipeline | Timeline, Activity, Audit, Operations events |
| Scheduling | Payment rescheduling, follow-up reminders |
| Security | Permission checks for overrides |
| Runtime Supervisor | Real-time monitoring of bounce workflows |
