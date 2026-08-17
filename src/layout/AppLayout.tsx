import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import { Box, ListItemIcon, ListItemText, MenuItem, type MenuItemProps, Typography } from '@mui/material'
import { forwardRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AppBar, Layout, Logout, TitlePortal, ToggleThemeButton, UserMenu, useUserMenu, type LayoutProps } from 'react-admin'
import { AppMenu } from './AppMenu'
import { sessionStore } from '../auth/session'

const AccountMenuItem = forwardRef<HTMLLIElement, MenuItemProps>((props, ref) => {
  const navigate = useNavigate()
  const menu = useUserMenu()
  return <MenuItem {...props} ref={ref} onClick={() => { menu?.onClose(); navigate('/account') }}><ListItemIcon><ManageAccountsOutlinedIcon fontSize="small" /></ListItemIcon><ListItemText>Hesab əməliyyatları</ListItemText></MenuItem>
})
AccountMenuItem.displayName = 'AccountMenuItem'

function AccountUserMenu() {
  return <UserMenu><AccountMenuItem /><Logout /></UserMenu>
}

function PasswordChangeEnforcer() {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    if (sessionStore.getContext()?.session.must_change_password && location.pathname !== '/account') navigate('/account', { replace: true })
  }, [location.pathname, navigate])
  return null
}

function AppTopBar() {
  return (
    <AppBar className="topbar" userMenu={<AccountUserMenu />} toolbar={<ToggleThemeButton />}>
      <Box className="topbar-brand">
        <Box className="brand-mark"><span>G</span></Box>
        <Box><Typography className="brand-name">GEN Z CLUB</Typography><Typography className="brand-subtitle">CONTROL ROOM</Typography></Box>
      </Box>
      <TitlePortal />
      <Box className="secure-indicator"><ShieldOutlinedIcon /><span>Qorunan sessiya</span></Box>
    </AppBar>
  )
}

export function AppLayout(props: LayoutProps) {
  return <><PasswordChangeEnforcer /><Layout {...props} appBar={AppTopBar} menu={AppMenu} /></>
}
