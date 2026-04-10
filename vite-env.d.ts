/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OG_IMAGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
