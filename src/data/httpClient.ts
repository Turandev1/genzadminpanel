import { HttpError } from 'react-admin'
import { runtimeConfig } from '../app/runtimeConfig'
import { sessionStore, singleFlightRefresh } from '../auth/session'

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  skipAuth?: boolean
  retryAfterRefresh?: boolean
}

type Envelope<T> = { data: T; request_id?: string }

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({})) as Envelope<T> & { code?: string; message?: string; details?: unknown }
  if (!response.ok) {
    throw new HttpError(payload.message || 'Sorğu tamamlanmadı', response.status, {
      code: payload.code,
      requestId: payload.request_id,
      details: payload.details,
    })
  }
  return payload.data
}

export async function apiRequest<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  headers.set('X-Request-ID', crypto.randomUUID())
  if (options.body !== undefined) headers.set('Content-Type', 'application/json')

  const token = sessionStore.getAccessToken()
  if (token && !options.skipAuth) headers.set('Authorization', `Bearer ${token}`)
  const csrf = sessionStore.getCsrfToken()
  if (csrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) headers.set('X-CSRF-Token', csrf)

  const response = await fetch(`${runtimeConfig.apiUrl}${path}`, {
    ...options,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
    credentials: 'include',
  })

  if (response.status === 401 && !options.skipAuth && options.retryAfterRefresh !== false) {
    await singleFlightRefresh(async () => {
      const refreshed = await apiRequest<{ access_token: string }>('/admin/auth/refresh', { method: 'POST', skipAuth: true })
      sessionStore.setAccessToken(refreshed.access_token)
      return refreshed.access_token
    })
    return apiRequest<T>(path, { ...options, retryAfterRefresh: false })
  }
  return parseResponse<T>(response)
}
