# ADR 0001 — Stack and Architecture Decisions

**Status:** Accepted
**Date:** 2026-09-26
**Context:** Building a single-school Education Management System for a private Rwandan institution (General P1–P6, S1–S6 + TVET L3–L5).

---

## Decisions

### 1. Authentication: NextAuth v4 (stable)

- **Rationale:** Battle-tested, well-documented, works with App Router, wide ecosystem.
- **Rejected:** Auth.js v5 beta (moving target), Lucia (less ecosystem).
- **Revisit:** When Auth.js v5 reaches stable release.

### 2. Deployment: Vercel + Neon Postgres (V1)

- **Rationale:** Fastest path to a working, secure deployment. Managed backups. Zero ops burden.
- **Rejected:** Self-hosted VPS (ops burden too high for V1).
- **Revisit:** If cost becomes prohibitive or data residency requires Rwandan hosting.

### 3. File Storage: Cloudflare R2 (S3-compatible)

- **Rationale:** Cheap, S3-compatible, no egress fees, works with `@aws-sdk/client-s3`.
- **Rejected:** Local disk (ephemeral), Vercel Blob (vendor lock-in).
- **Fallback:** Local disk + daily backup for dev.

### 4. PDF Generation: `@react-pdf/renderer`

- **Rationale:** Declarative, React-based, runs server-side, no headless browser.
- **Rejected:** Puppeteer (heavy, browser dependency), PDFKit (imperative, less maintainable).

### 5. Background Jobs: Database-backed job table + Vercel Cron (V1)

- **Rationale:** No Redis needed for V1. Job table survives restarts. Easy to reason about.
- **Rejected:** BullMQ (needs Redis), In-memory (lost on restart).
- **Revisit:** Add Redis + BullMQ if throughput demands it.

### 6. Database: Neon (managed Postgres) with point-in-time recovery

- **Rationale:** Automatic daily backups + PITR. Branching for dev.
- **Rejected:** Self-hosted (backup burden), Supabase (heavier than needed).
- **Alternative acceptable:** Supabase if the team prefers a bundled dashboard.

### 7. Grade Workflow: Explicit state machine

- **States:** DRAFT → SUBMITTED → UNDER_REVIEW → { APPROVED | RETURNED }
- APPROVED → LOCKED (after report card generation)
- LOCKED → CORRECTION_PENDING → APPROVED (with audit trail)
- **Rationale:** Prevent "teacher edits grades after report cards" disaster.
- **See:** `docs/grade-workflow.md`

### 8. Timetable Versioning: Versioned by (academic year, term)

- Lessons reference the version active when they occurred.
- Historical timetables viewable, not editable.
- **Rationale:** Timetables change mid-term; history must be preserved.

### 9. SMS / Email in V1: Abstraction only, in-app notifications

- Build `Notification` entity with channel: `IN_APP | SMS | EMAIL`.
- V1 delivers `IN_APP` only. SMS/EMAIL wired in V1.5.
- **Rationale:** Don't build integrations before the core works.
- **Business note:** First schools will ask for SMS. Tell them V1.5.

### 10. Currency: `Decimal(15, 2)` in Postgres

- Display as whole RWF in UI (RWF has no practical cents).
- Rounding rules defined per operation.
- **Rationale:** Future-proofs for other currencies and avoids floating-point errors.

### 11. Setup Wizard: First-class feature

- A school admin can onboard without developer intervention.
- 10 steps: school info → year → levels → classes → subjects → grade scales → fees → students → staff → review.
- **Rationale:** Without it, onboarding each school is a developer task.

### 12. Year-End Rollover: Model now, UI in V1.5

- Data model supports promotion, repetition, exit.
- Rollover wizard built after V1 core is stable.
- **Rationale:** Complex workflow; defer UI but not the schema.

### 13. Validation: Zod, server-side mandatory

- Same schemas used on client for UX.
- Server re-validates every input.
- **Rationale:** Client validation is UX only.

### 14. Testing: Vitest + Playwright

- Vitest for unit + integration (fast, TypeScript-native).
- Playwright for E2E user journeys.
- **Rationale:** Vitest is significantly faster than Jest; Playwright is the best E2E tool.

### 15. Permission Model: RBAC with resource scoping

- Roles grant permissions. Permissions grant actions.
- Resource scope evaluated separately.
- **See:** `docs/rbac.md`
- **Rationale:** Roles alone are insufficient — "teacher can read grades" is too broad.

### 16. Audit Logging: First-class, append-only

- Every sensitive mutation writes to `AuditLog` in the same transaction.
- Audit records have `previousValue` and `newValue` (JSON).
- **Rationale:** Rwanda's data protection law requires traceability.

### 17. Soft Delete: Only where historically appropriate

- Students, parents, teachers, users, classes, subjects, config records.
- Financial and academic history never soft-deleted — kept intact.
- **Rationale:** Preserves history without hiding sensitive records.

### 18. Multi-Tenancy: Not in V1

- Single school deployment.
- Each school gets its own database and deployment.
- **Rationale:** Avoids tenancy complexity while the domain model stabilizes.
- **Revisit:** When 10+ schools need to be managed centrally.

### 19. Language: English only in V1

- Kinyarwanda and French to be added in V1.5.
- **Rationale:** Ship V1 faster. Design strings to be i18n-ready from day one.

### 20. Scope Boundaries

Explicitly excluded from V1:
- Library, transport, hostel, cafeteria
- Biometric attendance
- AI features
- Built-in chat
- Automatic timetable generation
- Full accounting/ERP
- Complete national TVET curriculum
- Online payment gateways
- SMS / WhatsApp / push

These are **intentional scope boundaries**, not forgotten requirements.

---

## Consequences

- These decisions are locked for V1.
- Any change requires a new ADR.
- Code that contradicts these decisions is a bug.
- The stack is deliberately boring where it doesn't need to be novel.
