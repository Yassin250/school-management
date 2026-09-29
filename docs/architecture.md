# System Architecture

**Version:** 1.0
**Scope:** V1 — Single-school Education Management System for Rwanda

---

## 1. Overview

The system is a **modular monolith** built on:

- **Next.js 16 (App Router)** — server-rendered UI + server actions + route handlers
- **TypeScript** — strict mode
- **PostgreSQL** — primary data store
- **Prisma ORM** — schema and data access
- **NextAuth v4** — authentication (credentials + optional Google)
- **TailwindCSS + shadcn/ui** — styling
- **Zod** — validation
- **React Hook Form** — form state
- **`@react-pdf/renderer`** — PDF generation
- **Vitest + Playwright** — testing

No microservices, no Redis, no Kubernetes in V1.

---

## 2. Layering

```text
┌─────────────────────────────────────────────────┐
│ Presentation                                    │
│ - App Router pages                              │
│ - React components                              │
│ - Client forms                                  │
├─────────────────────────────────────────────────┤
│ Application                                     │
│ - Server actions                                │
│ - Route handlers                                │
├─────────────────────────────────────────────────┤
│ Domain / Services                               │
│ - Business logic                                │
│ - Workflow state machines                       │
│ - Validation rules                              │
│ - Permission checks (can / requirePermission)   │
├─────────────────────────────────────────────────┤
│ Data Access                                     │
│ - Repositories                                  │
│ - Prisma client                                 │
├─────────────────────────────────────────────────┤
│ Persistence                                     │
│ - PostgreSQL                                    │
│ - File storage (R2 or local)                    │
└─────────────────────────────────────────────────┘
```

**Rules:**
- UI never talks to Prisma directly. Only via server actions / route handlers.
- Server actions never contain business logic. They call services.
- Services never contain UI logic. They call repositories.
- Repositories never enforce permissions. Services do.
- Audit logging happens inside the service, in the same transaction as the mutation.

---

## 3. Module Structure

```text
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # login, password reset
│   ├── (dashboard)/
│   │   ├── admin/
│   │   ├── principal/
│   │   ├── teacher/
│   │   ├── accountant/
│   │   ├── registrar/
│   │   ├── parent/
│   │   └── student/
│   ├── api/              # REST endpoints (if needed)
│   └── layout.tsx
│
├── modules/              # Domain modules
│   ├── auth/
│   ├── users/
│   ├── students/
│   ├── parents/
│   ├── teachers/
│   ├── academics/
│   ├── curriculum/
│   ├── tvet/
│   ├── enrollments/
│   ├── attendance/
│   ├── assessments/
│   ├── grades/
│   ├── report-cards/
│   ├── timetable/
│   ├── finance/
│   ├── communication/
│   ├── files/
│   └── audit/
│
├── lib/
│   ├── prisma.ts         # singleton
│   ├── auth/             # NextAuth config, session helpers
│   ├── permissions/      # can(), requirePermission(), constants
│   ├── errors/           # error classes
│   ├── audit/            # logAudit()
│   ├── validation/       # shared Zod schemas
│   ├── utils/            # pure helpers
│   └── config/           # env, constants
│
└── components/           # shared UI components
    ├── ui/               # shadcn-style primitives
    ├── forms/
    ├── tables/
    └── layout/
```

Each module under `src/modules/<name>/` contains:
```text
modules/<name>/
├── service.ts            # business logic + permission checks
├── repository.ts         # Prisma queries
├── schema.ts             # Zod schemas for this module
├── types.ts              # TypeScript types
├── actions.ts            # server actions (thin wrappers)
└── components/           # module-specific UI
```

---

## 4. Request Flow

Every request follows this chain:
```text
Request
  ↓
Authentication (NextAuth session)
  ↓
Session resolver (load user, roles, permissions)
  ↓
Server Action / Route Handler
  ↓
Service (business logic)
  ↓
requirePermission(permission, context)
  ↓
Repository (Prisma)
  ↓
Prisma transaction
  ↓
Audit log (in same transaction)
  ↓
Response
```

