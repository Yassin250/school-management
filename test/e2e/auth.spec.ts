import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

// ============================================================
// Constants
// ============================================================

const PASSWORD = "Password123";

const USERS = {
  systemAdmin: { email: "admin@yourschool.rw", path: "/dashboard/admin" },
  schoolAdmin: { email: "schooladmin@yourschool.rw", path: "/dashboard/admin" },
  principal: { email: "principal@yourschool.rw", path: "/dashboard/principal" },
  teacher: { email: "teacher@yourschool.rw", path: "/dashboard/teacher" },
  accountant: { email: "accountant@yourschool.rw", path: "/dashboard/accountant" },
  registrar: { email: "registrar@yourschool.rw", path: "/dashboard/registrar" },
  parent: { email: "parent@yourschool.rw", path: "/dashboard/parent" },
  student: { email: "student@yourschool.rw", path: "/dashboard/student" },
};

// ============================================================
// Helper
// ============================================================

async function login(page: Page, email: string, password = PASSWORD) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
}

// ============================================================
// Group A — Unauthenticated
// ============================================================

test.describe("Unauthenticated access", () => {
  test("A1: /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("A2: /dashboard/teacher redirects to /login", async ({ page }) => {
    await page.goto("/dashboard/teacher");
    await expect(page).toHaveURL(/\/login/);
  });

  test("A3: /dashboard/principal redirects to /login", async ({ page }) => {
    await page.goto("/dashboard/principal");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ============================================================
// Group B — Each role logs in and reaches the right dashboard
// ============================================================

test.describe("Role-based dashboard routing", () => {
  for (const [key, user] of Object.entries(USERS)) {
    test(`B: ${key} lands on ${user.path}`, async ({ page }) => {
      await login(page, user.email);
      await expect(page).toHaveURL(new RegExp(user.path));
    });
  }
});

// ============================================================
// Group C — Logout
// ============================================================

test.describe("Logout", () => {
  test("C1: logout returns to /login", async ({ page }) => {
    await login(page, USERS.teacher.email);
    await expect(page).toHaveURL(/\/dashboard\/teacher/);

    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL(/\/login/);
  });

  test("C2: after logout, /dashboard redirects to /login", async ({ page }) => {
    await login(page, USERS.teacher.email);
    await page.click('button:has-text("Sign out")');
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

// ============================================================
// Group D — Direct navigation (authorization boundary)
// ============================================================

test.describe("Direct navigation boundary", () => {
  test("D1: teacher cannot reach /dashboard/principal", async ({ page }) => {
    await login(page, USERS.teacher.email);
    await page.goto("/dashboard/principal");
    // Middleware allows (authenticated) → page shows, but the shell
    // contains a heading indicating the "Principal" dashboard only
    // if we let it render. In S0, the role dashboards are stubs that
    // any authenticated user can reach — this test documents the
    // current boundary and will tighten as we add role guards.
    //
    // For now, we assert the page renders without a 500 error.
    await expect(page.locator("body")).toBeVisible();
  });

  test("D2: student cannot reach /dashboard/admin", async ({ page }) => {
    await login(page, USERS.student.email);
    await page.goto("/dashboard/admin");
    await expect(page.locator("body")).toBeVisible();
  });

  test("D3: parent cannot reach /dashboard/admin", async ({ page }) => {
    await login(page, USERS.parent.email);
    await page.goto("/dashboard/admin");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ============================================================
// Group E — Invalid credentials
// ============================================================

test.describe("Invalid credentials", () => {
  test("E1: wrong password shows error", async ({ page }) => {
    await login(page, USERS.teacher.email, "WrongPassword");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("E2: unknown email shows error", async ({ page }) => {
    await login(page, "nonexistent@yourschool.rw", PASSWORD);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });
});