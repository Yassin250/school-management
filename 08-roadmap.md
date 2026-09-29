# Phase 8 — Remediation Roadmap

## Sprint 0 — Stop the Bleeding: All P0s, Ordered

| ID | Title | Why | Files Touched | Effort | Dependencies | Acceptance Criteria | Verify |
|---|---|---|---|---|---|---|---|
| **RC-001** | Add server-side authorisation middleware | P0: Client-side `visible` array in Menu cannot prevent direct URL access to protected routes. Any user can manually navigate to `/dashboard/admin/list/teachers` bypassing UI guards. | `src/app/page.tsx:14`, add new middleware/route guard file | M | None (foundational) | `GET /dashboard/admin/list/teachers` with non-admin role returns 403 Forbidden, not a redirect to `/login`. | Manual: curl the route as teacher → expect 403; as admin → expect 200. |
| **RC-002** | Wrap payment flow in Prisma $transaction | P1: Payment creation, fee update, and audit log write are not atomic. Partial failure can leave inconsistent state (fee paid but no audit record, or payment record without updated fee). | `src/lib/actions/payment.ts` (create file if missing), `prisma.ts:softDeleteRecord()`, `lib/audit.ts:logAudit()` | M | RC-001 (authZ must exist first, but can parallelise) | Creating a payment with valid data creates: (a) Payment record, (b) Updated Fee status, (c) AuditLog entry — all three or none. Rolling back any one rolls back all. | Test: create payment via API, check all three DB changes exist or none do. |
| **RC-003** | Add HTML sanitisation for announcements | P1: User-entered `<script>` tags in announcement title/description execute in viewers' browsers. Critical XSS vulnerability. | `src/component/Announcements.tsx` (add DOMPurify import + sanitise calls) | S | None | Announcement with `<script>alert('xss')</script>` in title renders as escaped text, not executed script. | Test: submit announcement with `<script>`, view it, no alert executes. |

**Sprint 0 summary**: 3 P0 items, ordered RC-001 → RC-002 → RC-003. RC-001 must come first (foundational). RC-002 and RC-003 can be done in parallel after RC-001. Total: ~3-4 days.

---

## Sprint 1 — Correctness & Tests: P1s plus test suite that prevents regression

| ID | Title | Why | Files Touched | Effort | Dependencies | Acceptance Criteria | Verify |
|---|---|---|---|---|---|---|---|
| **RC-101** | Add 403 Forbidden page for role mismatch | P1: No distinction between 401 (not logged in) and 403 (wrong role). All unauthorised routes redirect to `/login` regardless. | `src/app/page.tsx:14`, `src/app/dashboard/error.tsx` (enhance) | S | RC-001 (authZ middleware must exist first) | Valid user with non-admin role on admin route sees "Access denied. Admins only." with 403 status, not redirected to login. | Manual: login as teacher, visit `/dashboard/admin/list/teachers` → expect 403 page. |
| **RC-102** | Write auth flow tests (VALID_LOGIN, INVALID_PASSWORD, RATE_LIMIT) | P0/P1: Zero tests exist for authentication. Need regression safety for the critical auth flow. | `test/auth.test.ts` (create) | S | None | `npm test` passes: valid login sets session, invalid password returns null, rate limit returns success:false after 5 attempts/15min. | Run `npm test` → all 3 auth tests pass. |
| **RC-103** | Write form validation schema tests (student create/ update edge cases) | P1: Zod schemas exist but have no test coverage. Ensure schema rules (min length, regex, email, phone, password match) are not broken by future changes. | `test/studentCreation.test.ts` (create) | S | None | `npm test` passes: all 6 schema edge cases (short username, bad email, short phone, mismatched passwords, missing required fields, valid data) produce expected error messages. | Run `npm test` → all 6 student creation tests pass. |
| **RC-104** | Write IDOR prevention tests (teacher can't see other teacher's students, parent can't see other parent's children) | P0: No authorisation on resource-scoped routes. Need to verify changing URL IDs doesn't expose another user's data. | `test/idortest.test.ts` (create) | M | RC-101 (403 middleware must exist first, so tests can verify 403 not data leak) | `npm test` passes: teacher accessing student by another teacher's ID gets 403; parent accessing another parent's child data gets 403. | Run `npm test` → IDOR tests pass. |
| **RC-105** | Add MSW API mocks for integration testing | P1: Need way to test API routes without spinning up a real PostgreSQL server. MSW (Mock Service Worker) intercepts fetch requests in test environment. | `src/mocks/browser.ts`, `src/mocks/handlers.ts` | M | RC-102, RC-103 (test infrastructure) | `npm test` runs with MSW interceptors; API route handlers can be tested with fake data without database. | Run `npm test` → MSW-augmented tests pass without DB. |

**Sprint 1 summary**: 5 items covering P1 correctness + test infrastructure. RC-101 depends on RC-001 (authZ middleware). RC-104 depends on RC-101 (needs 403 check). RC-102, RC-103, RC-105 can partially parallelise. Total: ~4-5 days.

---

## Sprint 2 — Hardening & Performance

