# Enterprise Document Management System — Guide

## Overview

The Enterprise Document Management System (DMS) is a centralized document repository shared by every EEOS module. No module owns its own file storage. All documents — invoices, receipts, student files, employee records, contracts, certificates, and more — are stored in a single document service and linked via references.

**Architecture Rule:** Every module must use the Document SDK (`documentSdk` or `documentEngine`). No module may implement its own file storage.

## Architecture

```
Enterprise Document Management System
│
├── Documents Store
│   ├── documents            → Master document table with all metadata
│   ├── documentVersions     → Version history with change tracking
│   └── documentPermissions  → Granular access control
│
├── Organization
│   ├── documentFolders      → Hierarchical folder structure
│   └── documentTags         → Tag-based classification with colors
│
├── Activity
│   └── documentTimeline     → 12 event types (upload, download, version, etc.)
│
└── Integration Points
    ├── Person, Student, Employee, Lead
    ├── Invoice, Task, Exam, Course
    ├── Vendor, Asset, Workflow, Project
    └── Procurement, General
```

## Database Tables (6)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `documents` | Document master | name, fileUrl, fileType, version, folderId, tags, referenceType, referenceId, expiryDate, isArchived, digitalSignature, thumbnailUrl |
| `documentFolders` | Hierarchical folders | name, parentId, icon, color, isActive |
| `documentTags` | Tag classification | name, color, isActive |
| `documentPermissions` | Access control | documentId, permissionType (user/role/department/public), targetId, canView/Download/Edit/Delete/Share, expiresAt |
| `documentVersions` | Version history | documentId, versionNumber, fileUrl, fileSize, changeNotes |
| `documentTimeline` | Activity audit trail | documentId, eventType (12 types), description, performedBy, metadata |

## Features

### 1. Folders
- Hierarchical folder structure with `parentId` for nesting
- Custom icon and color per folder
- Active/inactive status

### 2. Tags
- Tag-based classification across documents
- Custom color for visual identification
- Multiple tags per document

### 3. Versioning
- Automatic version tracking on every upload
- Change notes per version
- Full version history with file URLs and sizes

### 4. Permissions
- Granular per-document permissions
- Four permission types: `user`, `role`, `department`, `public`
- Five permission levels: `canView`, `canDownload`, `canEdit`, `canDelete`, `canShare`
- Optional permission expiry
- Merge/update logic for existing permissions

### 5. Expiry
- Optional expiry date per document
- Dashboard shows expired document count
- Timeline events for expired documents

### 6. Reference Linking
Link documents to any entity in the system:
```
Person → Student → Employee → Lead → Invoice → Task
Exam → Course → Vendor → Asset → Workflow → Project
Procurement → General
```

### 7. Digital Signature (Placeholder)
- Schema field `digitalSignature` ready for integration
- Future: signature capture, verification, audit trail

### 8. OCR (Placeholder)
- Schema field `ocrData` ready for integration
- Future: text extraction, search indexing

### 9. Thumbnail Preview
- Optional `thumbnailUrl` for preview generation
- File type-based icon fallback in UI

### 10. Download Tracking
- Automatic download count increment
- Last downloaded timestamp
- Timeline event on every download

### 11. Archive & Restore
- Soft delete via `isArchived` flag
- Full restore from archive
- Timeline event for both archive and restore

### 12. Activity Timeline
| Event Type | Description |
|------------|-------------|
| `uploaded` | Document uploaded |
| `updated` | Metadata updated |
| `downloaded` | File downloaded |
| `deleted` | Document archived |
| `restored` | Document restored |
| `expired` | Document expired |
| `shared` | Permission granted |
| `approved` | Document approved |
| `reviewed` | Document reviewed |
| `version_created` | New version created |
| `tagged` | Tags modified |
| `moved` | Folder changed |

## API Reference

### Document Engine (`documentEngine.ts`)

| Mutation | Description |
|----------|-------------|
| `createFolder(args)` | Create a folder (name, parentId, icon, color) |
| `createTag(args)` | Create a tag (name, color) |
| `uploadDocument(args)` | Upload a document with full metadata |
| `updateDocument(args)` | Update document metadata |
| `createNewVersion(args)` | Create a new document version |
| `recordDownload({ documentId })` | Increment download count |
| `archiveDocument({ id })` | Soft delete / archive |
| `restoreDocument({ id })` | Restore from archive |
| `setDocumentPermission(args)` | Set per-document permission |

| Query | Description |
|-------|-------------|
| `listFolders(filter)` | List folders (optional parentId) |
| `listTags()` | List all active tags |
| `listDocuments(args)` | **Paginated** document list with filters (folderId, referenceType, fileType, search, tagId, includeArchived) |
| `getDocument({ id })` | Full document detail with versions, permissions, timeline |
| `getDocumentTimeline({ documentId })` | Get document activity timeline |
| `getDocumentDashboard()` | Document management dashboard |

### Document SDK (`platform/sdk/documentSdk.ts`)

| Method | Description |
|--------|-------------|
| `upload(args)` | Create document record |
| `get({ documentId })` | Get document by ID |
| `listForEntity({ entityType, entityId })` | List documents for any entity |
| `listByFolder({ folder })` | List documents in a folder |
| `search({ searchText })` | Search documents by name/tags |
| `update(args)` | Update document metadata |
| `remove({ documentId })` | Delete a document |
| `getBatch({ documentIds })` | Get multiple documents |

## Dashboard

The document dashboard (`getDocumentDashboard`) provides:
- Total active documents & archived count
- Total folders
- Total storage size
- Expired document count
- Documents grouped by file type
- Documents grouped by reference type
- Total version count
- Recent activity (last 10 timeline events)

## Integration Pattern

```
Business Module
    │
    ├── Create document:  documentEngine.uploadDocument({...})
    │                     OR documentSdk.upload({...})
    │
    ├── Link document:    { referenceType: "invoice", referenceId: invoiceId }
    │
    ├── Query documents:  documentEngine.listDocuments({ referenceType, referenceId })
    │                     OR documentSdk.listForEntity({ entityType, entityId })
    │
    └── Manage access:    documentEngine.setDocumentPermission({...})
```

## Acceptance Checklist

| Feature | Status |
|---------|:------:|
| ✅ Folders | Complete |
| ✅ Tags | Complete |
| ✅ Versioning | Complete |
| ✅ Permissions | Complete (user/role/department/public) |
| ✅ Expiry | Complete |
| ✅ Reference Linking (14 types) | Complete |
| ✅ Digital Signature (placeholder) | Schema ready |
| ✅ OCR (placeholder) | Schema ready |
| ✅ Thumbnail Preview | Schema ready |
| ✅ Download Tracking | Complete |
| ✅ Archive / Restore | Complete |
| ✅ Timeline (12 event types) | Complete |
| ✅ Paginated Queries | Complete |
| ✅ Dashboard | Complete |
| ✅ SDK | Complete (8 methods) |
| ✅ CRM Integration | Complete (`crmDocuments.ts`) |
