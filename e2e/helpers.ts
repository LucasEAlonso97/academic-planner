import type { Page } from "@playwright/test";

/** Fecha fija para que el calendario y el planificador sean predecibles. */
export const TODAY = new Date("2026-11-27T12:00:00-03:00");

/** Entra a la app con una carrera ya elegida (sin la pantalla de bienvenida). */
export async function openWithCareer(
  page: Page,
  careerId: string,
  progress: Record<string, string> = {},
  extra: Record<string, unknown> = {}
) {
  await page.clock.setFixedTime(TODAY);
  await page.addInitScript(
    ([id, data]) => {
      if (sessionStorage.getItem("e2e-seeded")) return;
      sessionStorage.setItem("e2e-seeded", "1");
      localStorage.setItem(
        "uai-planner:v3",
        JSON.stringify({ version: 3, activeCareerId: id, careers: { [id]: data } })
      );
    },
    [careerId, { progress, ...extra }] as const
  );
  await page.goto("/");
  await page.getByRole("heading", { level: 1 }).waitFor();
}

export const statusOf = (page: Page, subject: string, code: number) =>
  page.getByRole("combobox", { name: `Estado de ${subject} (código ${code})`, exact: true });
