import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {}
    });
  });

  test("renders redesigned login shell", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByTestId("login-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Selamat datang kembali/i })).toBeVisible();
    await expect(page.getByTestId("login-username-input")).toBeVisible();
    await expect(page.getByTestId("login-password-input")).toBeVisible();
    await expect(page.getByTestId("login-submit-button")).toBeEnabled();
  });

  test("validates required fields on empty submission", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByTestId("login-submit-button").click();
    await expect(page.getByText(/Username wajib diisi/i)).toBeVisible();
    await expect(page.getByText(/Password wajib diisi/i)).toBeVisible();
  });

  test("rejects too-short username", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByTestId("login-username-input").fill("ab");
    await page.getByTestId("login-password-input").fill("secret1");
    await page.getByTestId("login-submit-button").click();
    await expect(page.getByText(/Username minimal 3 karakter/i)).toBeVisible();
  });

  test("password reveal toggle flips input type", async ({ page }) => {
    await page.goto("/auth/login");
    const pwd = page.getByTestId("login-password-input");
    await pwd.fill("supersecret");
    await expect(pwd).toHaveAttribute("type", "password");
    await page.getByTestId("login-password-toggle").click();
    await expect(pwd).toHaveAttribute("type", "text");
    await page.getByTestId("login-password-toggle").click();
    await expect(pwd).toHaveAttribute("type", "password");
  });
});
