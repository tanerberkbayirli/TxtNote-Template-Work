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
