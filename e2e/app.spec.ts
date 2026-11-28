import { expect, test } from "@playwright/test";

import { TODAY, openWithCareer, statusOf } from "./helpers";

test.describe("primera visita", () => {
  test("pide la carrera y la recuerda", async ({ page }) => {
    await page.clock.setFixedTime(TODAY);
    await page.goto("/");

    const picker = page.getByRole("dialog", { name: "¿Qué carrera estudiás?" });
    await expect(picker).toBeVisible();

    await picker.getByRole("button", { name: /Psicología/ }).click();

    await expect(picker).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Psicología");

    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Psicología");
    await expect(page.getByRole("dialog", { name: "¿Qué carrera estudiás?" })).toHaveCount(0);
  });
});

test.describe("estados de las materias", () => {
  test("aprobar habilita materias y se puede deshacer", async ({ page }) => {
    await openWithCareer(page, "analista-sistemas");

    const estructurada = statusOf(page, "Programación Estructurada", 1);
    const programacionI = statusOf(page, "Programación I", 10);

    await expect(programacionI).toHaveValue("pending");
    await expect(programacionI.locator("option[value=in_progress]")).toBeDisabled();

    await estructurada.selectOption("passed");

    await expect(page.getByRole("status").filter({ hasText: "Se habilitó" })).toContainText("Programación I");
    await expect(programacionI.locator("option[value=in_progress]")).toBeEnabled();

    await page.getByRole("button", { name: "Deshacer" }).click();
    await expect(estructurada).toHaveValue("pending");
  });

  test("para aprobar hace falta la correlativa aprobada", async ({ page }) => {
    await openWithCareer(page, "analista-sistemas", { "programacion-estructurada": "regular" });

    const programacionI = statusOf(page, "Programación I", 10);

    await expect(programacionI.locator("option[value=regular]")).toBeEnabled();
    await expect(programacionI.locator("option[value=passed]")).toBeDisabled();
  });

  test("nota y promedio", async ({ page }) => {
    await openWithCareer(page, "analista-sistemas", {
      "programacion-estructurada": "passed",
      "sistemas-computacion-1": "passed",
    });

    await page.getByLabel("Nota de Programación Estructurada", { exact: true }).fill("9");
    await page.getByLabel("Nota de Programación Estructurada", { exact: true }).press("Enter");
    await page.getByLabel("Nota de Sistemas de Computación I", { exact: true }).fill("7,5");
    await page.getByLabel("Nota de Sistemas de Computación I", { exact: true }).press("Enter");

    await expect(page.locator("#mi-avance")).toContainText("Promedio 8,25");
  });

  test("equivalencia: aprobada sin nota", async ({ page }) => {
    await openWithCareer(page, "analista-sistemas");

    const select = statusOf(page, "Problemática del Mundo Actual", 4);
    await select.selectOption("equivalence");

    await expect(select).toHaveValue("equivalence");
    await expect(page.getByLabel("Nota de Problemática del Mundo Actual", { exact: true })).toHaveCount(0);
    await expect(page.locator("#mi-avance")).toContainText("1 de 34 materias aprobadas");
  });
});

test("optativa con nombre", async ({ page }) => {
  await openWithCareer(page, "psicologia-p1-13");

  const year4 = page.getByRole("region", { name: "4° año" });
  await year4.getByRole("button", { name: /4° año/ }).click();
  await year4.getByRole("button", { name: "Ponerle nombre" }).click();
  await year4.getByPlaceholder("¿Cuál elegiste?").fill("Psicología del Deporte");
  await year4.getByPlaceholder("¿Cuál elegiste?").press("Enter");

  await expect(year4).toContainText("Psicología del Deporte");
});

test("planificador: armado automático y fecha estimada", async ({ page }) => {
  await openWithCareer(page, "analista-sistemas");

  const plan = page.locator("#planificar");
  await plan.getByLabel("Materias por cuatrimestre").selectOption("6");
  await plan.getByRole("button", { name: "Armar plan automático" }).click();

  await expect(plan).toContainText("Terminarías de cursar en el 2° cuatrimestre de 2029");
  await expect(plan).not.toContainText("problemas en el plan");
});

test("cambio de plan con equivalencias", async ({ page }) => {
  await openWithCareer(page, "periodismo-i3-06", {
    redaccion: "passed",
    "problematica-del-mundo-actual": "passed",
  });

  const card = page.locator("section", { hasText: "Cambiar de plan o de carrera" }).last();
  await card.getByLabel("Plan o carrera de destino").selectOption("periodismo");
  await card.getByRole("button", { name: "Ver qué pasa" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("2 materias pasan como equivalencia");
  await dialog.getByRole("button", { name: "Pasar 2 materias" }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Periodismo, Gestión y Producción de Contenidos");
  await expect(statusOf(page, "Redacción", 1)).toHaveValue("equivalence");
});

test("pasar el progreso a otro dispositivo con el link del QR", async ({ page, browser }) => {
  await openWithCareer(page, "abogacia-j1-22", { "introduccion-al-derecho": "passed" });

  await page.getByRole("button", { name: "Mostrar QR" }).click();
  await expect(page.getByRole("img", { name: "Código QR con tu progreso" })).toBeVisible();
  const link = await page.getByRole("dialog").getByRole("textbox").inputValue();

  // Otro dispositivo, sin nada guardado.
  const other = await browser.newPage();
  await other.clock.setFixedTime(TODAY);
  await other.goto(link);

  const dialog = other.getByRole("dialog", { name: "¿Copiar este progreso acá?" });
  await expect(dialog).toContainText("Abogacía");
  await dialog.getByRole("button", { name: "Copiar progreso" }).click();

  await expect(other.getByRole("heading", { level: 1 })).toHaveText("Abogacía");
  await expect(statusOf(other, "Introducción al Derecho", 1)).toHaveValue("passed");
  await expect(other).toHaveURL(/\/$/);
  await other.close();
});

test("exportar el PDF de respaldo", async ({ page }) => {
  await openWithCareer(page, "analista-sistemas", { "programacion-estructurada": "passed" });

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar PDF" }).click();

  expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
});

test.describe("contracuatrimestre", () => {
  test("en Análisis de Sistemas se puede adelantar una materia del otro cuatrimestre", async ({ page }) => {
    await openWithCareer(page, "analista-sistemas", { "problematica-mundo-actual": "passed" });

    await expect(page.locator("#proximo-cuatrimestre")).toContainText("En contracuatrimestre también podés cursar");
    await expect(page.locator("#proximo-cuatrimestre")).toContainText("Historia de la Ciencia y de la Técnica");

    const plan = page.locator("#planificar");
    const toggle = plan.getByLabel("Cursar en contracuatrimestre (UAI Centro)");
    await expect(toggle).toBeChecked();

    await toggle.uncheck();
    await expect(page.locator("#proximo-cuatrimestre")).not.toContainText("En contracuatrimestre");
  });

  test("las demás carreras no tienen la opción", async ({ page }) => {
    await openWithCareer(page, "psicologia-p1-13");

    await expect(page.locator("#planificar").getByLabel("Cursar en contracuatrimestre (UAI Centro)")).toHaveCount(0);
  });
});
