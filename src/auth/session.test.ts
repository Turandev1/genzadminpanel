import { describe, expect, it, vi } from 'vitest'
import { sessionStore, singleFlightRefresh } from './session'

describe('memory-only admin session', () => {
  it('coalesces concurrent refresh attempts into one request', async () => {
    let resolveRefresh: ((token: string) => void) | undefined
    const refresh = vi.fn(() => new Promise<string>((resolve) => { resolveRefresh = resolve }))
    const first = singleFlightRefresh(refresh)
    const second = singleFlightRefresh(refresh)
    expect(refresh).toHaveBeenCalledTimes(1)
    resolveRefresh?.('access-token')
    await expect(Promise.all([first, second])).resolves.toEqual(['access-token', 'access-token'])
  })

  it('clears token, CSRF and context together', () => {
    sessionStore.setAccessToken('token')
    sessionStore.setCsrfToken('csrf')
    sessionStore.setContext({ identity: { id: '1', fullName: 'Test' }, roles: ['admin'], permissions: [], scopes: {}, session: { expires_at: new Date().toISOString(), mfa_level: 'totp', permissions_version: 1 } })
    sessionStore.clear()
    expect(sessionStore.getAccessToken()).toBeNull()
    expect(sessionStore.getCsrfToken()).toBeNull()
    expect(sessionStore.getContext()).toBeNull()
  })
})
