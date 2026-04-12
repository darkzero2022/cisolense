import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill("khaled@cisolens.io");
  await page.getByPlaceholder("••••••••").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("assessment to results and actions flow", async ({ page }) => {
  await login(page);

  await page.getByRole("link", { name: "Clients" }).click();
  await expect(page).toHaveURL(/\/clients/);

  const unique = `QA ${Date.now()}`;
  await page.getByRole("button", { name: "+ New Client" }).click();
  await page.getByPlaceholder("e.g. Acme Corp").fill(unique);
  await page.getByPlaceholder("e.g. AC", { exact: true }).fill("Q1");
  await page.getByPlaceholder("e.g. Financial Services").fill("Technology");
  await page.getByText("NIST CSF").last().click();
  await page.getByRole("button", { name: "Create Client" }).click();

  await expect(page.getByText(unique)).toBeVisible();
  await page.getByText(unique).first().click();
  await expect(page).toHaveURL(/\/clients\//);

  await page.getByRole("button", { name: /Assess NIST/i }).click();
  await expect(page).toHaveURL(/\/assess\//);

  await expect(page.getByText("Question 1 of")).toBeVisible();
  await page.locator('div[class*="option_"]').first().click();
  await page.getByRole("button", { name: /Next|Complete Assessment/i }).click();
  await expect(page.getByText(/Question [12] of/)).toBeVisible();

  await page.goto("/actions");
  await expect(page).toHaveURL(/\/actions/);
  await expect(page.getByText("Won't Fix")).toBeVisible();
});
