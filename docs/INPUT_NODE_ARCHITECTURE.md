# INPUT_NODE_ARCHITECTURE.md — Input Node Architecture

**Patch:** PATCH-FINAL-001 · Phase 6
**Method:** For every business module: enumerate input sources actually present in code (mutation entry points, engines, tables). Sources not found in code are marked ❌ NOT WIRED.
**Legend:** ✅ Wired in code · ⚠️ Partial (queue/engine exists, adapter not verified) · ❌ Not present

---

## 1. Attendance

| Input Source | Status | Code path |
|---|---|---|
| Face | ✅ | `attendanceVerificationEngine.registerFace` + `markWithFace` |
| QR | ✅ | `attendanceVerificationEngine.issueQrToken` + `verifyQrMark`; `personQRCode.generateQRCode` |
| GPS | ✅ | `attendanceVerificationEngine.markWithGps` + `saveGeofence`/`getGeofence` |
| RFID | ❌ | No RFID node found |
| API | ⚠️ | `attendanceEngine.bulkMarkAttendance` (bulk, not external API) |
| Webhook | ❌ | No attendance webhook |
| Offline | ⚠️ | `bulkMarkAttendance` supports offline-style bulk entry; no offline sync queue found |
| CSV | ⚠️ | Bulk entry path exists; CSV import adapter NOT VERIFIED |
| Manual | ✅ | `attendanceEngine.markAttendance` (UI) |

## 2. Lead / CRM

| Input Source | Status | Code path |
|---|---|---|
| Website form | ⚠️ | `intakeEngine` → `intakeSubmissions` (form intake); landing form → lead NOT VERIFIED |
| Google Forms | ⚠️ | `intakeTransformMappings` supports mapping; Google Forms adapter NOT VERIFIED |
| Facebook / Meta | ⚠️ | `crmSources`, `crmUtmCampaigns` support source attribution; Meta API adapter NOT VERIFIED |
| WhatsApp | ✅ | `crmWhatsApp` + `whatsappEngine.processWhatsAppQueue` + `handleProviderCallback` |
| Zapier | ⚠️ | `integrationEngine`/`webhooks` table exists; Zapier adapter NOT VERIFIED |
| Webhook | ⚠️ | `webhooks` table in enterprise schema; webhook→lead handler NOT VERIFIED |
| API | ⚠️ | `crmLeads.createLead` mutation callable; public API gateway NOT VERIFIED |
| Manual | ✅ | LeadDatabase / LeadWorkspace UI create |

## 3. Inventory

| Input Source | Status | Code path |
|---|---|---|
| Scanner | ❌ | No scanner node |
| Barcode | ❌ | No barcode node |
| QR | ⚠️ | `personQRCode` for people; item QR NOT VERIFIED |
| Purchase | ✅ | `procurementEngine` → `goodsReceipts`/`goodsReceiptItems` → stock |
| Transfer | ✅ | `transfers` table + `inventoryBranchEngine` (branch transfer) |
| API | ⚠️ | `inventoryEngine` mutations; external API NOT VERIFIED |
| CSV | ⚠️ | Bulk import adapter NOT VERIFIED |
| Manual | ✅ | InventoryWorkspace UI |

## 4. Finance / Collections / Payments

| Input Source | Status | Code path |
|---|---|---|
| Manual entry | ✅ | `collectionEngine`, `paymentEngine` → `paymentTransactions` |
| Payment gateway | ⚠️ | `paymentMethods` table; gateway integration NOT VERIFIED |
| Bank statement | ✅ | `bankReconciliationEngine` → `bankStatements`, `bankStatementEntries` |
| Cheque/PDC | ✅ | `chequeEngine` → `chequeEntries` |
| Refund request | ✅ | `refundEngine` → `refundRequests` |
| Webhook (provider callback) | ✅ | `whatsappEngine`/`emailEngine`/`smsEngine` `handleProviderCallback` (communication, not payments) |
| CSV | ⚠️ | Finance import adapter NOT VERIFIED |

## 5. HR / Payroll / Leave

| Input Source | Status | Code path |
|---|---|---|
| Manual | ✅ | `employeeEngine` → `employeeMaster` |
| Leave application | ✅ | `leaveEngine` → `leaveApplications` |
| Recruitment portal | ⚠️ | `candidateEngine` + `jobPostings`; external career portal NOT VERIFIED |
| Attendance link | ⚠️ | attendance → payroll link NOT VERIFIED |
| CSV | ⚠️ | Bulk employee import NOT VERIFIED |

## 6. Support / Tickets

