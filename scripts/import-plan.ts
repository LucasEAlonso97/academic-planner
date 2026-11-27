/*
 * Convierte el texto de un plan de la UAI en el JSON de una carrera.
 *
 *   npm run import-plan -- plans/mi-carrera.txt
 *
 * Copiá la página del plan en la web de la UAI, pegala en un .txt dentro
 * de plans/ y corré el comando. Crea src/data/<id>.json; después sumalo a
 * la lista en src/data/career.ts.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

import { PlanParseError, parsePlanText } from "../src/utils/planParser.ts";

const [file, id] = process.argv.slice(2);

if (!file) {
  console.error("Uso: npm run import-plan -- plans/archivo.txt [id-de-la-carrera]");
  process.exit(1);
}

try {
  const data = parsePlanText(readFileSync(file, "utf8"), id ? { id } : {});
  const output = `src/data/${data.career.id}.json`;

  writeFileSync(output, JSON.stringify(data, null, 2) + "\n");

  const correlativas = data.subjects.filter((subject) => subject.prerequisites.length > 0).length;

  console.log(`✔ ${data.career.name} (plan ${data.career.plan})`);
  console.log(`  ${data.subjects.length} materias en ${data.career.years} años, ${correlativas} con correlativas`);
  (data.career.titles ?? []).forEach((title) => console.log(`  Título: ${title.name} (${title.years}° año)`));
  console.log(`\nGuardado en ${output} (desde ${basename(file)}).`);
  console.log(`Falta sumarlo a la lista de carreras en src/data/career.ts.`);
} catch (error) {
  if (error instanceof PlanParseError) {
    console.error(`✘ ${error.message}`);
    process.exit(1);
  }
  throw error;
}
