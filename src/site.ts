/** 生产站点 origin（无末尾斜杠），用于 canonical、Open Graph、JSON-LD */
const SITE_ORIGIN = 'https://fwti.innei.dev'

export function getSiteOrigin(): string {
  return SITE_ORIGIN
}

/** 可选：完整 OG 图绝对 URL（未设置 `VITE_OG_IMAGE` 时不输出 og:image） */
export function getOgImageUrl(): string {
  return (import.meta.env.VITE_OG_IMAGE as string | undefined) ?? ''
}