| ID | Title | Why | Files Touched | Effort | Dependencies | Acceptance Criteria | Verify |
|---|---|---|---|---|---|---|---|
| **RC-201** | Add DB indexes for `Lesson.teacherId + day` and `Attendance.lessonId` | P2: N+1 queries and full table scans on filtered/sorted fields. Indexes will give 3-5x faster queries on teacher dashboards and attendance reporting. | `prisma/schema.prisma:389` (add `@@index([teacherId, day])` to Lesson, `@@index([lessonId]` to Attendance) | S | RC-101 (authZ must be fixed first, but DB change can happen in parallel) | `prisma migrate dev` runs successfully; `prisma generate` works; queries using `where: { teacherId, day }` or `where: { lessonId }` use index. | Run `prisma migrate make add_indexes` then `prisma migrate deploy`; verify with `EXPLAIN`. |
| **RC-202** | Wrap all multi-step operations in $transaction | P1: Payment creation, student enrolment, term current-flag toggle are not atomic. Add transactions to actions layer. | `src/lib/actions/payment.ts`, `src/lib/actions/student.ts`, `src/lib/actions/term.ts` | M | RC-002 (already wrapping payment in transaction from Sprint 0) | All create operations that touch multiple models use `prisma.$transaction()`. Test: attempt partial failure — e.g., create student with invalid data — rolls back both student creation and any fee structure changes. | Test: run create-student-failure scenario; verify no partial DB state. |
| **RC-203** | Add prefers-reduced-motion media query to loading skeleton | P2: `animate-pulse` in `dashboard/loading.tsx` violates user OS preferences. | `src/app/dashboard/loading.tsx:3` | S | None | CSS `@media (prefers-reduced-motion: reduce) { .animate-pulse { animation: none !important; } }` applied. Testing with OS `prefers-reduced-motion` enabled → skeleton stops pulsing. | Enable OS reduced-motion setting; verify animation stops. |
| **RC-204** | Lazy-load role-specific charts (FinanceChart, EventCalendar, BigCalendar) | P2: Charts loaded eagerly on all dashboards regardless of role. Lazy loading reduces initial bundle size and improves LCP. | `src/app/dashboard/admin/page.tsx`, `src/app/dashboard/teacher/page.tsx`, `src/app/dashboard/student/page.tsx` | M | RC-101 (authZ first, but lazy loading can parallelise) | Charts only load when navigated to their respective route. Admin dashboard without finance widget loads ~30% faster (estimated). | Run `next build`; check bundle size diff; manually navigate routes and verify charts appear only on relevant pages. |
| **RC-205** | Replace in-memory rate limiter with Redis-backed implementation | P2: Current `rateLimit()` uses `Map` in process memory — doesn't persist across restarts and doesn't scale to multiple instances. | `src/lib/rate-limit.ts` (replace with Redis client) | L | Redis instance availability; RC-001 (authZ first) | Rate limit config persists across server restarts; works with multiple running instances; `npm audit` shows no new vulnerabilities. | Start 2 server instances; verify rate limit is consistent across both (same email blocked after 5 attempts on either instance). |

**Sprint 2 summary**: 5 items. DB indexes (RC-201) and prefers-reduced-motion (RC-203) can start immediately (S effort). Transaction wrapping (RC-202) and lazy loading (RC-204) depend on Sprint 1 foundation. Redis rate limiter (RC-205) is largest item (~2 days). Total: ~5-6 days.

---

## Sprint 3 — Professionalization & Docs

| ID | Title | Why | Files Touched | Effort | Dependencies | Acceptance Criteria | Verify |
|---|---|---|---|---|---|---|---|
| **RC-301** | Add husky + lint-staged pre-commit hooks | Professionalisation: ensure code passing pre-commit has been linted and formatted; prevent committing lint errors or formatting fixes. | `package.json` (add husky, lint-staged scripts), `.husky/pre-commit`, `.lintstagedrc` (or add to package.json) | S | None | `git commit` runs eslint --fix + prettier --write automatically; no commit allowed with lint errors. | Try committing a file with eslint error → auto-fix applied; commit succeeds. |
| **RC-302** | Add Prettier configuration + format all files | Professionalisation: consistent code style across team. | `.prettierrc`, run `npx prettier --write "src/**/*.{ts,tsx}"` | S | None | All `.ts`/`.tsx` files pass `npx prettier --check` — zero formatting differences. | Run `npx prettier --check "src/**/*.{ts,tsx}"` → passes. |
| **RC-303** | Add `.editorconfig` at root | Professionalisation: enforce consistent indentation (spaces vs tabs) and charset across editors. | `.editorconfig` at repo root | S | None | All team members' editors respect `.editorconfig` settings (2-space indent, utf-8, insert_final_newline). | Open repo in VS Code / Web IDE; verify settings match. |
| **RC-304** | Add comprehensive `README.md` with setup/deploy docs | Professionalisation: new contributors can clone and run in under 10 minutes. | `README.md` (overwrite with professional version) | M | None | `cp .env.example .env.local` + `npm install` + `npx prisma generate` + `npm run dev` works in under 10 minutes on fresh clone. | Fresh clone test: time the setup; should be < 10 min. |
| **RC-305** | Add `ARCHITECTURE.md` with mermaid diagrams + `API.md` with OpenAPI-lite spec | Professionalisation: system design and contract documentation for external examiners/engineers. | `ARCHITECTURE.md`, `API.md` (create new) | M | RC-302 (need Prettier stable first) | Both files exist with mermaid diagrams rendering correctly; API.md lists all endpoints with request/response schemas and status codes. | Read both files; diagrams look correct; API coverage feels complete. |
| **RC-306** | Add `CHANGELOG.md` + initial entry for audit | Professionalisation: track what changed; essential for maintenance and release process. | `CHANGELOG.md` (create with initial "v0.1.0 — Initial audit and remediation roadmap" entry) | S | None | `CHANGELOG.md` follows Keep a Changelog format (Unchanged, Added, Changed, Fixed, Deprecated, Removed, Security). | Format check. |

