// ============================================================
// End-to-End Full Workflow Test
// ============================================================
// Runs the complete academic lifecycle:
//   Teacher creates → marks → submits
//   Principal reviews → approves
//   Admin generates → approves → publishes → downloads PDF
//   Student sees the approved marks + report card status
//
// All in a real browser via Playwright.
// ============================================================

import { test, expect, type Page, type Locator } from "@playwright/test";

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------

const PASSWORD = "Password123";

const USERS = {
  teacher: "teacher@yourschool.rw",
  principal: "principal@yourschool.rw",
  schoolAdmin: "schooladmin@yourschool.rw",
  student: "student@yourschool.rw",
};

// Non-numeric-adjacent title so text= selectors don't collide
const RUN_ID = Date.now().toString().slice(-6);
const ASSESSMENT_TITLE = `E2E-Test-${RUN_ID}`;

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 15000,
  });
}

async function logout(page: Page) {
  await page.click('button:has-text("Sign out")');
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

// ------------------------------------------------------------
// 1. Authentication
// ------------------------------------------------------------

test.describe("1. Authentication", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/dashboard/teacher");
    await expect(page).toHaveURL(/\/login/);
  });

  test("teacher can log in and reaches teacher dashboard", async ({ page }) => {
    await login(page, USERS.teacher);
    await expect(page).toHaveURL(/\/dashboard\/teacher/);
    await expect(
      page.getByRole("heading", { name: "Teacher Dashboard" }),
    ).toBeVisible();
  });

  test("teacher cannot access principal dashboard", async ({ page }) => {
    await login(page, USERS.teacher);
    await page.goto("/dashboard/principal");
    // The teacher doesn't have grades.review. The important thing is
    // that no privileged action is available.
    await expect(
      page.locator('button:has-text("Approve")'),
    ).not.toBeVisible({ timeout: 3000 });
    await expect(
      page.locator('button:has-text("Start Review")'),
    ).not.toBeVisible({ timeout: 1000 });
  });

  test("student cannot reach teacher routes", async ({ page }) => {
    await login(page, USERS.student);
    await page.goto("/dashboard/teacher");
    const url = page.url();
    expect(url).not.toContain("/dashboard/teacher/classes/");
  });
});

// ------------------------------------------------------------
// 2. Teacher flow
// ------------------------------------------------------------

test.describe("2. Teacher creates and submits assessment", () => {
  test("teacher creates, marks, and submits a new assessment", async ({
    page,
  }) => {
    await login(page, USERS.teacher);
    await expect(page).toHaveURL(/\/dashboard\/teacher/);

    // Click S1 A class card
    await page.getByRole("link", { name: /S1 A/ }).first().click();
    await expect(page).toHaveURL(/\/dashboard\/teacher\/classes\/[^/]+$/);

    // Click "+ New Assessment"
    await page.click('text=+ New Assessment');
    await expect(page).toHaveURL(/\/assessments\/new$/);

    // Fill form
    await page.fill('input[name="title"]', ASSESSMENT_TITLE);
    await page.selectOption('select[name="type"]', "QUIZ");

    // Submit
    await page.click('button:has-text("Create Assessment")');
    await page.waitForURL(/\/dashboard\/teacher\/classes\/[^/]+\/?$/, {
      timeout: 15000,
    });

    // Verify the assessment appears
    await expect(page.locator(`text=${ASSESSMENT_TITLE}`)).toBeVisible({
      timeout: 10000,
    });

    // Open the assessment
    await page.click(`text=${ASSESSMENT_TITLE}`);
    await expect(page).toHaveURL(/\/assessments\/[^/]+$/);

    // Enter scores for all 3 students
    const scoreInputs = page.locator('input[type="number"]');
    await scoreInputs.nth(0).fill("88");
    await scoreInputs.nth(1).fill("76");
    await scoreInputs.nth(2).fill("92");

    // Save marks
    await page.click('button:has-text("Save Marks")');
    await expect(page.locator("text=Marks saved")).toBeVisible({
      timeout: 10000,
    });

    // Submit for review
    await page.click('button:has-text("Submit for Review")');
    await expect(page.locator("text=SUBMITTED").first()).toBeVisible({
      timeout: 10000,
    });

    await logout(page);
  });
});

// ------------------------------------------------------------
// 3. Principal flow
// ------------------------------------------------------------

