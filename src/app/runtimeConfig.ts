export type RuntimeConfig = {
  apiUrl: string
  demoMode: boolean
  environment: 'development' | 'staging' | 'production'
}

type RuntimeEnvironment = {
  DEV: boolean
  PROD: boolean
  VITE_ADMIN_API_URL?: string
  VITE_ADMIN_DEMO_MODE?: string
  VITE_APP_ENV?: string
}

export function resolveRuntimeConfig(raw: RuntimeEnvironment): RuntimeConfig {
  const environment = raw.VITE_APP_ENV?.trim() || (raw.PROD ? 'production' : 'development')
  if (!['development', 'staging', 'production'].includes(environment)) {
    throw new Error('VITE_APP_ENV development, staging və ya production olmalıdır')
  }
  if (raw.PROD && environment !== 'production') {
    throw new Error('Production build üçün VITE_APP_ENV=production olmalıdır')
  }

  const configuredApiUrl = raw.VITE_ADMIN_API_URL?.trim()
  if (environment === 'production' && !configuredApiUrl) {
    throw new Error('VITE_ADMIN_API_URL production build üçün məcburidir')
  }
  console.log('configuredApiUrl',configuredApiUrl)

  const apiUrl = configuredApiUrl || 'http://localhost:8080/api/v1'
  console.log('apiUrl:',apiUrl)
  const parsedApiUrl = new URL(apiUrl)
  if (!['http:', 'https:'].includes(parsedApiUrl.protocol)) {
    throw new Error('VITE_ADMIN_API_URL yalnız http/https URL ola bilər')
  }
  if (environment === 'production' && parsedApiUrl.protocol !== 'https:') {
    throw new Error('VITE_ADMIN_API_URL production-da HTTPS istifadə etməlidir')
  }
  if (environment === 'production' && raw.VITE_ADMIN_DEMO_MODE === 'true') {
    throw new Error('VITE_ADMIN_DEMO_MODE production-da aktiv ola bilməz')
  }

  return Object.freeze({
    apiUrl: apiUrl.replace(/\/$/, ''),
    demoMode: raw.DEV && environment === 'development' && raw.VITE_ADMIN_DEMO_MODE !== 'false',
    environment: environment as RuntimeConfig['environment'],
  })
}

export const runtimeConfig = resolveRuntimeConfig(import.meta.env)
