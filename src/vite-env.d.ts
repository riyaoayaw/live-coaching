/// <reference types="vite/client" />

// This augments the ImportMeta interface
declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_AUTH_TOKEN: string;
  readonly VITE_LIVE_BASE: string;
  readonly VITE_RAG_API: string;
  // more env variables...
  readonly [key: string]: string;
}
