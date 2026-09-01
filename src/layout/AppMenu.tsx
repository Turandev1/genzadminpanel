import AutoAwesomeMosaicOutlinedIcon from '@mui/icons-material/AutoAwesomeMosaicOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined'
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import { Box, Typography } from '@mui/material'
import type { ReactElement } from 'react'
import { Menu, MenuItemLink, usePermissions } from 'react-admin'
import { runtimeConfig } from '../app/runtimeConfig'
import { canAccess, implementedResourceContracts, resourceContracts } from '../data/resourceRegistry'

const icons: Record<string, ReactElement> = {
  clubs: <BusinessOutlinedIcon />, events: <CalendarMonthOutlinedIcon />, attendees: <GroupOutlinedIcon />, 'join-requests': <FactCheckOutlinedIcon />,
  campaigns: <CampaignOutlinedIcon />, referrals: <PersonSearchOutlinedIcon />, rewards: <RedeemOutlinedIcon />, tasks: <TaskAltOutlinedIcon />,
  users: <GroupOutlinedIcon />, reports: <FlagOutlinedIcon />, 'ambassador-applications': <AutoAwesomeMosaicOutlinedIcon />, jobs: <WorkspacesOutlinedIcon />,
  'audit-events': <HistoryOutlinedIcon />, roles: <SecurityOutlinedIcon />, sessions: <SecurityOutlinedIcon />, payouts: <PaymentsOutlinedIcon />,
  settings: <SettingsOutlinedIcon />, backups: <CloudOutlinedIcon />,
	'partner-organizations': <BusinessOutlinedIcon />,
	'fraud-reviews': <SecurityOutlinedIcon />,
}

const groups = [
  { key: 'content', label: 'Kontent və tədbirlər' }, { key: 'growth', label: 'Growth' }, { key: 'operations', label: 'Əməliyyatlar' },
  { key: 'security', label: 'Təhlükəsizlik' }, { key: 'system', label: 'Sistem və maliyyə' },
] as const

export function AppMenu() {
  const { permissions } = usePermissions<string[]>()
  const visibleResourceContracts = runtimeConfig.demoMode ? resourceContracts : implementedResourceContracts
  return (
    <Menu className="app-menu" component="nav" aria-label="Əsas menyu">
      <MenuItemLink to="/" leftIcon={<AutoAwesomeMosaicOutlinedIcon />} primaryText="İcmal" />
      {groups.map((group) => {
        const items = visibleResourceContracts.filter((item) => item.group === group.key && canAccess(permissions, item.readPermission))
        if (!items.length) return null
        return (
          <Box key={group.key} className="menu-group">
            <Typography className="menu-group-label">{group.label}</Typography>
            {items.map((item) => (
              <MenuItemLink key={item.name} to={`/${item.name}`} primaryText={item.label} leftIcon={icons[item.name]} />
            ))}
          </Box>
        )
      })}
      <Box className="menu-account-link">
        <MenuItemLink to="/account" primaryText="Hesab əməliyyatları" leftIcon={<ManageAccountsOutlinedIcon />} />
      </Box>
    </Menu>
  )
}
