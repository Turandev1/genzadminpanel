import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

async function loadShell() {
  const path = window.location.pathname
  if (path === '/ambassador' || path.startsWith('/ambassador/')) {
    return (await import('./apps/ambassador/AmbassadorApp')).default
  }
  if (path === '/partner' || path.startsWith('/partner/')) {
    return (await import('./apps/partner/PartnerApp')).default
  }
  return (await import('./App')).default
}

const Shell = await loadShell()
createRoot(document.getElementById('root')!).render(<StrictMode><Shell /></StrictMode>)
