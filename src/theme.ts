/** localStorage key; values: 'light' | 'dark' | absent = follow system */
export const FWTI_THEME_KEY = 'fwti-theme'

export type FwtiThemeSetting = 'light' | 'dark' | null

export function getStoredTheme(): FwtiThemeSetting {
  if (typeof localStorage === 'undefined') return null
  try {
    const v = localStorage.getItem(FWTI_THEME_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  return null
}

export function setStoredTheme(t: FwtiThemeSetting) {
  if (typeof localStorage === 'undefined') return
  try {
    if (t == null) localStorage.removeItem(FWTI_THEME_KEY)
    else localStorage.setItem(FWTI_THEME_KEY, t)
  } catch {
    /* ignore */
  }
}

export function applyThemeToDocument(t: FwtiThemeSetting) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (t === 'light') root.dataset.theme = 'light'
  else if (t === 'dark') root.dataset.theme = 'dark'
  else delete root.dataset.theme
}

/** Cycle: system → light → dark → system */
export function cycleThemeSetting(): FwtiThemeSetting {
  const cur = getStoredTheme()
  let next: FwtiThemeSetting
  if (cur == null) next = 'light'
  else if (cur === 'light') next = 'dark'
  else next = null
  setStoredTheme(next)
  applyThemeToDocument(next)
  return next
}

export function initThemeFromStorage() {
  applyThemeToDocument(getStoredTheme())
}
