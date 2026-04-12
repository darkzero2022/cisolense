import { expect, test } from "@playwright/test";

test("wrong credentials show error", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill("khaled@cisolens.io");
  await page.getByPlaceholder("••••••••").fill("WrongPass123!");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText("Invalid email or password.")).toBeVisible();
});

test("login redirects to dashboard and logout returns to login", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill("khaled@cisolens.io");
  await page.getByPlaceholder("••••••••").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("Command Center")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});
