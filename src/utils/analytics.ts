/*
 * Medición de uso con Umami (https://umami.is): cuenta visitas y algunos
 * eventos de forma anónima, sin cookies ni datos personales.
 *
 * Se activa con la variable de entorno VITE_UMAMI_WEBSITE_ID (en Netlify:
 * Site configuration → Environment variables). Sin ella no se envía nada.
 * Solo mide en los dominios de VITE_UMAMI_DOMAINS (por defecto, el sitio
 * publicado), así que las vistas previas y el desarrollo local no cuentan.
 * Respeta la opción "Do Not Track" del navegador.
 */

type EventData = Record<string, string | number | boolean>;

type Umami = { track: (event: string, data?: EventData) => void };

declare global {
  interface Window {
    umami?: Umami;
  }
}

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
const DOMAINS = (import.meta.env.VITE_UMAMI_DOMAINS as string | undefined) ?? "uai-planner.netlify.app";
const SCRIPT_URL = "https://cloud.umami.is/script.js";

export const isAnalyticsEnabled = Boolean(WEBSITE_ID);

// Eventos que llegan antes de que cargue el script.
const queue: [string, EventData | undefined][] = [];

export function initAnalytics() {
  if (!WEBSITE_ID || typeof document === "undefined") {
    return;
  }

  const script = document.createElement("script");
  script.defer = true;
  script.src = SCRIPT_URL;
  script.dataset.websiteId = WEBSITE_ID;
  script.dataset.domains = DOMAINS;
  script.dataset.doNotTrack = "true";
  script.onload = () => {
    queue.splice(0).forEach(([event, data]) => window.umami?.track(event, data));
  };

  document.head.appendChild(script);
}

/** Registra un evento (no hace nada si la medición está apagada). */
export function track(event: string, data?: EventData) {
  if (!WEBSITE_ID) {
    return;
  }

  if (window.umami) {
    window.umami.track(event, data);
  } else {
    queue.push([event, data]);
  }
}

/** Registra un evento una sola vez por sesión del navegador. */
export function trackOncePerSession(event: string, data?: EventData) {
  const key = `uai-planner:tracked:${event}`;

  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Sin sessionStorage, se registra igual.
  }

  track(event, data);
}
