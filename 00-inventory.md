# Phase 0 — Reconnaissance & Inventory

## Project Overview

**School Management System** — A Next.js 16 (App Router) school management platform with role-based dashboards for admin, teacher, student, and parent. Uses PostgreSQL via Prisma ORM, NextAuth for authentication (credentials + Google), and TailwindCSS for styling. The system handles student enrollment, attendance, grading, timetabling, finance/payments, and communication.

---

## Directory Tree (top-level, one-line purpose per folder)

| Folder | Purpose |
|---|---|
| `src/app` | Next.js App Router: pages, layouts, dashboards, API routes |
| `src/component` | Reusable UI components: layout, forms, tables, charts, dashboards |
| `src/lib` | Business logic: Prisma client, actions, validation, rate-limiting, utils |
| `src/lib/data` | Data access helpers for each entity (teacher, student, etc.) |
| `src/lib/actions` | Server actions for CRUD operations |
| `src/lib/formValidation.ts` | Zod schemas for all form types |
| `src/lib/rate-limit.ts` | In-memory rate limiter |
| `src/lib/auth/permissions.ts` | RBAC permission logic |
| `prisma` | Prisma schema, migrations, seed |
| `node_modules` | Dependencies (excluded from inventory) |
| `.env*` | Environment configuration |

---

## Lines of Code (by language/folder)

| Language | Files | LOC (est.) |
|---|---|---|
| TypeScript (.ts, .tsx) | 186 | ~42,000 |
| Prisma Schema | 1 | ~446 lines |
| JSON (package.json, tsconfig, etc.) | 6 | ~120 lines |
| CSS/SCSS | 1 | ~106 lines |
| Shell/PowerShell | 0 | — |

**Largest files (over 300 lines):**
- `prisma/schema.prisma` — 446 lines (data model)
- `src/component/forms/StudentForm.tsx` — 362 lines
- `src/component/forms/TeacherForm.tsx` — ~250 lines (not fully read)
- `src/lib/formValidation.ts` — 207 lines
- `src/lib/actions/student.ts` — unknown (not fully read)

**Complexity risk flag**: `prisma/schema.prisma:446` and `StudentForm.tsx:362` are approaching sizes where extraction into sub-components/services would improve maintainability.

---

## Dependencies

| Name | Version | Last Release | Known CVEs | Status |
|---|---|---|---|---|
| `next` | 16.2.5 | recent | — | Active |
| `react` | 19.2.4 | recent | — | Active |
| `react-dom` | 19.2.4 | recent | — | Active |
| `@prisma/client` | ^7.8.0 | recent | — | Active |
| `prisma` | ^7.8.0 | recent | — | Active |
| `zod` | ^4.4.3 | recent | — | Active |
| `bcryptjs` | ^3.0.3 | recent | — | Active |
| `next-auth` | ^5.0.0-beta.31 | recent | — | Active (beta) |
| `@hookform/resolvers` | ^5.2.2 | recent | — | Active |
| `sonner` | ^2.0.7 | recent | — | Active |
| `@fullcalendar/*` | ^6.1.20 | recent | — | Active |
| `tailwindcss` | ^4 | recent | — | Active |
| `clsx` | ^2.1.1 | recent | — | Active |
| `tailwind-merge` | ^3.5.0 | recent | — | Active |
| `lucide-react` | ^1.14.0 | recent | — | Active |
| `nuqs` | ^2.8.9 | recent | — | Active |
| `@t3-oss/env-nextjs` | ^0.13.11 | recent | — | Active |

**Duplicate/overlapping libraries:**
- `clsx` + `tailwind-merge` — both used in `lib/utils.ts` via `cn()` function. This is a valid pattern but adds 2 deps for one utility.
- `next-themes` + manual `ThemeToggle` with `useTheme` — theming handled twice (once in `layout.tsx` via `ThemeProvider`, once via `ThemeToggle` client component). The `next-themes` package provides the actual state; the component is the UI.

**Unmaintained risk**: `next-auth` at `^5.0.0-beta.31` — beta channel, frequent breaking changes between betas. No explicit CVE but moving target.

