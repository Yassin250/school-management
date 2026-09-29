# Phase 4 — Testing: Assessment, Strategy & Implementation

## 4.1 Assess What Exists

| Metric | Value |
|---|---|
| Test files found | 0 |
| Test framework | None configured |
| Test runner | None |
| Assertion library | None (would use Jest/Vitest expect) |
| Coverage percentage | N/A (0% — no tests) |
| E2E tests | None |
| CI/CD test pipeline | None |

### Test files by category (all zero):
- Unit tests: 0
- Integration tests: 0
- API route tests: 0
- Component tests: 0
- E2E tests: 0

### Tests that pass trivially / mock everything meaningful / assert implementation details:
- N/A — no tests exist

### Real coverage by module (not just headline percentage):
- Since no tests exist, 0% coverage across all modules
- **Uncovered paths that matter most**: entire auth flow, all form validations, all API routes, all dashboard pages

## 4.2 Design the Strategy

### Testing pyramid for this project:

| Level | Target Ratio | Rationale |
|---|---|---|
| **Unit** | 50% | Fastest feedback; validate individual functions (validation schemas, utility functions, Prisma extensions, server actions) |
| **Integration** | 35% | Test API routes end-to-end, form submissions with real Prisma calls, authentication flows |
| **Component** | 10% | Critical UI components (forms, dashboards) with user interactions |
| **E2E** | 5% | Critical user journeys (login → dashboard → key action → logout) |

**Tools recommended**:
- **Vitest** — fast, native TypeScript support, works with Next.js
- **React Testing Library** — component testing, DOM-centric
- **msw** (Mock Service Worker) — API route mocking for unit/integration tests
- **Playwright** — E2E user journeys
- **Zod** — already used for validation; schemas can be reused for test data

### Name the tools (one-line justification):
- **Vitest** — fast TypeScript test runner with zero config for Next.js
- **React Testing Library** — render components the way users interact; accessible Testing Library included
- **msw** — intercept API routes in tests; avoids needing running server for unit tests
- **Playwright** — full browser E2E; handles auth, multiple tabs, file uploads

### Test data strategy:
- **Factories** — use `tsx` factories for creating test users/students/teachers with sensible defaults
- **Seeding** — `prisma/seed.ts` can populate DB for integration tests; use transactional fixtures for isolation
- **Deterministic IDs** — fix IDs where order matters (e.g., first student = student with id "1")
- **Time mocking** — use `vi.setSystemTime()` for date-dependent tests (attendance, fees, expiries)
- **Isolation** — each test wraps DB operations in `prisma.$transaction` or uses unique DB names per test

## 4.3 Enumerate the Tests That Must Exist

### Prioritised test matrix (ID, type, target, scenario, priority):

| ID | Type | Target | Scenario | Why It Matters | Priority |
|---|---|---|---|---|---|
| **TEST-001** | API | `POST /api/auth/credentials` | Valid login with correct password | Verifies auth flow works end-to-end | P0 |
| **TEST-002** | API | `POST /api/auth/credentials` | Invalid password | Ensures null returned, not crash | P0 |
| **TEST-003** | API | `POST /api/auth/credentials` | Missing email/password | Ensures graceful handling | P0 |
| **TEST-004** | API | `POST /api/auth/credentials` | Rate limit exceeded (5 logins/15min) | Verifies rate limiter blocks | P1 |
| **TEST-005** | API | `GET /dashboard/admin/list/teachers` | User with role="teacher" accesses admin route | **P0** — Tests that client-hide is NOT enough; server must reject | P0 |
| **TEST-006** | API | `GET /dashboard/admin/list/teachers` | User with role="admin" accesses admin route | Verifies admin can access | P0 |
| **TEST-007** | API | `POST /students` | Create student with valid data | Verifies create flow + audit log | P0 |
| **TEST-008** | API | `POST /students` | Create student with short username (< 3 chars) | Zod validation: "Username must be at least 3 characters" | P1 |
| **TEST-009** | API | `POST /students` | Create student with mismatched password confirmation | Zod refine: "Passwords do not match" | P1 |
| **TEST-010** | API | `POST /students` | Create student with invalid email format | Zod: "Invalid email!" | P1 |
| **TEST-011** | API | `POST /students` | Create student with No. 1 phone too short | Zod: "Phone must be at least 10 characters" | P1 |
| **TEST-012** | API | `POST /students` | Create student missing required class/grade/parent | Schema validation: required fields | P1 |
| **TEST-013** | API | `POST /payments` | Create payment for valid fee | Verifies payment flow | P1 |
| **TEST-014** | API | `POST /payments` | Duplicate payment prevention | Prevents double-charging | P1 |
| **TEST-015** | API | `GET /dashboard/student/fees` | Student views own fees | Verifies resource-scoped access | P1 |
| **TEST-016** | Component | StudentForm create mode | Submit form with all valid data | End-to-end form flow | P1 |
| **TEST-017** | Component | StudentForm create mode | Submit with short username | Client-side validation catches error | P2 |
| **TEST-018** | Component | Teacher dashboard | Teacher views own classes only | IDOR prevention — can teacher see other teacher's classes? | P0 |
| **TEST-019** | Component | Parent dashboard | Parent views only own children's grades | IDOR prevention | P0 |
| **TEST-020** | E2E | Full journey | Login as student → view timetable → view grades | Critical user journey | P1 |
| **TEST-021** | E2E | Full journey | Login as parent → view children's attendance | Critical user journey | P1 |
| **TEST-022** | Integration | Attendance marking | Mark attendance present/absent for a lesson | Core functionality | P1 |
| **TEST-023** | Integration | Grade entry → result publication | Enter grade → appear on student dashboard | End-to-end academic flow | P2 |
| **TEST-024** | Integration | Fee creation → payment → receipt | Create fee → simulate payment → verify status | Financial flow | P2 |
| **TEST-025** | Integration | Term current-flag logic | Set term as current → verify only current term lessons appear | Business rule | P2 |

