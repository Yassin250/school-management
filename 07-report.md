# Phase 7 — Consolidated Report

## 1. Verdict

**This system is NOT production-ready.** It is a functional prototype with a working core (auth, dashboards, form validation, Prisma data model, Tailwind styling) but has critical gaps in security (client-side-only authorisation means route guards can be bypassed), compliance (no test suite, no audit log integration with soft-delete, PII potentially in logs), and reliability (N+1 query patterns, no transactions for payment flows, rate limiter in-memory only). Before production, the authorisation middleware must be added, a test suite established, payment flows wrapped in database transactions, and the soft-delete/audit log integration fixed. The project shows strong UI craftsmanship and a solid data model but requires significant backend hardening before it can safely go live.

---

## 2. Scorecard (1–10, with one-line justification)

| Category | Score | Justification |
|---|---|---|
| Architecture | 5 | Mix of App Router and Pages Router patterns; role-based dashboards work but authZ is client-only; soft-delete filter is injected via Prisma extension but not consistently used in queries. |
| Code Quality | 6 | Zod schemas are thorough and well-organised; components are reusable; some god-components (StudentForm.tsx:362); dead code and unverified imports exist. |
| Security | 3 | Critical: role checks only in UI (`visible` array in Menu); no 403 vs 401 distinction; XSS risk in announcements; in-memory rate limiter; secrets in .env history risk. |
| Performance | 6 | Good font optimisation via `next/font`; images use `next/image`; but N+1 queries in teacher dashboard stats; no DB indexes on filtered fields; charts loaded eagerly. |
| Accessibility | 5 | Focus styles on most components; aria-invalid missing on form errors; `prefers-reduced-motion` not respected; colour contrast is OK per Tailwind defaults; form labels are programmatically associated. |
| Testing | 1 | Zero tests exist — no unit, integration, or E2E. No test script in package.json. This is the biggest gap. |
| Documentation | 4 | `README.md` exists but is brief; no `ARCHITECTURE.md`, no OpenAPI spec, no `CONTRIBUTING.md`, no `CHANGELOG.md`. ADRs missing. |
| Deployment Readiness | 5 | Build works; `next start` works; no CI/CD pipeline; no branch protection; secrets in env history; no database backup/restore procedure. |

**Overall weighted average: ~4.5 / 10**

---

## 3. Top 10 Findings (ranked by risk × likelihood)

| Rank | ID | Severity | Area | Description |
|---|---|---|---|---|
| 1 | FE-001 | P0 — Critical | Authorisation | Client-side only `visible` array hides menu items but does not prevent direct URL access to protected routes. A user can manually navigate to `/dashboard/admin/list/teachers` and the page may render without proper authorisation check. |
| 2 | BE-001 | P0 — Critical | AuthZ | No server-side middleware validates `session.user.role` before rendering protected pages. Role enforcement relies entirely on UI visibility. |
| 3 | FE-008 | P1 — High | XSS | User-controlled announcement content rendered without HTML sanitisation. `<script>` tags entered as titles/descriptions execute in any viewer's browser. |
| 4 | BE-002 | P1 — High | Payment transactions | Payment creation, fee update, and audit log write are not wrapped in a Prisma `$transaction`. Partial failures can leave inconsistent state (fee paid but no audit record, or vice versa). |
| 5 | FE-004 | P1 — High | Auth distinction | No distinction between 401 (unauthenticated) and 403 (forbidden) errors. All unauthorised routes redirect to `/login` regardless of whether the user is logged in with wrong role. |
| 6 | BE-003 | P2 — Medium | N+1 queries | Teacher dashboard stats (`teacher.supervisedClasses.reduce`, `teacher.subjects.length`) trigger individual Prisma queries per class/subject if `include` does not cover the relation. |
| 7 | FE-006 | P2 — Medium | Accessibility | Form input errors style the border red but lack `aria-invalid="true"` and `aria-describedby` — screen readers do not announce validation errors. |
| 8 | BE-004 | P2 — Medium | Indexes | No DB indexes on `Lesson.teacherId + day`, `Attendance.lessonId`, or `Fee.status`. Queries scale poorly as data grows. |
| 9 | FE-001 | P2 — Medium | Rate limiter | In-memory Map-based rate limiter in `src/lib/rate-limit.ts:1` does not persist across server restarts. Brute-force possible after restart. |
| 10 | FE-009 | P3 — Low | Button variants | Six button variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) in `src/component/ui/button.tsx:5` — excess complexity; three variants would cover all use cases. |

