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
  },
} as const
