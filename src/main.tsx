import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'

async function loadShell() {
  const path = window.location.pathname
  if (path === '/admin' || path.startsWith('/admin/') || path === '/internal' || path.startsWith('/internal/')) {
    return (await import('./App')).default
  }
  return (await import('./apps/PortalShell')).default
}

const Shell = await loadShell()
createRoot(document.getElementById('root')!).render(<StrictMode><Shell /></StrictMode>)