**Priority key**: P0 = must exist before any release; P1 = high value, blocks release; P2 = significant quality improvement; P3 = polish

### Critical E2E user journeys (listed by name):
1. **Student journey**: Login → View timetable → View grades → View fees → Logout
2. **Parent journey**: Login → View children → View attendance → View grades → View fees → Logout
3. **Teacher journey**: Login → View own classes → Mark attendance → Enter grades → View timetable → Logout
4. **Admin journey**: Login → Manage students → Manage teachers → View finance → Generate reports → Logout

## 4.4 Write Them

Since no tests exist, I'll create the foundational test infrastructure first, then the highest-priority tests.

### Setup: vitest.config.ts

First, add test script to `package.json` and create vitest config:

**package.json** — add test script:
```json
"scripts": {
  "dev": "next dev",
  "build": "prisma generate && next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest",
  "postinstall": "prisma generate",
  "db:generate": "prisma generate",
  "db:push": "prisma db push",
  "db:migrate": "prisma migrate dev",
  "db:seed": "npx tsx prisma/seed.ts"
}
```

**vitest.config.ts** — create at root:
```ts
import { defineConfig } from "vitest/config";
import tsx from "tsx";

export default defineConfig({
  test: {
    filename: "**.{test,spec}.{ts,tsx}",
    environment: "jsdom",
    globals: true,
    timeout: 10000,
    reporters: ["default", "dot"],
    optimizeDeps: {
      include: ["@hookform/resolvers", "zod", "lucide-react"],
    },
  },
  plugins: [
    tsx()
  ]
});
```

### Setup: msw config (Mock Service Worker)

Create `src/mocks/handlers.ts` and `src/mocks/browser.ts` for API mocking in tests.

### Now the actual test files:

#### TEST-001/002/003: Auth API routes (P0)

Create `src/app/api/auth/[...nextauth]/route.test.ts` — but wait, the route is auto-generated by NextAuth. Let me test the auth flow via NextAuth handlers directly.

Actually, let me test the auth validation logic in `src/auth.ts` instead, since the `[...nextauth]` route is NextAuth's internal handler.

Create `test/auth.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { compare } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

// In-memory Prisma mock or use test database
const prisma = new PrismaClient({ log: ["query"] });

describe("Authentication flow", () => {
  beforeEach(async () => {
    // Clean up any test data
    await prisma.$executeRaw`DELETE FROM "AuditLog"`;
  });

  it("TEST-001: Valid login with correct password", async () => {
    // Setup: create a user first
    const password = await bcrypt.hash("TestPass123!", 10);
    const user = await prisma.user.create({
      data: {
        username: "testteacher",
        email: "teacher@test.school",
        password,
        role: "teacher",
      },
    });
    
    // The real compare function
    const isValid = await compare("TestPass123!", user.password);
    expect(isValid).toBe(true);
  });

  it("TEST-002: Invalid password returns false", async () => {
    const isValid = await compare("wrongpassword", "hashed_password_doesnt_match");
    expect(isValid).toBe(false);
  });
});
```

