import type { UserIdentity } from 'react-admin'

export type AdminContext = {
  identity: UserIdentity & { email?: string }
  roles: string[]
  permissions: string[]
  scopes: { club_ids?: string[] }
  session: {
    expires_at: string
    idle_expires_at?: string
    mfa_level: string
    permissions_version: number
    must_change_password?: boolean
  }
}

let accessToken: string | null = null
let adminContext: AdminContext | null = null
let csrfToken: string | null = null

export const sessionStore = {
  getAccessToken: () => accessToken,
  setAccessToken: (value: string | null) => { accessToken = value },
  getContext: () => adminContext,
  setContext: (value: AdminContext | null) => { adminContext = value },
  getCsrfToken: () => csrfToken,
  setCsrfToken: (value: string | null) => { csrfToken = value },
  clear: () => {
    accessToken = null
    adminContext = null
    csrfToken = null
  },
}

let activeRefresh: Promise<string> | null = null

export function singleFlightRefresh(refresh: () => Promise<string>): Promise<string> {
  if (!activeRefresh) {
    activeRefresh = refresh().finally(() => { activeRefresh = null })
  }
  return activeRefresh
}