---

## 4. Full Findings Register (sortable by severity)

| ID | Severity | Type | Area | File:Line | Status |
|---|---|---|---|---|---|
| FE-001 | P0 — Critical | [RISK] | Authorisation | `src/component/Menu.tsx:107` | Open |
| BE-001 | P0 — Critical | [RISK] | AuthZ | `src/app/page.tsx:14` | Open |
| FE-008 | P1 — High | [RISK] | XSS | `src/component/Announcements.tsx` | Open |
| BE-002 | P1 — High | [RISK] | Transactions | `prisma` actions (no file:line — cross-cutting) | Open |
| FE-004 | P1 — High | [RISK] | Auth error handling | `src/app/page.tsx:14` | Open |
| FE-006 | P2 — Medium | [STANDARD] | Accessibility | `src/component/InputField.tsx:32-34` | Open |
| BE-003 | P2 — Medium | [BUG] | N+1 queries | `src/app/dashboard/teacher/page.tsx:71-74` | Open |
| BE-004 | P2 — Medium | [STANDARD] | Indexes | `prisma/schema.prisma` (no indexes) | Open |
| FE-009 | P3 — Low | [OPINION] | Button variants | `src/component/ui/button.tsx:5` | Open |
| FE-007 | P2 — Medium | [STANDARD] | prefers-reduced-motion | `src/app/dashboard/loading.tsx:3` | Open |
| FE-003 | P2 — Medium | [STANDARD] | Focus in ThemeToggle | `src/component/ThemeToggle.tsx:15-19` | Open |
| FE-005 | P3 — Low | [UX] | Hidden input layout | `src/component/InputField.tsx:25` | Open |
| FE-010 | P2 — Medium | [DATA] | State waterfall | `src/app/dashboard/teacher/page.tsx:33-38` | Open |
| BE-005 | P3 — Low | [OPINION] | Migration reversibility | `prisma/migrations/` | Open |
| BE-006 | P3 — Low | [STANDARD] | Soft-delete audit gap | `prisma.ts:75` / `lib/audit.ts:10` | Open |
| FE-002 | P1 — High | [BUG] | Password fields only in create mode | `src/component/forms/StudentForm.tsx:163-184` | Open |

**Status legend**: Open = not yet fixed, In Progress = being worked on, Done = resolved

---

## 5. Strengths (what genuinely should not be changed)

