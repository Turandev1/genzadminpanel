import { Admin, CustomRoutes, Resource } from 'react-admin'
import { Route } from 'react-router-dom'
import { authProvider } from './auth/authProvider'
import { dataProvider } from './data/dataProvider'
import { implementedResourceContracts, resourceContracts } from './data/resourceRegistry'
import { runtimeConfig } from './app/runtimeConfig'
import { appTheme, darkTheme } from './design-system/theme'
import { AppLayout } from './layout/AppLayout'
import { LoginPage } from './login/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { AccountSettings } from './pages/AccountSettings'
import { MFAEnrollment } from './pages/MFAEnrollment'
import { AccessDenied, NotFoundPage } from './pages/SystemPages'
import { createResourcePages } from './resources/ResourcePages'
import './App.css'

const visibleResourceContracts = runtimeConfig.demoMode ? resourceContracts : implementedResourceContracts

const pages = Object.fromEntries(
  visibleResourceContracts.map((contract) => [contract.name, createResourcePages(contract)]),
)

export default function App() {
	const basename = window.location.pathname.startsWith('/internal') ? '/internal' : '/admin'
  return (
    <Admin
	  basename={basename}
      title="GEN Z Club — İdarəetmə"
      dataProvider={dataProvider}
      authProvider={authProvider}
      dashboard={Dashboard}
      layout={AppLayout}
      loginPage={LoginPage}
      theme={appTheme}
      darkTheme={darkTheme}
      defaultTheme="light"
      requireAuth
      disableTelemetry
      catchAll={NotFoundPage}
    >
      {visibleResourceContracts.map((contract) => {
        const resourcePages = pages[contract.name]
        return (
          <Resource
            key={contract.name}
            name={contract.name}
            list={resourcePages.list}
            show={contract.supportsShow === false ? undefined : resourcePages.show}
            create={contract.createPermission ? resourcePages.create : undefined}
            edit={contract.writePermission ? resourcePages.edit : undefined}
            recordRepresentation={contract.recordLabel}
          />
        )
      })}
      <CustomRoutes>
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/account" element={<AccountSettings />} />
		<Route path="/mfa-enroll" element={<MFAEnrollment />} />
      </CustomRoutes>
    </Admin>
  )
}
