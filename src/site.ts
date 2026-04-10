/**
 * 生产环境站点 origin（无末尾斜杠），用于 canonical 与分享元数据。
 * 在 `.env` 或部署环境中设置 `VITE_SITE_URL`，例如 `https://innei.github.io/fwti`
 */
export function getSiteOrigin(): string {
  const raw = import.meta.env.VITE_SITE_URL as string | undefined
  if (!raw) return ''
  return raw.replace(/\/$/, '')
}

/** 可选：完整 OG 图绝对 URL（1200×630 左右 raster 最佳） */
export function getOgImageUrl(): string {
  return (import.meta.env.VITE_OG_IMAGE as string | undefined) ?? ''
}
