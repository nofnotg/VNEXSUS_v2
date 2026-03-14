import { expect, test, type Page } from "@playwright/test";
import { rmSync } from "node:fs";
import path from "node:path";

const demoStatePath = path.join(process.cwd(), "apps", "web", ".demo", "state.json");

test.beforeEach(() => {
  rmSync(demoStatePath, { force: true });
});

async function signInAs(page: Page, roleLabel: "Demo Investigator" | "Demo Consumer" | "Demo Admin") {
  await page.goto("/sign-in");
  await page.getByLabel("Demo role").selectOption({ label: roleLabel });
  await page.getByRole("button", { name: "Continue" }).click();
  await page.waitForURL("**/cases");
}

test("app boot and sign-in page render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Epic 0 baseline")).toBeVisible();

  await page.goto("/sign-in");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();
});

test("signed-in investigator can open cases and analytics", async ({ page }) => {
  await signInAs(page, "Demo Investigator");
  await expect(page).toHaveURL(/\/cases$/);

  await page.goto("/cases/analytics");
  await expect(page.getByRole("heading", { name: "Case Analytics" })).toBeVisible();
});

test("mock upload, OCR, narrative, and PDF export work in demo mode", async ({ page }) => {
  await signInAs(page, "Demo Investigator");
  await page.goto("/cases/demo-case-1");

  await page.setInputFiles('input[type="file"]', {
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n")
  });

  await page.getByRole("button", { name: "Upload document" }).click();
  await expect(page.getByRole("status")).toContainText("Document uploaded successfully.");
  await expect(page.getByText("sample.pdf")).toBeVisible();

  await page.getByRole("button", { name: "Run mock OCR" }).click();
  await expect(page.getByRole("cell", { name: "VNEXUS Demo Medical Center" }).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("cell", { name: "visit" }).first()).toBeVisible({ timeout: 15000 });

  await page.getByRole("link", { name: "Investigator narrative" }).click();
  await expect(page).toHaveURL(/\/reports\/investigator\/narrative/);
  await expect(page.getByRole("heading", { name: "Investigator Narrative" })).toBeVisible();

  const pdfResponse = await page.context().request.get("/api/cases/demo-case-1/reports/investigator/narrative/pdf?lang=en");
  expect(pdfResponse.status()).toBe(200);
  expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");
});
