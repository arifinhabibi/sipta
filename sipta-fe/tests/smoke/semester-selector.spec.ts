import { test, expect } from "@playwright/test";

/**
 * Semester Selector smoke test — exercises the UI contract required by
 * docs/frontend-architecture/21-semester-student-report.md when the store
 * has pre-loaded academic year data.
 *
 * We stub network responses via localStorage / route interception so no
 * live backend is needed.
 */

test.describe("Semester selector — component contract", () => {
  test("URL is canonicalized to include academic_year_id", async ({ page }) => {
    // Stub auth + academic-year list via routes.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            token: "x".repeat(40),
            refreshToken: "r".repeat(40),
            tokenExpiry: Date.now() + 3_600_000,
            user: {
              fullname: "Ustadz Ahmad",
              degree: "",
              email: "u@a.id",
              photo: "",
              role: "teacher",
            },
            instance: {
              id: "1",
              name: "Arrahman",
              description: "",
              type_institutions: "TPA",
              latitude: "",
              longitude: "",
              logo: "",
              created_at: "",
              update_at: "",
            },
            academic_year: { name: "2024/2025", periode: "Ganjil" },
            isAuthenticated: true,
            isInitialized: true,
          },
          version: 2,
        }),
      );
    });

    const YEAR_ACTIVE = "aa000000-0000-0000-0000-000000000001";
    const YEAR_CLOSED = "aa000000-0000-0000-0000-000000000002";

    await page.route("**/instance/academic-years**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: YEAR_ACTIVE,
              name: "2024/2025",
              periode: "Ganjil",
              status: "active",
              start_periode: "2024-07-01",
              end_periode: "2024-12-31",
              is_active: true,
              instance_id: "1",
              created_at: "",
              update_at: "",
            },
            {
              id: YEAR_CLOSED,
              name: "2023/2024",
              periode: "Genap",
              status: "closed",
              start_periode: "2024-01-01",
              end_periode: "2024-06-30",
              is_active: false,
              instance_id: "1",
              created_at: "",
              update_at: "",
            },
          ],
        }),
      });
    });

    // Stub student performance responses so the page load resolves.
    await page.route("**/reports/performance-students/student/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: null }),
      });
    });
    await page.route("**/reports/perfomance-students/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: null }),
      });
    });

    await page.goto("/reports/students/s-123", { waitUntil: "domcontentloaded" });
    // Allow client-side effects to canonicalize the URL.
    await page.waitForURL(/academic_year_id=/, { timeout: 8_000 }).catch(() => {});

    const url = new URL(page.url());
    const id = url.searchParams.get("academic_year_id");
    expect(id).toBeTruthy();
    expect([YEAR_ACTIVE, YEAR_CLOSED]).toContain(id);

    // Selector should be visible with an active badge for the resolved term.
    await expect(page.getByTestId("semester-selector")).toBeVisible();
  });
});