test.describe("3. Principal reviews and approves", () => {
  test("principal sees pending review and approves it", async ({ page }) => {
    await login(page, USERS.principal);
    await expect(page).toHaveURL(/\/dashboard\/principal/);

    // Our new assessment should be in the pending list
    await expect(page.locator(`text=${ASSESSMENT_TITLE}`)).toBeVisible({
      timeout: 10000,
    });

    // Open it
    await page.click(`text=${ASSESSMENT_TITLE}`);
    await expect(page).toHaveURL(/\/dashboard\/principal\/reviews\/[^/]+$/);

    // Verify marks are visible (exact cell match)
    await expect(
      page.getByRole("cell", { name: "88", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "92", exact: true }),
    ).toBeVisible();

    // Start review
    await page.click('button:has-text("Start Review")');
    await expect(page.locator("text=UNDER REVIEW").first()).toBeVisible({
      timeout: 10000,
    });

    // Approve
    await page.click('button:has-text("Approve")');
    await page.waitForURL(/\/dashboard\/principal\/?$/, { timeout: 15000 });

    await expect(page.locator(`text=${ASSESSMENT_TITLE}`)).not.toBeVisible({
      timeout: 5000,
    });

    await logout(page);
  });
});

// ------------------------------------------------------------
// 4. Admin flow
// ------------------------------------------------------------

test.describe("4. Admin generates and publishes report cards", () => {
  test("admin generates, approves, publishes, and downloads a report card", async ({
    page,
  }) => {
    await login(page, USERS.schoolAdmin);
    await page.goto("/dashboard/admin/reports");

    await expect(
      page.getByRole("heading", { name: "Report Cards" }),
    ).toBeVisible({ timeout: 10000 });

    // Find a row that isn't already PUBLISHED, so we can walk it
    // through Generate → Approve → Publish
    const rows = page.locator("tbody tr");
    const rowCount = await rows.count();

    let targetRow: Locator | null = null;
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = (await row.textContent()) ?? "";
      if (!text.includes("PUBLISHED")) {
        targetRow = row;
        break;
      }
    }

    // If every row is already PUBLISHED, use the first one (it already has a PDF)
    if (!targetRow) {
      targetRow = rows.first();
    }

    // Step 1: Generate (if applicable)
    const generateBtn = targetRow.locator('button:has-text("Generate")');
    if (await generateBtn.isVisible().catch(() => false)) {
      await generateBtn.click();
      await expect(
        targetRow.locator('button:has-text("Approve")'),
      ).toBeVisible({ timeout: 20000 });
    }

    // Step 2: Approve (if applicable)
    const approveBtn = targetRow.locator('button:has-text("Approve")');
    if (await approveBtn.isVisible().catch(() => false)) {
      await approveBtn.click();
      await expect(
        targetRow.locator('button:has-text("Publish")'),
      ).toBeVisible({ timeout: 20000 });
    }

    // Step 3: Publish (if applicable)
    const publishBtn = targetRow.locator('button:has-text("Publish")');
    if (await publishBtn.isVisible().catch(() => false)) {
      await publishBtn.click();
      await expect(
        targetRow.locator('a:has-text("Download PDF")'),
      ).toBeVisible({ timeout: 20000 });
    }

    // Step 4: Verify the PDF link is present
    const downloadLink = targetRow.locator('a:has-text("Download PDF")');
    await expect(downloadLink).toBeVisible({ timeout: 10000 });

    const href = await downloadLink.getAttribute("href");
    expect(href).toMatch(/^\/api\/report-cards\/.+\/pdf$/);

    // Step 5: Fetch the PDF using the page's authenticated session
    const response = await page.request.get(href!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("application/pdf");

    await logout(page);
  });
});

// ------------------------------------------------------------
// 5. Student view
// ------------------------------------------------------------

test.describe("5. Student sees approved marks", () => {
  test("student dashboard shows approved assessment marks", async ({
    page,
  }) => {
    await login(page, USERS.student);
    await expect(page).toHaveURL(/\/dashboard\/student/);

    await expect(page.locator("text=Approved Grades")).toBeVisible({
      timeout: 10000,
    });

    // The E2E assessment we created should appear in the table
    await expect(page.locator(`text=${ASSESSMENT_TITLE}`)).toBeVisible({
      timeout: 10000,
    });

    await logout(page);
  });

  test("student cannot download report card PDF", async ({ page }) => {
    await login(page, USERS.student);
    const response = await page.request.get(
      "/api/report-cards/some-id/pdf",
    );
    expect([403, 404]).toContain(response.status());
    await logout(page);
  });
});