| Input Source | Status | Code path |
|---|---|---|
| Manual (UI) | ✅ | `supportEngine` → `ticketMaster` |
| Email | ⚠️ | `emailEngine` queue exists; email→ticket NOT VERIFIED |
| WhatsApp | ⚠️ | `whatsappEngine`; WhatsApp→ticket NOT VERIFIED |
| Webhook | ⚠️ | `webhooks` table; ticket webhook NOT VERIFIED |
| API | ⚠️ | `supportEngine` mutations callable; public API NOT VERIFIED |

## 7. Marketing Campaigns

| Input Source | Status | Code path |
|---|---|---|
| Manual | ✅ | `communicationCampaignEngine` → `campaigns` |
| Email/SMS/WhatsApp queues | ✅ | `emailEngine`/`smsEngine`/`whatsappEngine` process queues |
| Campaign schedule | ✅ | `campaignSchedules` table |
| UTM attribution | ✅ | `crmUtmSources/Mediums/Campaigns` |
| Landing page publish | ⚠️ | `marketing.landing.published` event; landing builder NOT VERIFIED |

## 8. Intake / Admissions

| Input Source | Status | Code path |
|---|---|---|
| Web form | ✅ | `intakeEngine` → `intakeSubmissions` + `intakeTimeline` |
| Routing rules | ✅ | `intakeRoutingRules` |
| Duplicate detection | ✅ | `intakeDuplicateRules` |
| Transform mappings | ✅ | `intakeTransformMappings` |
| API | ⚠️ | Public intake API NOT VERIFIED |

## 9. Documents

| Input Source | Status | Code path |
|---|---|---|
| Upload | ✅ | `documentEngine.uploadDocument` (+ `attachments` table) |
| Auto-generation | ✅ | `documentAutoGeneration` → `generatedDocuments` (32 types) |
| Versioning | ✅ | `documentEngine.createNewVersion` → `documentVersions` |

## 10. Administration (Visitors, Assets, Stationery)

| Input Source | Status | Code path |
|---|---|---|
| Manual | ✅ | `adminOpsEngine` → visitors, meetingRooms, officeAssets, stationery |
| Visitor QR | ✅ | `personQRCode` + visitors table |
| Vendor visits | ✅ | `vendorVisits` table |
| Utility bills | ✅ | `utilityBills` table |
| AMC contracts | ✅ | `amcContracts` table |

## 11. Examinations / LMS

| Input Source | Status | Code path |
|---|---|---|
| Manual marks | ✅ | `marksEngine` → `examMarks` |
| Question bank | ✅ | `questionPaperEngine` → `questionBank`, `lmsQuestionBank` |
| LMS content upload | ✅ | `lmsContentUploads` + `documentEngine` |
| Quiz submissions | ✅ | `lmsQuizAttempts`, `lmsSubmissions` |
| API/CSV | ❌ | Not found |

## 12. Technology / Observability

| Input Source | Status | Code path |
|---|---|---|
| Runtime metrics | ✅ | `runtimeObservability` (queues, health, SLA) |
| Deployment events | ✅ | `deploymentHistory`, `techMetrics` |
| Integration logs | ✅ | `integrationAuditEngine` → `integrationAuditRecords` |
| Scheduled jobs | ⚠️ | `scheduledJobs` table; cron runner `crons.disabled.ts` (⚠️ disabled) |

---

## Summary

| Module | Wired nodes | Total requested | Coverage |
|---|---|---|---|
| Attendance | Face, QR, GPS, Manual, Bulk | 9 | 5/9 (RFID/API/webhook/CSV missing) |
| Lead/CRM | WhatsApp, Manual, Intake form, UTM | 9 | 4/9 (FB/Zapier/webhook/API adapters missing) |
| Inventory | Purchase, Transfer, Manual | 6 | 3/6 (scanner/barcode/CSV missing) |
| Finance | Manual, Bank, Cheque | 6 | 3/6 (gateway/CSV missing) |
| HR | Manual, Leave, Recruitment | 5 | 3/5 |
| Support | Manual | 5 | 1/5 (email/WhatsApp/webhook/API → ticket missing) |
| Marketing | Manual, Queues, UTM | 5 | 5/5 |
| Intake | Form, Routing, Dupe, Transform | 4 | 4/4 |
| Documents | Upload, Auto-gen, Version | 3 | 3/3 |
| Administration | Manual, QR, Bills | 6 | 6/6 |
| Exams/LMS | Manual, Q-Bank, Upload, Quiz | 5 | 4/5 |
| Technology | Runtime, Deploy, Integration, Jobs | 4 | 3/4 (cron disabled) |

**Headline:** 12 modules × input-node matrix built. **Fully wired:** Marketing, Intake, Documents, Administration. **Weakest:** Support (1/5), Finance gateway (❌), Attendance hardware (RFID ❌).

*Input node architecture generated by PATCH-FINAL-001 — mutation/engine/table code-derived evidence.*
