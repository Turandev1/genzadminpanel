type RuntimeConfig = {
  apiUrl: string
  demoMode: boolean
  environment: 'development' | 'staging' | 'production'
}

const rawApiUrl = import.meta.env.VITE_ADMIN_API_URL?.trim() || 'http://localhost:8080/api/v1'
const parsedApiUrl = new URL(rawApiUrl)

if (!['http:', 'https:'].includes(parsedApiUrl.protocol)) {
  throw new Error('VITE_ADMIN_API_URL yalnız http/https URL ola bilər')
}

const environment = (import.meta.env.VITE_APP_ENV || (import.meta.env.PROD ? 'production' : 'development')) as RuntimeConfig['environment']

export const runtimeConfig: RuntimeConfig = Object.freeze({
  apiUrl: rawApiUrl.replace(/\/$/, ''),
  demoMode: import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEMO_MODE !== 'false',
  environment,
})
