# Phase 5 — Performance & Scalability

## 5.1 Frontend: Core Web Vitals & Bundle Analysis

### Estimated Core Web Vitals (based on code analysis, not measured)

| Metric | Estimated | Risk Status | Cause |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ~2.5s | ⚠️ Medium | Next.js default performance, but heavy dashboard pages with multiple charts (FinanceChart, AttendanceChart, CountChart) may exceed 2.5s on first paint. LCP candidate: `.finance-chart` or `.dashboard-container` above the fold. |
| **CLS** (Cumulative Layout Shift) | ~0.15 | ✅ Low | Tailwind classes use fixed heights (`h-10`, `h-24`, etc.) and `aspect-ratio` where needed. Main CLS risk: `loading` on images — `next/image` with `priority` is used on logo but not consistently elsewhere. |
| **INP** (Interaction to Next Paint) | ~150ms | ⚠️ Medium | Several `useState` + `setIsLoading` patterns. Click handlers on chart elements, form submissions, and table actions may block main thread if data fetching occurs in event handlers. |
| **FCP** (First Contentful Paint) | ~1.8s | ✅ Good | Next.js App Router + Geist fonts optimize initial render. |

### The 10 heaviest dependencies (by bundle impact):

| Rank | Package | Approx. Size | Alternative |
|---|---|---|---|
| 1 | `@fullcalendar/*` (daygrid, interaction, timegrid, react) | ~350KB each | Consider lighter calendar; only use if essential |
| 2 | `framer-motion` | ~150KB | CSS animations alternative for simple effects |
| 3 | `recharts` | ~120KB | Use native SVG or lightweight chart library |
| 4 | `next-themes` | ~50KB | Built-in `next/font` may reduce need |
| 5 | `sonner` | ~30KB | `vue-toastification` smaller, or custom toast |
| 6 | `lucide-react` | ~25KB | icon-only alternative is ~5KB |
| 7 | `@hookform/resolvers` | ~15KB | Form errors can be handled natively |
| 8 | `zod` | ~30KB | Type validation; hard to replace |
| 9 | `clsx` + `tailwind-merge` | ~15KB each | Combine into single utility (already done via `cn()`) |
| 10 | `nuqs` | ~40KB | URL state management; could use simpler query params |

### Code splitting / lazy loading — what should be split and isn't:

| Component/Route | Current | Recommendation | Impact |
|---|---|---|---|
| Dashboard pages | All loaded on app start | Use `dynamic(() => import(...))` for admin-only routes teacher doesn't need | Medium |
| `FinanceChart.tsx` | Eager loaded on admin dashboard | Lazy-load when admin navigates to finance widget | Medium |
| `EventCalendar.tsx` / `BigCalendar.tsx` | Eager loaded | Split by role — students don't need full calendar | Medium |
| `TeacherTimetableClient.tsx` | Eager | Only load on teacher's timetable tab | Low |
| `AttendanceChart.tsx` | Eager on dashboards | Lazy-load per role | Low |

### Images: format, sizing, `loading`, `priority`, CLS:

| Image | Current | Issue | Fix |
|---|---|---|---|
| Logo `src="/1.png"` in `layout.tsx:24` | `priority` prop added | No `width`/`height` props on `<Image>` — CLS risk if aspect ratio unknown | Add `width={32}` `height={32}` (already has these) — ✅ OK |
| Various `className="h-10 w-48 bg-muted"` in loading skeletons | Placeholder `bg-muted` color | No `loading="lazy"` on off-page images — not applicable since these are SVGs/placeholders | ✅ OK — these are decorative |
| `Image` components throughout | Mostly use `next/image` | Missing `fill` prop or explicit `width`/`height` on some images | Ensure all `next/image` have explicit dimensions or `fill` |

### Fonts: loading strategy, FOUT/FOIT, self-hosted vs. blocking:

- **Geist fonts** (`next/font/google`) — automatically optimized by Next.js
- `next/font` preconnects and preloads, swaps strategically to avoid FOIT/FOUT
- No custom/third-party fonts blocking render
- **Self-hosted fonts**: none in use — good, reduces external requests

### Re-render problems — missing memoisation:

| Component | Risk | Fix |
|---|---|---|
| `DashboardTimetableContainer` | May re-render on parent state change | Wrap in `React.memo()` if pure; ensure `searchParams` is compared shallowly |
| `CountChartContainer`, `AttendanceChartContainer` | Chart data props may change frequently | `React.memo()` + `useMemo` for derived data |
| `TeacherPage` stats calculations | `teacher.supervisedClasses.reduce()` runs on every render | `useMemo` the `totalStudents` and `weeklyLessons` calculations |
| `stats.map((stat, i) => ...)` in `TeacherPage:137` | New object references each render | Extract icon/components outside map, or memoise |

### Long lists without virtualisation:

| List | Estimated items | Virtualisation needed? |
|---|---|---|
| Admin sidebar menu items | ~30 | ✅ No — only ~7 visible at a time, CSS handles overflow |
| Student/teacher grade lists | Unknown (depends on data) | ⚠️ Yes if > 15 items — implement `react-virtual` or `window.scroll` infinity scroll |
| Event/announcement lists in admin | Unknown | ⚠️ Yes if > 20 — add virtualised list or "load more" pagination |
| Form select options (grades, classes, parents) | Typically < 20 | ✅ No — small datasets, no virtualisation needed |

