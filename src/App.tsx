import { Admin, CustomRoutes, Resource } from 'react-admin'
import { Route } from 'react-router-dom'
import { authProvider } from './auth/authProvider'
import { dataProvider } from './data/dataProvider'
import { resourceContracts } from './data/resourceRegistry'
import { appTheme, darkTheme } from './design-system/theme'
import { AppLayout } from './layout/AppLayout'
import { LoginPage } from './login/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { AccountSettings } from './pages/AccountSettings'
import { AccessDenied, NotFoundPage } from './pages/SystemPages'
import { createResourcePages } from './resources/ResourcePages'
import './App.css'

const pages = Object.fromEntries(
  resourceContracts.map((contract) => [contract.name, createResourcePages(contract)]),
)

export default function App() {
  return (
    <Admin
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
      {resourceContracts.map((contract) => {
        const resourcePages = pages[contract.name]
        return (
          <Resource
            key={contract.name}
            name={contract.name}
            list={resourcePages.list}
            show={resourcePages.show}
            create={contract.createPermission ? resourcePages.create : undefined}
            edit={contract.writePermission ? resourcePages.edit : undefined}
            recordRepresentation={contract.recordLabel}
          />
        )
      })}
      <CustomRoutes>
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/account" element={<AccountSettings />} />
      </CustomRoutes>
    </Admin>
  )
}
