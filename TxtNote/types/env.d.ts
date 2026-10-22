/**
 * Environment variables, declared once. Adding a `VITE_*` var without adding
 * it here means it is `any` at every call site.
 */

interface ImportMetaEnv {
  /** Which `AppServices` implementation `services/index.ts` hands out. */
  readonly VITE_SERVICE_ADAPTER?: "mock" | "http";
  /** Origin the http adapter prefixes to every path. Defaults to `/api`. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Static assets imported by components (Vite resolves them to URLs). */
declare module "*.png" { const url: string; export default url; }
declare module "*.svg" { const url: string; export default url; }
declare module "*.jpg" { const url: string; export default url; }
declare module "*.webp" { const url: string; export default url; }