No layer may be skipped.

---

## 5. Data Model

The Prisma schema defines 40+ models. Grouped by domain:

**Identity and access**
`User`, `Role`, `Permission`, `RolePermission`, `UserRole`

**School**
`SchoolInfo`, `SystemConfig`

**Academic**
`AcademicYear`, `Term`, `Holiday`, `EducationLevel`, `Pathway`

**TVET**
`Trade`, `Module`

**Curriculum**
`Subject`, `SubjectLevel`, `ClassSubject`, `ClassModule`

**People**
`Student`, `Parent`, `ParentStudent`, `Teacher`, `StaffProfile`

**Enrollment**
`Enrollment`, `Class`

**Teaching**
`TeacherAssignment`, `TimetableVersion`, `Lesson`

**Attendance**
`Attendance`

**Assessment**
`Assessment`, `AssessmentResult`, `GradeScale`, `GradeScaleItem`, `GradeCorrectionRequest`

**Reports**
`ReportCard`, `ReportCardItem`

**Finance**
`FeeStructure`, `Invoice`, `InvoiceItem`, `Scholarship`, `InvoiceDiscount`, `Payment`, `Receipt`

**Communication**
`Announcement`, `Notification`

**Files and Audit**
`File`, `AuditLog`

The database enforces:
- Foreign keys
- Unique constraints
- Required fields
- CHECK constraints (positive amounts, ranges, XOR rules)
- Partial unique indexes (one current year, one active timetable, etc.)

---

## 6. Authentication

**V1:** NextAuth v4 with credentials provider. Passwords hashed with bcrypt (cost 12).

**Flow:**
1. User submits email + password
2. Rate-limited (5 attempts / 15 min per email)
3. bcrypt compare
4. Session issued (JWT, 30-day expiry, httpOnly cookie)
5. Session resolver loads user, roles, permissions

**Optional:** Google OAuth — configured but not required for V1.

**Password policy:** min 8 chars, must include upper + lower + digit.

**Password reset:** email with time-limited token (V1.5 feature — V1 uses admin-triggered reset).

---

## 7. Authorization

**Model:** RBAC with resource scoping.

**Implementation:**
- `can(userId, permission, context)` — central check
- `requirePermission(userId, permission, context)` — throws 403 if denied
- Scope resolvers handle teacher/parent/student ownership
- See `docs/rbac.md` for the complete matrix

**Enforcement points:**
- Every server action calls `requirePermission`
- Every API route calls `requirePermission`
- Client-side checks are advisory only

---

## 8. Audit Logging

**Every sensitive mutation writes to `AuditLog` in the same transaction.**

Helper:

```ts
logAudit({
  actorId,
  action,
  entity,
  entityId,
  description?,
  previousValue?,
  newValue?,
  tx,  // pass the transaction client
});
```

`AuditLog` is append-only. No permission to delete audit records through normal application paths.

---

## 9. Validation

Every input is validated with Zod on the server.

- Client forms use the same schema for UX
- Server re-validates — client validation is not trusted
- Zod schemas live in `modules/<name>/schema.ts`
- Errors are formatted consistently and returned as 400 with details.

---

## 10. Transactions

Multi-step mutations use `prisma.$transaction()`.

Examples:
- **Payment:** create payment + update invoice balance + create receipt + audit
- **Enrollment:** create enrollment + assign class + audit
- **Grade approval:** validate results + update status + audit
- **Correction:** create request + update status + audit

**Rule:** if any step fails, all roll back.

---

## 11. File Storage

V1: Cloudflare R2 (S3-compatible) or local disk (dev only).

`File` model stores metadata: `storageKey`, `originalName`, `mimeType`, `size`, `category`, `ownerId`, `uploadedById`.

**Access control:** Every file read goes through a permission check on the associated resource — not just `files.read`.

Report-card PDFs and receipts are generated server-side and stored in the same system.

---

## 12. Background Jobs

