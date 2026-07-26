# EEOS Backup Strategy

## Overview

The Backup Manager provides automatic and manual backup for EEOS platform data.

## Backup Types

| Type | Content | Storage | Frequency |
|------|---------|---------|-----------|
| Settings | Theme, debug panel state | localStorage | Hourly (scheduled) |
| Preferences | All eeos_* and convex_* preferences | localStorage | Hourly (scheduled) |
| Feature Flags | Feature flag overrides | localStorage | Hourly (scheduled) |
| Workspace | Workspace preferences | localStorage | On workspace change |
| Manifest | Release manifest | localStorage | On deployment |
| Full | All of the above | localStorage | Manual |

## Schedule

- Default: Every 60 minutes
- Configurable via `BackupSchedule`
- Types: settings, preferences, flags, workspace, manifest

## Restore

- Restore from any backup entry
- Validated before restore
- Full restore of all localStorage keys

## Backup Retention

- Maximum 20 backup entries
- Old entries pruned automatically
- Manual deletion supported
