import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByPlaceholder("you@company.com").fill("khaled@cisolens.io");
  await page.getByPlaceholder("••••••••").fill("Demo1234!");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("upload and review evidence", async ({ page }) => {
  await login(page);
  await page.goto("/clients");

  await page.locator("text=MEAPAL Egypt").first().click();
  await expect(page).toHaveURL(/\/clients\//);
  await expect(page.getByText("Evidence Vault")).toBeVisible();

  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "+ Attach" }).first().click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles("e2e/fixtures/sample.txt");

  await expect(page.getByText("sample.txt").first()).toBeVisible();
  await expect(page.getByText("SUBMITTED").first()).toBeVisible();
  await page.getByRole("button", { name: "✓" }).first().click();
  await expect(page.getByText("ACCEPTED").first()).toBeVisible();
});
