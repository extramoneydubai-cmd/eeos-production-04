# EEOS Enterprise PDC (Post-Dated Cheque) Engine

**Version:** 0.95  
**Status:** Architecture Reference  

---

## Overview

The PDC Engine manages the complete lifecycle of post-dated cheques collected from students, from cheque inventory and deposit scheduling through bank presentation, clearance, bounce handling, and closure.

## PDC Lifecycle

```
Received → Verified → Scheduled for Deposit → Presented to Bank → Cleared
                              ↓                                        ↓
                         Rescheduled                              Bounced
                              ↓                                        ↓
                         Re-presented                            Replacement
                                                                      ↓
                                                                   Recovery
                                                                      ↓
                                                                   Closure
```

## Schema (Planned)

### `pdcInventory`

| Field | Description |
|-------|-------------|
| studentId | Student reference |
| feeAccountId | Fee account reference |
| chequeNumber | Cheque number |
| bankName | Drawee bank |
| branchName | Bank branch |
| micrCode | MICR code |
| accountHolder | Name on cheque |
| amount | Cheque amount |
| chequeDate | Date on cheque |
| receivedDate | Date received |
| depositDate | Date deposited |
| status | received, verified, deposited, presented, cleared, bounced, replaced, closed |

### `pdcSchedule`

| Field | Description |
|-------|-------------|
| studentId | Student reference |
| feeAccountId | Fee account reference |
| installments | Linked installment IDs |
| scheduleDate | Scheduled deposit date |
| amount | Schedule amount |
| status | pending, deposited, completed |

### `pdcBounceRecord`

| Field | Description |
|-------|-------------|
| pdcId | PDC reference |
| bounceDate | Date of bounce |
| bounceReason | Reason returned by bank |
| penaltyAmount | Penalty charged |
| memoDate | Bank memo date |
| resubmissionDate | Resubmission date (if applicable) |

---

## PDC Collection

### Cheque Intake

When a PDC is received:
1. Record cheque details (number, bank, amount, date)
2. Link to student fee account
3. Generate PDC schedule entry
4. Create deposit calendar reminder
5. Send acknowledgement to student/parent

### Cheque Verification

- Validate cheque number format
- Verify bank and branch details
- Confirm signature (image-based, future)
- Check MICR code validity

---

## Deposit Calendar

The PDC deposit calendar provides:
- Daily deposit schedule
- Upcoming deposits (7-day, 30-day view)
- Pending deposit reminders
- Bank-wise deposit summary

### Deposit Process

1. Select cheques for deposit
2. Generate deposit slip
3. Record deposit date
4. Update PDC status to "deposited"
5. Track clearance timeline (T+2 to T+5)

---

## Clearance Tracking

### Standard Clearance

- Track presentation date
- Monitor clearance TAT (typically 2-3 business days)
- Update status on clearance
- Credit student fee account
- Record settlement in cash book

### Bounce Handling

On cheque bounce:
1. Record bounce reason
2. Apply penalty (configurable)
3. Notify student/parent
4. Notify counselor
5. Update installment status
6. Generate resubmission/litigation workflow

---

## PDC Reports

| Report | Description |
|--------|-------------|
| PDC Inventory | All PDCs by status |
| Deposit Calendar | Upcoming deposits |
| PDC Clearance | Cleared cheques with dates |
| Bounce Register | All bounced cheques |
| PDC Aging | Aging analysis of pending PDCs |
| Bank-wise Summary | PDC summary by bank |
| Student-wise PDC | Complete PDC history by student |

---

## Key Operations (Backend)

| Operation | Description |
|-----------|-------------|
| Record PDC | Record new PDC from student |
| Verify PDC | Update verification status |
| Schedule deposit | Create deposit schedule |
| Mark presented | Mark as presented to bank |
| Mark cleared | Mark as cleared |
| Record bounce | Record bounce event |
| Apply penalty | Apply bounce penalty |
| Resubmit PDC | Resubmit for clearance |
| Replace PDC | Replace with new cheque |
| Close PDC | Close PDC record |
