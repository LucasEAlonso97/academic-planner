import { expect, test } from "@playwright/test";

import { openWithCareer, statusOf } from "./helpers";

test("pestañas por año y cambio de estado", async ({ page }) => {
  await openWithCareer(page, "psicologia-p1-13");

  await page.getByRole("button", { name: "2°", exact: true }).click();
  await expect(page.getByRole("region", { name: "2° año" })).toBeVisible();
  await expect(page.getByRole("region", { name: "1° año" })).toHaveCount(0);

  await statusOf(page, "Psicoanálisis I", 12).selectOption("in_progress");
  await expect(page.locator("#mi-avance")).toContainText("Cursando");
});

test("cambiar de carrera desde el menú", async ({ page }) => {
  await openWithCareer(page, "analista-sistemas");

  await page.getByRole("button", { name: "Abrir menú" }).click();
  await page.locator("#mobile-navigation").getByRole("button", { name: /Abogacía/ }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Abogacía");
});