V1: Database-backed job table + Vercel Cron (or a scheduled task) — no Redis, no BullMQ.

Use for:
- Report-card PDF generation (queued)
- Receipt PDF generation (queued)
- Bulk notification delivery (in-app only in V1)

Job pattern:
```text
Job {
  id
  type
  payload (JSON)
  status (PENDING | RUNNING | COMPLETED | FAILED)
  attempts
  lastError
  runAt
  createdAt
  updatedAt
}
```

A worker process (or Vercel cron endpoint) picks up jobs, retries failed jobs with exponential backoff, marks persistent failures.

---

## 13. PDF Generation

Library: `@react-pdf/renderer`

Flow:
1. Server action enqueues a PDF job
2. Worker renders the PDF from data
3. Worker uploads the PDF to file storage
4. Worker updates `File` record and links it to the `ReportCard` or `Receipt`

PDFs are served via signed URLs or streamed through an authenticated route.

---

## 14. Caching

V1: No dedicated cache layer beyond Next.js built-in caching.

- Do not introduce Redis for V1.
- Do not cache authorization decisions across requests without invalidation.
- If performance demands it later, add a cache layer with clear invalidation rules.

---

## 15. Error Handling

Status codes:
- **400 Bad Request** — invalid input
- **401 Unauthorized** — not authenticated
- **403 Forbidden** — authenticated but not permitted
- **404 Not Found** — resource doesn't exist
- **409 Conflict** — valid request, illegal state
- **422 Unprocessable Entity** — validation/business rule failure
- **500 Internal Server Error** — unexpected

No stack traces to clients.
All errors logged with correlation IDs.

---

## 16. Logging

V1: Structured logging via a lightweight logger (e.g., pino).

Include:
- Request ID
- User ID (when authenticated)
- Action performed
- Outcome

Never log: passwords, tokens, full PII bodies.

---

## 17. Deployment

V1 target: Vercel + Neon Postgres (or Supabase).

Environments:
- Development — local
- Staging — Vercel preview
- Production — Vercel main

Environment variables via Vercel dashboard.

Secrets: `DATABASE_URL`, `AUTH_SECRET`, `R2_*` credentials, `SENTRY_DSN`, `RESEND_API_KEY` (if email used later).

---

## 18. Testing

Framework: Vitest (unit + integration) + Playwright (E2E).

Coverage targets:
- Permission service — 100%
- Grade workflow service — 100%
- Financial services — 90%
- Repository layer — 80%
- Server actions — 80%
- UI components — 60%

Test database: separate `school_db_test`, reset before each run.

Critical test suites (must exist before V1):
- RBAC authorization (see `docs/rbac.md` §21)
- Grade workflow state machine (see `docs/grade-workflow.md` §24)
- Financial transaction integrity
- IDOR prevention
- Report card gating

---

## 19. Constraints and Non-Goals for V1

**In scope:**
- Single school
- P1–P6, S1–S6, TVET L3–L5
- Full RBAC with 8 roles
- Grade workflow with correction
- Attendance per lesson
- Finance (fees, invoices, payments, receipts)
- Report cards (PDF)
- Manual timetable
- In-app communication only
- Audit logging

**Out of scope for V1:**
- Multi-school / multi-tenant
- Automatic timetable generation
- SMS / WhatsApp / push
- Online payment gateways
- Library, transport, hostel, cafeteria
- Advanced analytics
- Mobile app
- Full accounting package

V2 candidates: the above, plus richer TVET competency tracking, year-end rollover UI, additional communication channels.

---

## 20. Principles

1. **Data first** — schema stable before screens
2. **Server security** — UI visibility is never a security control
3. **Historical integrity** — academic and financial history never overwritten
4. **Configuration over hard-coding** — years, terms, subjects, scales are data
5. **Small reliable V1** — do fewer things well
6. **Reuse business logic** — dashboards consume the same services
7. **Audit sensitive changes** — grades, finance, permissions are traceable
8. **Measure before optimizing** — no infrastructure without need