**Sprint 3 summary**: 6 items. Documentation-heavy. RC-301 (husky) and RC-302 (Prettier) are quick wins (S effort, can start immediately). RC-304 (README) is critical for new contributor onboarding. RC-305 (ARCHITECTURE + API docs) is the biggest effort but provides longest-term value. Total: ~4-5 days.

---

## Dependency-Ordered Checklist (Top-to-Bottom, Safe to Parallelise)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SAFE TO PARALLELISE (no dependencies between these)                   │
│                                                                       │
│ RC-003: Add HTML sanitisation for announcements                       │
│ RC-302: Add Prettier configuration + format all files                 │
│ RC-303: Add .editorconfig at root                                     │
│ RC-203: Add prefers-reduced-motion media query                        │
│ RC-301: Add husky + lint-staged pre-commit hooks                      │
│                                                                       │
│ MUST FOLLOW THIS ORDER (dependencies):                                │                                                                       │
│                                                                       │
│ RC-001: Add server-side authorisation middleware                      │
│ │                                                                       │
│ ├─ RC-101: Add 403 Forbidden page for role mismatch                   │
│ │      │                                                              │
│ │      └─ RC-104: Write IDOR prevention tests                         │
│ │                                                                       │
│ ├─ RC-102: Write auth flow tests                                      │
│ │                                                                       │
│ ├─ RC-103: Write form validation schema tests                         │
│ │                                                                       │
│ ├─ RC-201: Add DB indexes for Lesson + Attendance                      │
│ │                                                                       │
│ ├─ RC-202: Wrap multi-step operations in $transaction                 │
│ │                                                                       │
│ ├─ RC-204: Lazy-load role-specific charts                             │
│ │                                                                       │
│ └─ RC-205: Replace in-memory rate limiter with Redis                  │
│                                                                       │
│ THEN:                                                                 │
│                                                                       │
│ RC-304: Add comprehensive README.md with setup/deploy docs             │
│ RC-305: Add ARCHITECTURE.md + API.md docs                             │
│ RC-306: Add CHANGELOG.md                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Items safe to do in parallel (no blocking dependencies):

| Parallel Group | Items | Estimated effort together |
|---|---|---|
| **Group A** (Sprint 0) | RC-003 only (1 item) | S (15 min) |
| **Group B** (Sprint 1 setup) | RC-102, RC-103 (test infrastructure) | S (2-3 hours) |
| **Group C** (Sprint 2 quick wins) | RC-201, RC-203 (DB indexes + reduced-motion) | S (2-3 hours) |
| **Group D** (Sprint 3 quick wins) | RC-301, RC-302, RC-303 (husky + Prettier + editorconfig) | S (3-4 hours) |

### Critical path (what blocks what):

```
RC-001 (authZ middleware)
    │
    ├── RC-101 (403 page) — can proceed once RC-001 has the role check logic
    │       └── RC-104 (IDOR tests) — needs RC-101 so tests can verify 403 not data leak
    │
    ├── RC-102 (auth tests) — can proceed independently (tests the auth flow, not route guards)
    │
    ├── RC-103 (form validation tests) — can proceed independently
    │
    ├── RC-201 (DB indexes) — can proceed independently (DB change, not dependent on auth)
    │
    ├── RC-202 (transactions) — can proceed independently (business logic)
    │
    ├── RC-204 (lazy loading) — can proceed independently (UI routing)
    │
    └── RC-205 (Redis rate limiter) — can proceed independently (infrastructure)

RC-101 + RC-104 block RC-105 (MSW tests need 403 behaviour to test correctly)
```

### Effort summary across all 8 sprints:
- **Sprint 0 (P0 stop bleeding)**: 3 items, ~3-4 days total
- **Sprint 1 (correctness + tests)**: 5 items, ~4-5 days total
- **Sprint 2 (hardening + performance)**: 5 items, ~5-6 days total
- **Sprint 3 (professionalization + docs)**: 6 items, ~4-5 days total

**Grand total: ~16-20 calendar days** (or ~4-5 weeks with 1 engineer, parallelising where noted)

The critical path runs through Sprint 0 → Sprint 1 → then Sprinters 2 and 3 can partially overlap. Sprint 3 documentation can start once Sprint 1 test infrastructure is in place.