/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
interface ImportMetaEnv {
  /** Id del sitio en Umami; si falta, no se mide el uso. */
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  /** Dominios donde se mide, separados por coma. */
  readonly VITE_UMAMI_DOMAINS?: string;
}
