# EEOS Customer Provisioning

## Overview

The Provisioning Manager enables one-click organization setup for new EEOS customers.

## What Gets Created

| Entity | Description |
|--------|-------------|
| Organization | Named organization with code |
| CEO User | Administrator user account |
| Branch | Primary campus/branch |
| Academic Year | Default academic year |
| Roles | admin, manager, staff, faculty, student, parent |
| Permissions | 18 default permissions |
| Feature Flags | All platform feature flags initialized |

## Provisioning Flow

1. Navigate to `/deployment` → Provisioning tab
2. Click "Provision Demo Organization"
3. System creates all entities automatically
4. Result shows success/failure per step

## Customization

The provisioning template can be customized in `ProvisioningManager.ts`:

```typescript
const template: ProvisioningRequest = {
  organizationName: "Your Academy",
  organizationCode: "CODE",
  ceoName: "CEO Name",
  ceoEmail: "ceo@academy.edu",
  branchName: "Main Campus",
  academicYear: "2026-2027",
};
```

## Default Permissions

- org:read, org:write, org:admin
- branch:read, branch:write
- student:read, student:write, student:admin
- employee:read, employee:write
- finance:read, finance:write
- crm:read, crm:write
- academic:read, academic:write
