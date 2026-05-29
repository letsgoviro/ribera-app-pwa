export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'ribera-theme'

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function setTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.classList.remove('dark', 'light')
  html.classList.add(theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

export function initTheme() {
  const theme = getTheme()
  if (typeof document !== 'undefined') {
    const html = document.documentElement
    html.classList.remove('dark', 'light')
    html.classList.add(theme)
  }
  return theme
}