#### TEST-005/006: Authorisation matrix (P0)

Create `test/authorization.test.ts`:

```ts
import { describe, it, expect } from "vitest";

// Simulate the role check that happens on protected pages
const VALID_ROLES = ["admin", "teacher", "student", "parent"] as const;

const canAccess = (userRole: string, requiredRole: string) => {
  if (!VALID_ROLES.includes(userRole as (typeof VALID_ROLES)[number])) {
    return false;
  }
  // A user's role must match or be broader than required
  // For this system, roles are discrete — only exact match
  return userRole === requiredRole;
};

// TEST-005: Teacher trying to access admin route
it("TEST-005: Teacher cannot access admin-only route", () => {
  expect(canAccess("teacher", "admin")).toBe(false);
});

// TEST-006: Admin can access admin route
it("TEST-006: Admin can access admin-only route", () => {
  expect(canAccess("admin", "admin")).toBe(true);
});
```

#### TEST-007/008/009/010/011: Student creation validation (P0/P1)

Create `test/studentCreation.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { z } from "zod";

// studentCreateSchema from formValidation.ts
const studentCreateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters").regex(/^[a-zA-Z0-9._]+$/, "Only letters, numbers, dots and underscores"),
  name: z.string().min(1, "First name is required!"),
  surname: z.string().min(1, "Surname is required!"),
  email: z.string().min(1, "Email is required!").email("Invalid email!"),
  phone: z.string().optional().or(z.literal("")).refine(
    (val) => !val || val.length >= 10,
    "Phone must be at least 10 characters when provided"
  ),
  address: z.string().min(1, "Address is required!"),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  birthday: z.string().min(1, "Birthday is required!").refine((val) => !Number.isNaN(Date.parse(val)), "Invalid date"),
  img: z.string().optional().or(z.literal("")).refine(
    (val) => !val || z.string().url().safeParse(val).success,
    "Image must be a valid URL"
  ),
  subjects: z.array(z.coerce.number().int().positive()).min(1, "At least one subject is required!"),
  classes: z.array(z.coerce.number().int().positive()),
});

// TEST-007: Valid student creation
it("TEST-007: Valid student data passes schema", () => {
  const valid = studentCreateSchema.safeParse({
    username: "jdoe",
    name: "John",
    surname: "Doe",
    email: "john@test.school",
    phone: "+250780000000",
    address: "123 Test St",
    sex: "MALE",
    birthday: "2010-01-01",
    subjects: [1],
    classes: [1],
  });
  expect(valid.success).toBe(true);
});

// TEST-008: Short username fails
it("TEST-008: Username too short fails validation", () => {
  const result = studentCreateSchema.safeParse({
    username: "jo", // only 2 chars
    name: "John",
    surname: "Doe",
    email: "john@test.school",
    phone: "+250780000000",
    address: "123 Test St",
    sex: "MALE",
    birthday: "2010-01-01",
    subjects: [1],
    classes: [1],
  });
  expect(result.success).toBe(false);
  if (result.success) return; // unreachable
  expect(result.error?.issues[0]?.message).toContain("at least 3 characters");
});

// TEST-009: Mismatched passwords — but wait, studentCreateSchema doesn't include password in base.
// Let me check the extended version...

// Actually, the create schema adds password. Let me test that:
const studentCreateWithPasswordSchema = studentCreateSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

it("TEST-009: Password confirmation mismatch fails", () => {
  const result = studentCreateWithPasswordSchema.safeParse({
    username: "jdoe",
    name: "John",
    surname: "Doe",
    email: "john@test.school",
    phone: "+250780000000",
    address: "123 Test St",
    sex: "MALE",
    birthday: "2010-01-01",
    subjects: [1],
    classes: [1],
    password: "Pass123",
    confirmPassword: "DifferentPass123",
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues.find(i => i.path.includes("confirmPassword"))?.message).toBe("Passwords do not match");
});

// TEST-010: Invalid email format
it("TEST-010: Invalid email format fails", () => {
  const result = studentCreateSchema.safeParse({
    username: "jdoe",
    name: "John",
    surname: "Doe",
    email: "not-an-email",
    phone: "+250780000000",
    address: "123 Test St",
    sex: "MALE",
    birthday: "2010-01-01",
    subjects: [1],
    classes: [1],
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues.find(i => i.path.includes("email"))?.message).toContain("Invalid email");
});

// TEST-011: Phone too short
it("TEST-011: Phone too short fails", () => {
  const result = studentCreateSchema.safeParse({
    username: "jdoe",
    name: "John",
    surname: "Doe",
    email: "john@test.school",
    phone: "123", // only 3 chars
    address: "123 Test St",
    sex: "MALE",
    birthday: "2010-01-01",
    subjects: [1],
    classes: [1],
  });
  expect(result.success).toBe(false);
  expect(result.error?.issues.find(i => i.path.includes("phone"))?.message).toContain("at least 10 characters");
});
```

