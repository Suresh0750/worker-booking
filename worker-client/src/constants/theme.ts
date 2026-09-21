// ─────────────────────────────────────────────
// App theme palette
// Values are hardcoded client-side for now.
// In the future these will be fetched from the
// backend (e.g. GET /theme) and injected at runtime,
// so keep every color referenced through this object.
// ─────────────────────────────────────────────

export const THEME = {
  colors: {
    primary: '#16a34a',
    primaryHover: '#15803d',
    primarySoft: '#f0fdf4',
    primaryBorder: '#bbf7d0',
    primaryLight: '#4ade80',
    onPrimary: '#ffffff',
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    danger: '#ef4444',
    scrollbar: '#cbd5e1',
    scrollbarHover: '#94a3b8',
  },
} as const

// Brand shades without a semantic THEME key yet.
// Kept as constants so the full brand scale stays defined;
// replace these with semantic keys as the theme grows.
const BRAND_FALLBACK = {
  100: '#dcfce7',
  300: '#86efac',
  500: '#22c55e',
  800: '#166534',
  900: '#14532d',
} as const

export const THEME_CSS_VARS: Record<string, string> = {
  '--brand-50': THEME.colors.primarySoft,
  '--brand-100': BRAND_FALLBACK[100],
  '--brand-200': THEME.colors.primaryBorder,
  '--brand-300': BRAND_FALLBACK[300],
  '--brand-400': THEME.colors.primaryLight,
  '--brand-500': BRAND_FALLBACK[500],
  '--brand-600': THEME.colors.primary,
  '--brand-700': THEME.colors.primaryHover,
  '--brand-800': BRAND_FALLBACK[800],
  '--brand-900': BRAND_FALLBACK[900],
  '--surface': THEME.colors.background,
  '--surface-secondary': THEME.colors.surface,
  '--surface-tertiary': THEME.colors.surfaceAlt,
  '--color-text': THEME.colors.text,
  '--color-text-muted': THEME.colors.textMuted,
  '--color-border': THEME.colors.border,
  '--color-danger': THEME.colors.danger,
  '--color-scrollbar': THEME.colors.scrollbar,
  '--color-scrollbar-hover': THEME.colors.scrollbarHover,
}
