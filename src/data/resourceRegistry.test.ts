import { describe, expect, it } from 'vitest'
import { canAccess, implementedResourceContracts, resourceContractMap, resourceContracts } from './resourceRegistry'

describe('capability registry', () => {
  it('uses unique resource names and paths', () => {
    expect(new Set(resourceContracts.map((item) => item.name)).size).toBe(resourceContracts.length)
    expect(new Set(resourceContracts.map((item) => item.path)).size).toBe(resourceContracts.length)
  })

  it('is deny-by-default and supports the superadmin wildcard', () => {
    expect(canAccess(undefined, 'content.clubs.read')).toBe(false)
    expect(canAccess([], 'content.clubs.read')).toBe(false)
    expect(canAccess(['content.clubs.read'], 'content.clubs.read')).toBe(true)
    expect(canAccess(['*'], 'system.settings.update')).toBe(true)
  })

  it('keeps critical resources behind distinct permission families', () => {
    expect(resourceContractMap.get('payouts')?.readPermission).toBe('finance.payouts.read')
    expect(resourceContractMap.get('settings')?.readPermission).toBe('system.settings.read')
    expect(resourceContractMap.get('audit-events')?.readPermission).toBe('security.audit.read')
  })

  it('only exposes backend-supported resources in production', () => {
    expect(implementedResourceContracts.map(({ name }) => name)).toEqual(['clubs', 'events', 'partner-organizations', 'audit-events'])
  })
})
