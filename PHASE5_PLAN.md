# YANSY — Phase 5: Enterprise Admin Panel
> Audit + Implementation Plan
> Date: 2026-05-29

---

## CURRENT ADMIN AUDIT

### Existing Admin Pages (7)
| Page | Route | Status |
|---|---|---|
| AdminDashboard | /app/admin | ✅ Has KPIs, projects, users, analytics |
| AdminUsers | /app/admin/users | ✅ List, toggle, delete — MISSING: export, bulk, impersonate |
| ProjectRequests | /app/admin/project-requests | ✅ Basic CRUD |
| AdminFeedback | /app/admin/feedback | ✅ Flag, highlight, delete |
| AdminPortfolio | /app/admin/portfolio | ✅ Full CRUD with images |
| AdminAuditLog | /app/admin/audit | ✅ Immutable log viewer |
| AdminAI | /app/admin/ai | ✅ Usage + Claude insights |

### Existing Admin Backend
| Area | Status |
|---|---|
| Auth middleware | `requireAdmin` — binary ADMIN/USER only |
| User roles | Only 2: `USER`, `ADMIN` |
| System settings | HARDCODED in .env — no DB settings |
| Feature flags | HARDCODED in Plan model — no runtime toggle |
| Financial data | Billing endpoints exist — no MRR/ARR aggregation |
| System health | FAKE: hardcoded "Operational" everywhere |
| Broadcast notifications | MISSING entirely |
| Email templates | Code-only — no UI, no DB |
| Impersonation | MISSING entirely |
| Maintenance mode | MISSING entirely |

---

## GAPS IDENTIFIED

### CRITICAL MISSING
1. **SystemSettings model** — all config hardcoded in .env
2. **Role hierarchy** — only USER/ADMIN, no SUPER_ADMIN/MANAGER
3. **Permission middleware** — no granular permission checking
4. **Feature flags at runtime** — can't toggle without code deploy
5. **Real system health** — hardcoded green indicators
6. **Financial dashboard** — no MRR/ARR charts
7. **Broadcast notifications** — no way to message all users
8. **Maintenance mode** — no way to shut down platform without code

### HIGH PRIORITY MISSING
9. User CSV export
10. Impersonation (SUPER_ADMIN only)
11. Email template viewer
12. Admin settings page (system settings UI)

---

## IMPLEMENTATION ORDER

1. **SystemSettings model** — DB-backed settings (replaces hardcoded config)
2. **Extended roles** — SUPER_ADMIN, MANAGER added to User
3. **Permission middleware** — granular `requirePermission()` 
4. **System health** — real checks (DB, Stripe, Cloudinary, email)
5. **SystemSettings controller + routes** — CRUD for settings
6. **Feature flags** — runtime toggles stored in SystemSettings
7. **Financial Dashboard** — MRR/ARR from subscription data
8. **Broadcast Notifications** — send to all/segment
9. **Admin Settings page** — full settings UI
10. **Impersonation** — SUPER_ADMIN only, fully audited
11. **User export** — CSV download
12. **Tests** — all new features covered

---

## DATA MODELS

### SystemSettings
```javascript
{
  key:         string (unique, e.g. 'platform.name'),
  value:       Mixed,
  type:        'string' | 'number' | 'boolean' | 'json',
  category:    'general' | 'security' | 'email' | 'payments' | 'ai' | 'platform',
  label:       string,
  description: string,
  isPublic:    boolean, // whether to expose to frontend
  updatedBy:   ObjectId → User,
}
```

### Default Settings
- `platform.name` = 'YANSY'
- `platform.maintenanceMode` = false
- `platform.registrationEnabled` = true
- `security.sessionTimeoutMinutes` = 10080 (7 days)
- `security.maxLoginAttempts` = 10
- `ai.enabled` = true
- `ai.defaultModel` = 'claude-sonnet-4-6'
- `ai.rateLimitPro` = 20
- `ai.rateLimitEnterprise` = 100
- `features.search` = true
- `features.notifications` = true
- `features.invoicing` = true
- `features.referrals` = false (future)

---

## PERMISSION MATRIX

| Permission | USER | MANAGER | ADMIN | SUPER_ADMIN |
|---|---|---|---|---|
| projects.view.own | ✅ | ✅ | ✅ | ✅ |
| projects.view.all | ❌ | ✅ | ✅ | ✅ |
| projects.edit | ❌ | ✅ | ✅ | ✅ |
| projects.delete | ❌ | ❌ | ✅ | ✅ |
| users.view | ❌ | ✅ | ✅ | ✅ |
| users.edit | ❌ | ❌ | ✅ | ✅ |
| users.delete | ❌ | ❌ | ✅ | ✅ |
| users.impersonate | ❌ | ❌ | ❌ | ✅ |
| billing.view | ❌ | ✅ | ✅ | ✅ |
| billing.manage | ❌ | ❌ | ✅ | ✅ |
| settings.view | ❌ | ✅ | ✅ | ✅ |
| settings.edit | ❌ | ❌ | ✅ | ✅ |
| system.configure | ❌ | ❌ | ❌ | ✅ |
| ai.configure | ❌ | ❌ | ✅ | ✅ |
| audit.view | ❌ | ✅ | ✅ | ✅ |

---

*Plan approved. Beginning implementation immediately.*
