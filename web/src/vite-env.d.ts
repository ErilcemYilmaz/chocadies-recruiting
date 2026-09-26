/// <reference types="vite/client" />

// Prototyp-Anmeldung aus web/.env.local (siehe README).
interface ImportMetaEnv {
  readonly VITE_DEMO_EMAIL?: string;
  readonly VITE_DEMO_PASSWORT?: string;
  readonly VITE_DEMO_NAME?: string;
  readonly VITE_DEMO_ROLLE?: string;
  readonly VITE_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