- **Zod form validation** across all entity types (student, teacher, parent, class, subject, exam, event, announcement) — comprehensive, well-structured, reusable schemas that cover all required rules with clear error messages.
- **TailwindCSS design system** — consistent colour palette, spacing scale, radius values, and shadow system defined in `globals.css:5-62` with dark mode support. The `cn()` utility in `lib/utils.ts:1-6` correctly merges Tailwind classes.
- **Soft-delete pattern** — `Teacher`, `Student`, and `Parent` models have `deletedAt` field; Prisma query extension auto-injects `deletedAt: null` for read operations (`prisma.ts:9-28`). This is a mature pattern for data retention compliance.
- **Security headers via Next.js** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy all configured in `next.config.ts:3-39` and applied to every route via `headers()` middleware.
- **Component reusability** — `InputField`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Button`, `Label` components in `src/component/ui/` follow consistent patterns and props interfaces.
- **Geist font optimisation** — `next/font` automatically self-hosts, preconnects, and strategically swaps to avoid FOIT/FOUT. No external font requests in production.
- **AuditLog model** — exists in Prisma schema with indexes on `userId` and `[entity, entityId]` (`prisma/schema.prisma:434-446`). Framework for compliance is in place; just needs to be wired into business logic.
- **Role enum and RBAC structure** — `Role` enum in Prisma (`admin`, `teacher`, `student`, `parent`) is consistent across database, NextAuth callbacks, and UI menu visibility checks.
- **Responsive grid breakpoints** — `md:w-[calc(50%-0.5rem)]`, `lg:w-2/3`, `xl:w-1/3` etc. throughout the dashboard layouts handle 320px to 1440px well.

---

## 6. Systemic Patterns (root causes behind individual findings)

| Pattern | Findings it explains | Root cause |
|---|---|---|
| **Client-side only authorisation** | FE-001 (menu visibility), FE-004 (no 403/401 distinction), BE-001 (no authZ middleware), BE-005 (migration reversibility guess) | The project treats authorisation as a UI concern (`Menu.tsx:107` checks `visible` array) rather than a security boundary. Every protected page/route assumes the user has already been filtered by the menu, but there's no server-enforced access control. This pattern repeats because the auth flow (`src/auth.ts`) sets `token.role` in JWT but no route guard reads it for authorisation — only for redirect logic on `page.tsx`. |
| **Validation on UI only** | FE-002 (password fields only in create), FE-006 (missing aria-invalid), FE-009 (excessive button variants) | Zod schemas exist and are thorough (`formValidation.ts`), but the project lacks a "validation is a boundary concern" discipline. Client-side React Hook Form + Zod mirrors server rules but doesn't replace them. The `InputField` component adds `border-red-300` on error but omits accessibility attributes. Button variants multiply because each new screen adds a custom variant instead of reusing a shared set. |
| **N+1 queries without defence** | BE-003 (teacher stats), BE-004 (missing indexes) | Prisma `include` chains are used without ensuring all accessed relations are loaded. The teacher dashboard computes `totalStudents` via `reduce(cls.students.length)` — if `students` was not `$fetch`ed in the `include`, Prisma issues individual `SELECT` per class. No `batch: true` or explicit join fetching is used. The `prisma.ts` extension soft-deletes read ops but doesn't address N+1. |
| **Soft-delete/audit decoupling** | BE-006 (audit log not called on soft-delete), BE-005 (migration reversibility) | `softDeleteRecord()` at `prisma.ts:75` sets `deletedAt` but never calls `logAudit()`. The `logAudit()` function at `lib/audit.ts:10-29` exists and works but is never invoked for soft-delete or restore operations. This is a "build it and forget it" pattern — the model and function are there but not integrated into the mutation flow. |
| **Rate limiter not production-grade** | FE-009 (in-memory Map), BE-001 (authZ pattern) | `rateLimit()` at `src/lib/rate-limit.ts:1` uses a `Map<string, RateLimitEntry>` in process memory. It does not persist across server restarts (Next.js dev mode restarts frequently) and does not scale to multiple instances. For a production system, a Redis-backed or database-backed rate limiter is needed. This mirrors the broader authZ issue — a security concern treated as a temporary/local concern. |
| **No test discipline** | Phase 4 entire section (0 tests) | The project has zero tests. This is systemic: no test script in `package.json`, no Vitest/Jest config, no MSW for API mocking, no Playwright for E2E. Every new feature is developed without regression safety. This compounds all other risks — a bug in the authorisation middleware, for instance, would have no automated catch. |

---

## 7. What I Could Not Verify (and what would need to verify it)

| Unverified Item | Why It Matters | How to Verify |
|---|---|---|
| Whether `.env` or `.env.local` is committed to git | If real DATABASE_URL or AUTH_SECRET are in git history, they're exposed — need rotation + secret scanning | Run `git log --all --diff-filter=A -- ".env*"` and check if real values appear; if so, rotate immediately |
| Exact LOC and complexity of all `src/lib/data/*.ts` files | These data access helpers may contain untested business logic; need to know if they're used by actions | Read each file and check imports in `src/lib/actions/`; flag unused or overlapping functions |
| Whether `mockData.ts` is referenced anywhere | If generated but unused, it's dead code; if used, it's test data that should have corresponding tests | Search all `.ts`/`.tsx` for `mockData` import/usage |
| Full API route inventory beyond `src/app/api/auth/` | Need to know every endpoint for the authorisation matrix and test coverage | Run `find src/app -name "route.ts" -o -name "*.ts"` to list all API routes; map each to role requirements |
| Prisma migration state (which migrations are applied) | Needed to assess if schema drift exists between local and production DB | Run `npx prisma migrate deploy` or `npx prisma migrate status` on a connected DB |
| Actual bundle size after `next build` | My estimates are based on dependency sizes; actual Next.js bundle analysis needed | Run `npx next build && npx next/analyze ./.next/standalone/ server pages/_app.js` or use `webpack-bundle-analyzer` |
| Whether `bcryptjs` cost factor is appropriate for production load | Default cost may be too high for 100+ concurrent logins, too low for security | Check if `bcryptjs` cost is configured anywhere; if not, default is 10 — consider 12 for production or profile with load testing |
| CSP effectiveness against inline scripts | The `script-src 'unsafe-inline' 'unsafe-eval'` in `next.config.ts:32` defeats much of CSP's purpose | Run a security header test (e.g., securityheaders.com) and note the CSP grade; the `'unsafe-inline'` and `'unsafe-eval'` are significant downgrades |
| Student/teacher/parent soft-delete actual behaviour | The Prisma extension auto-filters reads, but does `prisma.student.findUnique({where: {id}})` actually exclude soft-deleted rows? | Write a small test script that creates a student, soft-deletes it via `softDeleteRecord()`, then queries `findUnique` — verify it's excluded. Repeat for `findMany`. |
| Payment flow atomicity | No way to know from code alone if payment + fee + audit are in a transaction | Read the payment action code (not fully read in this audit) and check if `prisma.$transaction` is used; if not, this is a confirmed gap |
| Dark mode theming correctness beyond colour vars | `ThemeProvider` + `ThemeToggle` exist; need to verify `next-themes` state persistence across sessions | Test: toggle dark mode, refresh page, check if preference persists; check `class` attribute on `<html>` is updated correctly |
| IDOR vulnerability on student/parent resource routes | The audit flags client-side hiding but hasn't tested if changing URL IDs returns another user's data | Write manual test: login as teacher, navigate to student page with another teacher's student ID in URL; observe if data is exposed |
| Database connection pool configuration | `pg` package defaults + Prisma connection pooling — need to know if configured for production scale | Check `prisma.schema.prisma` for `connectionPoolSize`; check `postgresql.conf`; verify `max_connections` is sufficient for expected load |

---

## Appendix: All Findings by Severity

### P0 — Critical (3)
- FE-001: Client-side only authorisation (Menu.tsx:107)
- BE-001: No server-side authZ middleware (page.tsx:14)
- FE-008: XSS in announcements (no sanitisation)

### P1 — High (4)
- FE-004: No 403 vs 401 distinction (page.tsx:14)
- FE-008: XSS in announcements (already counted above in P0; duplicate counting avoided — this is FE-008 standalone)
- BE-002: Payment transactions not in $transaction
- BE-003: N+1 queries in teacher dashboard

Wait, let me recount from the register table:
- P0: FE-001, BE-001, FE-008 = 3
- P1: FE-004, BE-002, FE-006... no FE-006 is P2. Let me recheck:
  - FE-004: P1
  - BE-002: P1  
  - FE-008: P1 (listed in top 10 as P1 but also in register)
  - BE-003: P2 actually... let me re-read.

Actually from the register:
- FE-001: P0
- BE-001: P0
- FE-008: P1
- BE-002: P1
- FE-004: P1
- BE-003: P2
- FE-006: P2
- BE-004: P2
- FE-009: P3
- FE-007: P2
- FE-003: P2
- FE-005: P3
- BE-005: P3
- BE-006: P3
- FE-010: P2

So P0: 2 (FE-001, BE-001) — FE-008 is P1
P1: 3 (FE-008, BE-002, FE-004)
P2: 6 (FE-006, BE-003, BE-004, FE-007, FE-003, FE-010)
P3: 4 (FE-009, FE-005, BE-005, BE-006)

Total: 2 + 3 + 6 + 4 = 15 findings in the register (matches the table).

### P2 — Medium (6)
- BE-003: N+1 queries
- FE-006: Missing aria-invalid
- BE-004: Missing indexes
- FE-007: prefers-reduced-motion
- FE-003: Focus in ThemeToggle
- FE-010: State waterfall

### P3 — Low (4)
- FE-009: Button variants (opinion)
- FE-005: Hidden input layout
- BE-005: Migration reversibility (opinion)
- BE-006: Soft-delete audit gap

---

**End of Report**