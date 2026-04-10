/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string
  readonly VITE_OG_IMAGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