---

## Environment Variables

### Referenced in code (via `process.env` or `env.*`):

| Var | Used In | Source |
|---|---|---|
| `DATABASE_URL` | `prisma.ts:31`, `auth.ts:4` | `.env`, `.env.example` |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | `auth.ts:113` | `.env`, `.env.example` |
| `AUTH_URL` / `NEXTAUTH_URL` | `auth.ts` not directly but NextAuth expects it | `.env.example` only |
| `AUTH_GOOGLE_ID` | `auth.ts:34` | `.env.example` |
| `AUTH_GOOGLE_SECRET` | `auth.ts:35` | `.env.example` |
| `NODE_ENV` | Next.js built-in | — |

### `.env.example` (10 lines):
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/school_db"
AUTH_SECRET="generate-a-long-random-string-at-least-32-chars"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
```

### `.env` (7 lines — has real-ish values):
```
DATABASE_URL="postgresql://postgres:12345@localhost:5432/school_db"
NEXTAUTH_SECRET="your-super-secret-key-for-next-auth-12345"
NEXTAUTH_URL="http://localhost:3000"
```

### Mismatches:
- `.env.example` has `AUTH_URL` but `.env` uses `NEXTAUTH_URL` — NextAuth uses `NEXTAUTH_SECRET` / `AUTH_SECRET`, the var name mismatch is cosmetic but could confuse new devs.
- `.env.example` has `AUTH_GOOGLE_ID`/`.SECRET` but neither is in the actual `.env` — Google OAuth won't work without these.
- `.env` uses `NEXTAUTH_SECRET` while `.env.example` uses `AUTH_SECRET` — different naming, same purpose.

---

## Data Model (Prisma schema summary)

**Core models** (key fields only):

| Model | Key Fields | Types/Indexes |
|---|---|---|
| `User` | `id`, `username`, `email`, `password`, `role` | `@unique` on username/email |
| `Admin` | `id` (same as User.id), `username` | `@unique` |
| `Grade` | `id`, `level` `@unique` | Has `classes`, `students` |
| `Class` | `id`, `name` `@unique`, `capacity` | Belongs to Grade, has `supervisorId` → `Teacher` |
| `Subject` | `id`, `name` `@unique` | Many-to-many with `Teacher` |
| `Teacher` | `id` (same as User.id), `name`, `surname`, `email?`, `phone?`, `address`, `sex`, `birthday`, `deletedAt` | Has `subjects`, `lessons`, `supervisedClasses` |
| `Parent` | `id` (same as User.id), `name`, `surname`, `email?`, `phone?`, `address`, `deletedAt` | Has `students` |
| `Student` | `id` (same as User.id), `name`, `surname`, `email?`, `phone?`, `address`, `sex`, `birthday`, `deletedAt`, `parentId`, `classId`, `gradeId` | Relations: `parent`, `class`, `grade`, `attendances`, `results`, `fees` |
| `Lesson` | `id`, `name`, `day`, `startTime`, `endTime`, `subjectId`, `classId`, `teacherId` | Relations: `subject`, `class`, `teacher`, `exams`, `assignments`, `attendances` |
| `Exam` | `id`, `title`, `startTime`, `endTime`, `lessonId` | Relations: `lesson`, `results` |
| `Result` | `id`, `score`, `studentId`, `examId?`, `assignmentId?` | XOR constraint: only one of examId/assignmentId set |
| `Attendance` | `id`, `date`, `present`, `studentId`, `lessonId` | `@unique([studentId, lessonId, date])` |
| `Event` | `id`, `title`, `description`, `startTime`, `endTime`, `classId?` | Optional class |
| `Announcement` | `id`, `title`, `description`, `date`, `classId?` | Optional class |
| `Term` | `id`, `name` `@unique`, `startDate`, `endDate`, `current` | Has `lessons` |
| `Fee` | `id`, `studentId`, `type`, `amount`, `dueDate`, `paidAmount`, `status` | Has `payments` |
| `Payment` | `id`, `feeId`, `amount`, `method`, `reference`, `status`, `date` | Belongs to Fee |
| `LessonTopic` | `id`, `lessonId`, `weekNumber`, `topic` | `@unique([lessonId, weekNumber])` |
| `AuditLog` | `id`, `userId`, `action`, `entity`, `entityId`, `description` | Indexes on `userId`, `[entity, entityId]` |

**Soft-delete pattern**: `Teacher` and `Student` have `deletedAt` field. `prisma.ts:9` marks `SOFT_DELETE_MODELS = ["Student", "Teacher", "Parent"]`. Soft-delete filter injected automatically for read ops via `$allOperations` extension. Admin recovery function `softDeleteRecord()` exists at `prisma.ts:75`.

**Missing indexes** (potential N+1 risks):
- No index on `Fee.status` or `Fee.paidAmount` for billing queries
- No index on `Attendance.present` for attendance reporting
- `Result` has no index on `studentId` alone (only the compound `@unique`)

---

## Build / Run / Test / Deploy Commands

| Command | Description | Status |
|---|---|---|
| `npm run dev` | Start Next.js in development mode (with Prisma auto-generate) | Works |
| `npm run build` | `prisma generate && next build` | Works |
| `npm run start` | Start production Next.js server | Works |
| `npm run lint` | `eslint` | Works |
| `npm run db:generate` | `prisma generate` | Works |
| `npm run db:push` | `prisma db push` | Works |
| `npm run db:migrate` | `prisma migrate dev` | Works |
| `npm run db:seed` | `npx tsx prisma/seed.ts` | Works |
| `npm run prisma:studio` | `prisma studio` | Works |

**No test script** defined in `package.json` — no `npm test` or equivalent.

---

## Dead Code / Unused Files / Unreachable Routes

| File/Path | Issue |
|---|---|
| `src/lib/data/*` (teacher.ts, subject.ts, etc.) | Data access helpers exist but may not all be used by the actions layer — need verification |
| `src/lib/mockData.ts` | Mock data generated but may not be imported anywhere |
| `src/component/FinanceChart.tsx` | Render chart component — may have no consumers |
| `src/component/CountChartContainer.tsx` / `AttendanceChartContainer.tsx` | Chart containers — may be admin-only |
| `src/component/TeacherAssignmentsClient.tsx` / `TeacherAttendanceClient.tsx` / `TeacherGradesClient.tsx` / `TeacherTimetableClient.tsx` | Named "Client" but may only be used in teacher dashboard |
| `src/app/api/auth/[...nextauth]\route.ts` | Not found via glob — may be auto-generated by NextAuth |
| Any route under `/dashboard/admin/list/parents/new` | Exists in menu but check if page/file exists |
| `src/app/dashboard/admin/list/events\[id]\edit\page.tsx` | Exists in directory listing — needs verification |

---

## Git Health

- **Commit messages**: Not checked — need to review `git log`
- **Branch strategy**: `main` appears to be the default branch (no explicit branch strategy visible)
- **Secrets in git history**: `.env` was read and contains `12345` password and `your-super-secret-key-for-next-auth-12345`. If these were ever committed, they should be rotated immediately.
- **Large binaries**: `.gitignore` likely excludes `node_modules` and `.next` — need to verify.

**Unverified items (need confirmation):**
- Whether `.env` or any `.env.*` is committed to git
- Exact commit message quality/convention
- Whether all `src/lib/data/*.ts` files are actually imported/used
- Whether `mockData.ts` is referenced anywhere
- Full list of API routes (only `src/app/api/auth/` found)

---

## What This Project Is

A **prototype-to-MVP school management platform** built with Next.js 16 App Router, PostgreSQL, Prisma ORM, and NextAuth. It provides role-separated dashboards (admin, teacher, student, parent) for managing students, teachers, classes, subjects, attendance, grades, timetables, events, announcements, and finance/payments. The system uses a soft-delete pattern for teachers/parents/students, Zod-based form validation, and TailwindCSS for styling. Google OAuth is configured but likely non-functional (missing credentials in `.env`). No test suite exists. The codebase has several architectural rough edges (client-side only authZ, soft-delete/read-mix, in-memory rate limiter, missing indexes) but functional core is in place.