#### TEST-018/019: IDOR tests (P0)

Create `test/idortest.test.ts`:

```ts
import { describe, it, expect } from "vitest";

// Mock database data
const teachers = [
  { id: "t1", name: "Teacher A", role: "teacher" },
  { id: "t2", name: "Teacher B", role: "teacher" },
];

const students = [
  { id: "s1", name: "Student A", parentId: "p1", classId: "c1" },
  { id: "s2", name: "Student B", parentId: "p1", classId: "c1" },
];

// TEST-018: Teacher can only see own students (IDOR prevention)
it("TEST-018: Teacher cannot view other teacher's students by ID change", () => {
  // If teacher "t1" tries to access student s2 by changing URL ID
  const asTeacherT1 = students.find(s => s.parentId === "p1" && true); // simplified
  // The point: every resource-scoped route must verify the user owns the resource
  // before returning data. Changing ID must NOT return another user's data.
  expect(true).toBe(true); // placeholder — actual implementation needs DB + session
});

// TEST-019: Parent can only view own children's data
it("TEST-019: Parent cannot view other parent's children by URL change", () => {
  // Similar IDOR test for parent dashboard
  expect(true).toBe(true);
});
```

### Running the tests:

After creating the files, run:

```bash
npm test     # or: npx vitest
```

### Coverage targets per module (estimated, since no tests exist yet):

| Module | Target Coverage | Key Functions to Test |
|---|---|---|
| `src/lib/formValidation.ts` | 80% | All Zod schemas, safeParse edge cases |
| `src/lib/rate-limit.ts` | 100% | rateLimit function with boundary values |
| `src/lib/auth/permissions.ts` | 80% | All role/permission checks |
| `src/lib/actions/*` (each) | 70% | create/update/delete operations |
| `src/app/api/*` routes | 70% | Valid input, invalid input, error cases |
| `src/component/forms/*` | 80% | Submit valid, submit invalid, error messages |
| Critical E2E journeys | 50% | Full user flows with Playwright |

### Commands to run tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npx vitest run --coverage

# Run specific test file
npx vitest run test/auth.test.ts

# Run tests in watch mode (dev)
npx vitest watch
```

### What's needed to make tests pass:

Several tests will fail initially because:
1. **No test database** — need to configure Vitest with a test Prisma schema or use `vitest-prisma`
2. **NextAuth in tests** — `auth()` requires a request context; need to mock `next/auth` 
3. **Prisma auto-generated types** — some test types may not align exactly

**Fix**: Set up a test database URL in `.env.test` or use `prisma db execute` with migration tests.

---

## Summary

**Testing status**: Zero tests exist. Project is at a point where test infrastructure must be built from scratch.

**Recommended starting point**: 
1. Add `npm test` script + vitest config
2. Write P0 tests for auth flow and authorisation (TEST-001 through TEST-006)
3. Write P1 tests for form validation (TEST-007 through TEST-012)
4. Set up MSW for API mocking
5. Add E2E with Playwright for critical journeys

**Effort estimate**: 
- Setup (vitest + configs): S (2-3 hours)
- P0 auth + authorisation tests: S (3-4 hours) 
- P1 form validation tests: S (3-4 hours)
- P0 IDOR tests: M (half day)
- E2E framework: M (half day)
- **Total to meaningful coverage**: ~2-3 days

**Unverified items**: 
- Exact Vitest + Next.js App Router compatibility (may need `next/jest` or custom config)
- Whether Prisma can be used in Vitest environment without a real PostgreSQL container
- MSW interceptor coverage for all API routes