---

## 5.2 Backend: Slowest Endpoints & Query Analysis

### Slowest endpoints (estimated, no profiling data):

| Endpoint | Estimated TTFB | Why it's slow |
|---|---|---|
| `GET /dashboard/admin/list/teachers` | ~500ms+ | Multiple `prisma.teacher.findMany` with `include: { subjects, supervisedClasses: { include: { students } } }` — N+1 risk |
| `GET /dashboard/admin/list/students` | ~500ms+ | Same pattern — `include: { parent, class, grade, attendances, results, fees }` |
| `POST /payments` | Variable | Payment creation + fee update + audit log — three DB writes in one transaction |
| `GET /dashboard/teacher/attendance` | ~300ms+ | `prisma.attendance.findMany` with `where: { studentId, lessonId }` — may be unindexed |
| `GET /api/auth/credentials` (login) | ~200ms | `rateLimit` check + `prisma.user.findUnique` + `bcryptjs.compare` — synchronous crypto |

### Query plans for heaviest queries (illustrative):

**Admin teachers list query** (from `src/app/dashboard/admin/list/teachers/page.tsx` — not fully read but pattern visible):

```sql
SELECT "Teacher".*, "User".*, "Class".*, "Grade".*, "Subject".*, "Lesson".*
FROM "Teacher"
JOIN "User" ON "Teacher"."id" = "User"."id"
LEFT JOIN "Class" ON "Class"."supervisorId" = "Teacher"."id"
LEFT JOIN "Grade" ON "Grade"."id" = "Class"."gradeId"
LEFT JOIN "Subject" ON "Teacher"."id" = "Subject"."teacherId"  -- many-to-many
LEFT JOIN "Lesson" ON ...  -- per teacher
```

**Risks**:
- No indexes on `Class.supervisorId`, `Grade.level` (already `@unique`), `Subject.name` (already `@unique`)
- `Lesson` has no index on `teacherId` + `day` combination for timetable queries
- `Attendance` has `@unique([studentId, lessonId, date])` but no index on `lessonId` alone for "get all attendance for this lesson"

### N+1 queries — confirmed risks:

| Pattern | File/Location | Risk |
|---|---|---|
| `teacher.supervisedClasses.reduce((acc, cls) => acc + cls.students.length, 0)` | `src/app/dashboard/teacher/page.tsx:71-74` | `cls.students` triggers individual `prisma.student.findMany` per class — N+1 if not batch-loaded |
| `teacher.subjects.length` | `src/app/dashboard/teacher/page.tsx:106` | If `subjects` not included in the `findUnique`, triggers extra `prisma.subject.findMany` |
| Student grades/results per page | `src/app/dashboard/student/page.tsx` | Each `stat` calculation may hit DB |

### Fixes for N+1:

1. Ensure `include` in Prisma queries covers all accessed relations
2. Use `prisma.$use` extension (already partially in `prisma.ts:44-66`) to auto-apply soft-delete filters
3. Add `batch: true` to queries or use `prisma.findMany` with `where: { id: [...] }` for batch fetches

### Transactions — where multi-document consistency is required:

| Operation | Required? | Currently Implemented |
|---|---|---|
| Payment creation (fee update + payment record + audit log) | ✅ Yes | `softDeleteRecord()` exists at `prisma.ts:75` but **no explicit transaction** in payment flow |
| Student enrollment (create student + update fee structure) | ✅ Yes | Not wrapped in transaction — partial failure possible |
| Term current-flag toggle (set one term current, unset others) | ✅ Yes | Not implemented — `Term.current` could have multiple `true` values |
| Student soft-delete + audit log | ✅ Partially | `softDeleteRecord()` sets `deletedAt` but no audit log entry (audit.ts:17-29 creates log but called separately) |

**Recommendation**: Wrap all multi-step operations in `prisma.$transaction()`. Add audit logging inside transactions.

### Migrations: exist? reversible? versioned?

- **Prisma schema**: `prisma/schema.prisma:446` — versioned via Prisma Migrate
- **Migration directory**: `prisma/migrations/` — exists but need to check count
- **Reversibility**: `prisma migrate reset` can reset, but individual down migrations need verification
- **Current state**: Need to run `prisma migrate list` to see applied migrations

### Soft delete vs. hard delete; audit trail:

- **Soft delete**: `Teacher` and `Student` have `deletedAt DateTime?`; `Parent` also has `deletedAt`
- **Read filter**: `prisma.ts:9-28` auto-injects `deletedAt: null` for read operations on `Student`, `Teacher`, `Parent`
- **Audit trail**: `AuditLog` model exists (`prisma/schema.prisma:434-446`) with indexes on `userId` and `[entity, entityId]`
- **Gap**: `softDeleteRecord()` at `prisma.ts:75` writes to DB but **does not create an `AuditLog` entry**. The `logAudit()` function at `lib/audit.ts:10-29` exists but is never called in the code I've seen.
- **Restore**: `restoreSoftDeletedRecord()` at `prisma.ts:90` clears `deletedAt` but also no audit log.

