import type { AuthProvider, UserIdentity } from 'react-admin'
import { runtimeConfig } from '../app/runtimeConfig'
import { demoProfiles } from '../data/demoData'
import { apiRequest } from '../data/httpClient'
import { sessionStore, singleFlightRefresh, type AdminContext } from './session'

type LoginParams = { username?: string; email?: string; password?: string; mfaCode?: string }
type LoginResult = { access_token?: string; csrf_token?: string; challenge_id?: string; mfa_required?: boolean }

let pendingChallenge: string | null = null

function setDemoSession(email: string) {
  const key = email.split('@')[0]
  const profile = demoProfiles[key] || demoProfiles.admin
  sessionStore.setAccessToken('development-demo-token')
  sessionStore.setContext(profile)
}

async function refreshSession(): Promise<string> {
  if (runtimeConfig.demoMode) {
    const token = sessionStore.getAccessToken() || 'development-demo-token'
    sessionStore.setAccessToken(token)
    if (!sessionStore.getContext()) setDemoSession('admin@genz.club')
    return token
  }
  const response = await apiRequest<{ access_token: string; csrf_token?: string }>('/admin/auth/refresh', { method: 'POST', skipAuth: true })
  sessionStore.setAccessToken(response.access_token)
  if (response.csrf_token) sessionStore.setCsrfToken(response.csrf_token)
  return response.access_token
}

async function loadContext(): Promise<AdminContext> {
  const cached = sessionStore.getContext()
  if (cached) return cached
  if (runtimeConfig.demoMode) {
    setDemoSession('admin@genz.club')
    return sessionStore.getContext() as AdminContext
  }
  const context = await apiRequest<AdminContext>('/admin/auth/context')
  sessionStore.setContext(context)
  return context
}

export const authProvider: AuthProvider = {
  async login(params: LoginParams) {
    const email = params.email || params.username || ''
    if (runtimeConfig.demoMode) {
      setDemoSession(email || 'admin@genz.club')
      return
    }

    if (pendingChallenge && params.mfaCode) {
      const result = await apiRequest<LoginResult>('/admin/auth/mfa/verify', {
        method: 'POST', skipAuth: true, body: { challenge_id: pendingChallenge, code: params.mfaCode },
      })
      if (!result.access_token) throw new Error('MFA yoxlaması tamamlanmadı')
      sessionStore.setAccessToken(result.access_token)
      if (result.csrf_token) sessionStore.setCsrfToken(result.csrf_token)
      pendingChallenge = null
      await loadContext()
      return
    }

    const result = await apiRequest<LoginResult>('/admin/auth/login', {
      method: 'POST', skipAuth: true, body: { email, password: params.password },
    })
    if (result.mfa_required && result.challenge_id) {
      pendingChallenge = result.challenge_id
      throw new Error('MFA_CHALLENGE')
    }
    if (!result.access_token) throw new Error('Giriş cavabı etibarsızdır')
    sessionStore.setAccessToken(result.access_token)
    await loadContext()
  },
  async logout() {
    if (!runtimeConfig.demoMode) {
      try { await apiRequest('/admin/auth/logout', { method: 'POST' }) } catch { /* cleanup continues */ }
    }
    sessionStore.clear()
    pendingChallenge = null
  },
  async checkAuth() {
    if (!sessionStore.getAccessToken()) await singleFlightRefresh(refreshSession)
    await loadContext()
  },
  async checkError(error: { status?: number }) {
    if (error.status === 401) {
      try { await singleFlightRefresh(refreshSession); return } catch { sessionStore.clear(); throw error }
    }
    if (error.status === 403) return
  },
  async getIdentity(): Promise<UserIdentity> {
    return (await loadContext()).identity
  },
  async getPermissions(): Promise<string[]> {
    return (await loadContext()).permissions
  },
}
