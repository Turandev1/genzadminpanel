import { describe, expect, it } from 'vitest'
import { resolveRuntimeConfig } from './runtimeConfig'

const productionEnvironment = {
  DEV: false,
  PROD: true,
  VITE_APP_ENV: 'production',
  VITE_ADMIN_API_URL: 'https://api.genzclub.az/api/v1',
  VITE_ADMIN_DEMO_MODE: 'false',
}

describe('runtime config production guardrails', () => {
  it('accepts an explicit HTTPS API and disables demo mode', () => {
    expect(resolveRuntimeConfig(productionEnvironment)).toEqual({
      apiUrl: 'https://api.genzclub.az/api/v1',
      demoMode: false,
      environment: 'production',
    })
  })

  it('requires an explicit production API URL', () => {
    expect(() => resolveRuntimeConfig({ ...productionEnvironment, VITE_ADMIN_API_URL: undefined })).toThrow('VITE_ADMIN_API_URL')
  })

  it('rejects an insecure production API URL', () => {
    expect(() => resolveRuntimeConfig({ ...productionEnvironment, VITE_ADMIN_API_URL: 'http://api.genzclub.az/api/v1' })).toThrow('HTTPS')
  })

  it('rejects demo mode in production', () => {
    expect(() => resolveRuntimeConfig({ ...productionEnvironment, VITE_ADMIN_DEMO_MODE: 'true' })).toThrow('VITE_ADMIN_DEMO_MODE')
  })

  it('rejects a production build mislabeled as development', () => {
    expect(() => resolveRuntimeConfig({ ...productionEnvironment, VITE_APP_ENV: 'development' })).toThrow('VITE_APP_ENV=production')
  })
})