### Backup and restore story:

- **No backup script** in `package.json`
- **Prisma Migrate** handles schema evolution, not data backup
- **PostgreSQL** pg_dump / pg_restore would be external — not automated in repo
- **Recommendation**: Add `db:backup` script, schedule automated pg_dump, test restore quarterly

---

## 5.3 Load Behaviour

### What breaks first at 10×, 100×, 1000× current usage?

| Load Level | Breakpoint | Bottleneck |
|---|---|---|
| **10× current** (typical school: 100 concurrent users) | ⚠️ Possible | PostgreSQL connection pool exhaustion — `pg` pool default max 10 connections; Prisma may add more. Rate limiter (5 logins/15min) may block legitimate users. |
| **100× current** (busy district: 1000 concurrent) | 🚨 Critical | N+1 queries explode; unbounded `findMany` without limits on admin lists; page timeouts > 30s; browser memory with chart re-renders. |
| **1000× current** (city-wide: 10000 concurrent) | 💥 Total breakage | Connection pool exhausted; Node.js event loop blocked by synchronous `bcryptjs.compare`; CLS from missing image dimensions; CSP violations if third-party scripts queue up. |

### Specific bottlenecks:

1. **Connection pool**: `pg` package with default settings — increase `max` in Prisma `schema.prisma` or `postgresql.conf`
2. **N+1 queries**: Admin lists with full `include` — add selective fields, or add DB indexes
3. **`bcryptjs.compare`**: Synchronous CPU-heavy call — consider `bcryptjs` with lower cost factor for high-volume auth, or async variants
4. **Chart re-renders**: FullCalendar + Recharts on every state change — memoise, debounce resize

### Caching opportunities (ranked by benefit vs. invalidation risk):

| Cache Target | TTL | Invalidation Strategy | Benefit |
|---|---|---|---|
| **Term `current: true`** | 5 min | API revalidate on form submission | High — same term checked on every page load |
| **Teacher supervisedClasses** | 10 min | Invalidate on class/schedule change | High — reduces N+1 on every teacher dashboard load |
| **Student attendance percentages** | 15 min | Invalidate on attendance entry | Medium — attendance rarely changes mid-day |
| **Fee balances** | 2 min | Invalidate on payment creation | High — financial data must be fresh but recalculating per load is wasteful |
| **FullCalendar event data** | 1 min | Webhook from calendar sync service | Medium — events change but not per-second |
| **Auth session** | Session timeout | NextAuth JWT handles expiry | Already implemented |

---

## 5.4 Concrete Before/After Estimates

| Optimisation | Before | After | Estimate |
|---|---|---|---|
| Add DB indexes (`lesson.teacherId + day`, `attendance.lessonId`) | Full scans; N+1 patterns | Index lookups; 3-5x faster queries | 1 day — add `@@index` to Prisma schema, run `prisma migrate dev` |
| Wrap payment flow in `$transaction` | Separate queries; race conditions | Atomic consistency; error rollback | 2 days — modify actions + add audit log inside transaction |
| Lazy-load charts (finance, event calendar) | All loaded on dashboard start | Only loaded when navigated to | 1 day — `dynamic()` import + route guards |
| Increase Bcrypt cost or use async | Cost factor default; sync block | Faster auth responses | 1 day — adjust `.env` or switch to `nanoid`-based password check for non-critical paths |
| Add Redis cache for term/teacher data | No cache | 2-5s faster page loads | 2 days — add `@upstash/redis` or similar; requires Redis instance |
| Virtualise long lists | Infinite scroll / no virtualisation | Smooth 1000+ item lists | 2 days — `react-virtual` or `react-window` integration |

**Total estimated optimisation effort**: 7-10 days for significant improvements.

---

## 5.5 Performance Summary

**Strengths**:
- Next.js 16 App Router with automatic optimisations
- `next/font` Geist — no external font requests, automatic preconnect/preload
- `next/image` with `priority` for above-the-fold logo
- TailwindCSS v4 — tree-shaken, minimal CSS output
- Soft-delete already implemented at DB level
- Security headers via `next.config.ts:4-39` (CSP, HSTS, X-Frame-Options, etc.)

**Weaknesses**:
- No query indexes on filtered/sorted fields (N+1 risks)
- No caching layer for repeated data
- Synchronous `bcryptjs.compare` on every login
- Charts loaded eagerly on all dashboards regardless of role
- No bundle analyser run (no `next/analyze` or `vitest` bundle stats)
- `bcryptjs` sync could block event loop at scale

**Immediate wins (1 day each)**:
1. Add DB indexes for `Lesson.teacherId + day` and `Attendance.lessonId`
2. Add `dynamic()` lazy loading for role-specific charts
3. Run `next build` + analyse bundle output
4. Add `prisma.$use` extension for audit logging inside transactions

**Measurement needed**: Run `next build` → `npx next-analyze` or `npx ttggui` to get actual numbers. Without a running instance, estimates are based on code patterns.