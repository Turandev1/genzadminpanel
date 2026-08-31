import { demoProfiles } from '../data/demoData'
import { sessionStore } from './session'

export function setDemoSession(email: string) {
  const key = email.split('@')[0]
  const profile = demoProfiles[key] || demoProfiles.admin
  sessionStore.setAccessToken('development-demo-token')
  sessionStore.setContext(profile)
}
