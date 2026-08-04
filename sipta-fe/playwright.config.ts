import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright smoke test configuration for SIPTA v2.
 *
 * These tests protect the redesign contract: they exercise the flows that
 * do NOT depend on a live backend (auth-less pages, form validation,
 * theme toggle, header nav rendering behind stubbed identity) so that
 * future presentation refactors have a safety net.
 */
export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  use: {
    baseURL: process.env.SIPTA_E2E_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "chromium-mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
});
