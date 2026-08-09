
export const APP_ROLES = {
  CUSTOMER: 'CUSTOMER',
  WORKER: 'WORKER',
  ADMIN: 'ADMIN',
} as const

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES]
export type RegisterRole = Extract<AppRole, 'CUSTOMER' | 'WORKER'>
