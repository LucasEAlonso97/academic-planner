# Planificador Académico

Aplicación web para organizar el progreso académico, consultar correlativas, visualizar materias disponibles y simular diferentes recorridos dentro del plan de estudios.

**Demo:** https://uai-planner.netlify.app/

## Funcionalidades

- Registro del estado de cada materia: Cursando, Debe final o Aprobada.
- Validación automática de correlativas, con aviso cuando un cambio afecta a otras materias.
- Resumen del avance y aviso de qué materias podés cursar el próximo cuatrimestre (o qué correlativa te falta).
- Plan de estudios en lista, con búsqueda y filtros, o en vista de mapa de toda la carrera.
- Notas de las materias aprobadas y promedio.
- Planificación de los próximos cuatrimestres: armado automático según cuántas materias querés cursar por cuatrimestre, aviso si una correlativa no llega y fecha estimada para terminar de cursar (por título).
- Varias carreras: Abogacía (J1-22), Tecnicatura en Análisis de Sistemas Informáticos (VCO-19), Licenciatura en Periodismo (I3-06), Licenciatura en Periodismo, Gestión y Producción de Contenidos (I13-25) y Licenciatura en Psicología (P1-13). Contempla materias anuales y títulos intermedios.
- Pasar el progreso a otro dispositivo con un QR o un link, sin servidor.
- Elegir la carrera al entrar por primera vez; cada carrera se descarga recién cuando se elige.
- Materias aprobadas por equivalencia y herramienta para cambiar de plan o de carrera (pasa las aprobadas con el mismo nombre).
- Optativas con el nombre que eligió cada estudiante.
- Fuente de cada plan: fecha de carga y link a la página oficial.
- Contracuatrimestre en Análisis de Sistemas (UAI Centro): las materias de un cuatrimestre se pueden cursar en el otro si se cumplen las correlativas. Se puede desactivar en Planificar. Para habilitarlo en otra carrera, agregá `"counterSemester": true` en el `career` de su JSON.
- "Deshacer" después de cada cambio.
- Simulación de escenarios sin tocar el progreso real.
- Exportación e importación del progreso mediante PDF.
- Guardado automático en el navegador.
- Instalación como aplicación (PWA) y uso sin conexión.
- Diseño adaptable a celulares y computadoras.

## Tecnologías

React, TypeScript, Vite, Tailwind CSS, Zustand, jsPDF, pdf-lib, vite-plugin-pwa y Vitest.

## Desarrollo local

```bash
git clone https://github.com/LucasEAlonso97/academic-planner.git
cd academic-planner
npm install
npm run dev
```

Otros comandos:

```bash
npm test          # tests de la lógica (correlativas, planificador, lector de planes…)
npm run lint      # ESLint
npm run build     # chequeo de tipos y build de producción
npm run test:e2e  # pruebas de navegador sobre el build (Playwright)
```

Cada push y pull request corre lint, tests, build y las pruebas de navegador en GitHub Actions. Para las pruebas de navegador en tu compu, la primera vez corré `npx playwright install chromium`.

## Agregar una carrera

Las carreras salen del texto del plan tal como aparece en la web de la UAI.

1. Abrí la página del plan en la web de la UAI, seleccioná todo desde el nombre de la carrera ("ABOGACÍA - PLAN: J1-22") hasta la última materia, y copialo.
2. Pegalo en un archivo nuevo dentro de `plans/`, por ejemplo `plans/arquitectura-a1-20.txt`.
3. Corré:

   ```bash
   npm run import-plan -- plans/arquitectura-a1-20.txt
   ```

   Muestra un resumen (materias, años, correlativas y títulos), crea `src/data/<id>.json` y te da la línea para sumar a `careerIndex` en `src/data/career.ts`. Si algo del texto no se entiende, te dice qué materia revisar.
4. Pegá esa línea en `careerIndex` (`src/data/career.ts`).
5. `npm test` verifica que el JSON coincida con el texto de `plans/` y que el planificador pueda armar la carrera completa.

Al principio del `.txt` podés agregar `# fuente: <link a la página oficial>` y `# cargado: AAAA-MM-DD`; la app los muestra junto al plan.

El lector entiende materias de cuatrimestre y anuales, correlativas, títulos intermedios ("Título: …" al final de un año) y la lista de títulos del principio (con o sin viñetas; las resoluciones se ignoran). Si en el texto falta alguna tilde, como en "PERIODISTICA", se corrige con la lista `ACCENT_FIXES` de `src/utils/planParser.ts`.

## Medición de uso

La app puede contar visitas y el uso de algunas funciones con [Umami](https://umami.is), de forma anónima y sin cookies. Viene apagada:

1. Creá una cuenta en Umami Cloud (el plan Hobby es gratis) y agregá el sitio `uai-planner.netlify.app`.
2. Copiá el **Website ID** que te da Umami.
3. En Netlify: *Site configuration → Environment variables*, creá `VITE_UMAMI_WEBSITE_ID` con ese id y volvé a publicar.

Solo mide en el dominio publicado (se puede cambiar con `VITE_UMAMI_DOMAINS`), así que las vistas previas y el desarrollo local no cuentan, y respeta la opción "Do Not Track" del navegador. Además de las visitas, registra: la carrera en uso (una vez por visita), cambios de carrera, plan automático, QR, PDF, cambio de plan y simulación. No registra cada materia que se marca.

## Estructura

- `plans/` — texto original de cada plan, copiado de la web de la UAI.
- `src/data/` — planes de estudio en JSON (generados desde `plans/`) y el registro de carreras (`career.ts`).
- `scripts/import-plan.ts` y `src/utils/planParser.ts` — el lector que convierte el texto de un plan en JSON.
- `src/utils/` — reglas de correlativas, validación del progreso, calendario y textos derivados. Todo con tests en `__tests__/`.
- `src/hooks/usePlanner.ts` — lógica de la pantalla: cambios de estado, simulación y "Deshacer".
- `src/store/` — progreso guardado en `localStorage` (formato versionado, por carrera).
- `e2e/` — pruebas de navegador con Playwright.
- `src/components/` — interfaz.

## Aclaración

Este proyecto es una herramienta independiente y no oficial.

No está afiliado, respaldado ni administrado por la Universidad Abierta Interamericana. La información académica debe verificarse siempre mediante los canales oficiales de la universidad.

## Autor

Desarrollado por Lucas Ezequiel Alonso.
