const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1').replace(/\/$/, '')

export type PortalContext = {
  identity: { id: string; display_name: string; email: string; avatar_url?: string }
  principal_kind: 'ambassador' | 'partner' | 'multi'
  principal_kinds: Array<'ambassador' | 'partner'>
  available_organizations: PartnerOrganization[]
  roles: string[]
}

export type PartnerOrganization = {
  id: string; public_id: string; name: string; slug: string; status: string; role: 'owner' | 'staff'
}

export type AmbassadorContext = {
  id: string; public_id: string; user_id: string; status: string; referral_code: string; version: number
}

export type PartnerContext = {
  organization: PartnerOrganization
  membership_id: string
  permissions: string[]
  version: number
}

let accessToken: string | null = null
let csrfToken: string | null = null

async function request<T>(path: string, init: Omit<RequestInit, 'body'> & { body?: unknown } = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken)
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Sorğu tamamlanmadı')
  return payload.data as T
}

export const portalAuth = {
  async login(email: string, password: string) {
    const result = await request<{ access_token: string; csrf_token: string }>('/portal/auth/login', {
      method: 'POST', body: { email, password },
    })
    accessToken = result.access_token
    csrfToken = result.csrf_token
    return request<PortalContext>('/portal/auth/context')
  },
  async context() {
    if (!accessToken) return null
    return request<PortalContext>('/portal/auth/context')
  },
  async logout() {
    try { await request('/portal/auth/logout', { method: 'POST' }) } finally {
      accessToken = null
      csrfToken = null
    }
  },
  ambassadorContext: () => request<AmbassadorContext>('/portal/ambassador/context'),
  partnerContext: (organizationId: string) => request<PartnerContext>(`/portal/partner/organizations/${encodeURIComponent(organizationId)}/context`),
  partnerMembers: (organizationId: string) => request<Array<{ id: string; display_name: string; email: string; role: string; status: string }>>(`/portal/partner/organizations/${encodeURIComponent(organizationId)}/members`),
  partnerOffers: (organizationId: string) => request<Array<{ id: string; title: string; active: boolean }>>(`/portal/partner/organizations/${encodeURIComponent(organizationId)}/offers`),
}
