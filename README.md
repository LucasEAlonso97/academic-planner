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
- Varias carreras: Tecnicatura en Análisis de Sistemas Informáticos (VCO-19) y Licenciatura en Periodismo, Gestión y Producción de Contenidos (I13-25).
- Pasar el progreso a otro dispositivo con un QR o un link, sin servidor.
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
npm test        # tests de la lógica (correlativas, validación, calendario)
npm run lint    # ESLint
npm run build   # chequeo de tipos y build de producción
```

Cada push y pull request corre lint, tests y build en GitHub Actions.

## Estructura

- `src/data/` — planes de estudio en JSON y el registro de carreras (`career.ts`). Para sumar una carrera: agregá su JSON con el mismo formato y sumalo a la lista en `career.ts`.
- `src/utils/` — reglas de correlativas, validación del progreso, calendario y textos derivados. Todo con tests en `__tests__/`.
- `src/hooks/usePlanner.ts` — lógica de la pantalla: cambios de estado, simulación y "Deshacer".
- `src/store/` — progreso guardado en `localStorage` (formato versionado).
- `src/components/` — interfaz.

## Aclaración

Este proyecto es una herramienta independiente y no oficial.

No está afiliado, respaldado ni administrado por la Universidad Abierta Interamericana. La información académica debe verificarse siempre mediante los canales oficiales de la universidad.

## Autor

Desarrollado por Lucas Ezequiel Alonso.
