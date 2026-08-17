import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined'
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import { Alert, Box, Button, Card, Chip, CircularProgress, Divider, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNotify } from 'react-admin'
import { sessionStore } from '../auth/session'
import { runtimeConfig } from '../app/runtimeConfig'
import { apiRequest } from '../data/httpClient'

type Account = {
  id: string
  display_name: string
  email: string
  username: string
  avatar_url?: string
  roles: string[]
  must_change_password: boolean
}

const roleLabels: Record<string, string> = {
  superadmin: 'Superadmin', admin: 'Admin', moderator: 'Moderator', ambassador: 'Ambassador',
}

function demoAccount(): Account {
  const context = sessionStore.getContext()
  return {
    id: String(context?.identity.id || 'demo'),
    display_name: context?.identity.fullName || 'Admin istifadəçisi',
    email: context?.identity.email || 'admin@genz.club',
    username: String(context?.identity.email || 'admin').split('@')[0],
    roles: context?.roles || [],
    must_change_password: Boolean(context?.session.must_change_password),
  }
}

export function AccountSettings() {
  const notify = useNotify()
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [profilePending, setProfilePending] = useState(false)
  const [passwordPending, setPasswordPending] = useState(false)
  const [profile, setProfile] = useState({ display_name: '', email: '', username: '' })
  const [password, setPassword] = useState({ current_password: '', new_password: '', confirmation: '' })

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const value = runtimeConfig.demoMode ? demoAccount() : await apiRequest<Account>('/admin/me')
        if (active) {
          setAccount(value)
          setProfile({ display_name: value.display_name, email: value.email, username: value.username })
        }
      } catch {
        notify('Hesab məlumatlarını yükləmək mümkün olmadı', { type: 'error' })
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [notify])

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault()
    setProfilePending(true)
    try {
      const updated = runtimeConfig.demoMode ? { ...account!, ...profile } : await apiRequest<Account>('/admin/me', { method: 'PATCH', body: profile })
      setAccount(updated)
      const context = sessionStore.getContext()
      if (context) sessionStore.setContext({ ...context, identity: { ...context.identity, fullName: updated.display_name, email: updated.email } })
      notify('Hesab məlumatları yeniləndi', { type: 'success' })
    } catch {
      notify('Hesab məlumatlarını yeniləmək mümkün olmadı', { type: 'error' })
    } finally {
      setProfilePending(false)
    }
  }

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault()
    if (password.new_password !== password.confirmation) {
      notify('Yeni şifrələr eyni deyil', { type: 'warning' })
      return
    }
    setPasswordPending(true)
    try {
      if (!runtimeConfig.demoMode) {
        await apiRequest('/admin/me/password', { method: 'POST', body: { current_password: password.current_password, new_password: password.new_password } })
      }
      setPassword({ current_password: '', new_password: '', confirmation: '' })
      setAccount((value) => value ? { ...value, must_change_password: false } : value)
      const context = sessionStore.getContext()
      if (context) sessionStore.setContext({ ...context, session: { ...context.session, must_change_password: false } })
      notify('Şifrə dəyişdirildi və digər sessiyalar bağlandı', { type: 'success' })
    } catch {
      notify('Şifrəni dəyişmək mümkün olmadı', { type: 'error' })
    } finally {
      setPasswordPending(false)
    }
  }

  if (loading) return <Box className="account-loading"><CircularProgress size={28} /><Typography>Hesab məlumatları hazırlanır…</Typography></Box>
  if (!account) return <Alert severity="error">Hesab məlumatları əlçatan deyil.</Alert>

  return (
    <Box className="account-page">
      <Box className="account-hero">
        <Box>
          <Typography className="resource-kicker">ŞƏXSİ TƏHLÜKƏSİZLİK MƏRKƏZİ</Typography>
          <Typography component="h1">Hesab əməliyyatları</Typography>
          <Typography>Profil məlumatlarınızı və giriş təhlükəsizliyinizi bir mərkəzdən idarə edin.</Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {account.roles.map((role) => <Chip key={role} label={roleLabels[role] || role} className="account-role-chip" />)}
        </Stack>
      </Box>

      {account.must_change_password && <Alert severity="warning" className="password-required-alert">Bu hesab birdəfəlik ilkin şifrə ilə yaradılıb. Digər modullara keçməzdən əvvəl şifrənizi dəyişin.</Alert>}

      <Box className="account-grid">
        <Card className="account-card" component="form" onSubmit={submitProfile}>
          <Box className="account-card-heading"><Box className="account-card-icon"><BadgeOutlinedIcon /></Box><Box><Typography component="h2">Hesaba düzəliş et</Typography><Typography>Paneldə görünən şəxsi məlumatlar</Typography></Box></Box>
          <Divider />
          <Stack spacing={2.2} className="account-form-fields">
            <TextField label="Görünən ad" value={profile.display_name} onChange={(event) => setProfile({ ...profile, display_name: event.target.value })} required slotProps={{ htmlInput: { maxLength: 100 } }} />
            <TextField label="İstifadəçi adı" value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value })} required slotProps={{ htmlInput: { minLength: 3, maxLength: 30 } }} helperText="Hərf, rəqəm, nöqtə, tire və alt xətdən istifadə edin." />
            <TextField label="E-poçt" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} required />
          </Stack>
          <Button type="submit" variant="contained" disabled={profilePending} startIcon={profilePending ? <CircularProgress size={16} /> : <TaskAltOutlinedIcon />}>Dəyişiklikləri yadda saxla</Button>
        </Card>

        <Card className="account-card account-security-card" component="form" onSubmit={submitPassword}>
          <Box className="account-card-heading"><Box className="account-card-icon security"><LockResetOutlinedIcon /></Box><Box><Typography component="h2">Şifrəni dəyiş</Typography><Typography>Giriş məlumatlarını təhlükəsiz yeniləyin</Typography></Box></Box>
          <Divider />
          <Stack spacing={2.2} className="account-form-fields">
            <TextField label="Cari şifrə" type="password" autoComplete="current-password" value={password.current_password} onChange={(event) => setPassword({ ...password, current_password: event.target.value })} required />
            <TextField label="Yeni şifrə" type="password" autoComplete="new-password" value={password.new_password} onChange={(event) => setPassword({ ...password, new_password: event.target.value })} required slotProps={{ htmlInput: { minLength: 12, maxLength: 128 } }} helperText="Minimum 12 simvol: böyük/kiçik hərf, rəqəm və xüsusi işarə." />
            <TextField label="Yeni şifrəni təkrarla" type="password" autoComplete="new-password" value={password.confirmation} onChange={(event) => setPassword({ ...password, confirmation: event.target.value })} required />
          </Stack>
          <Alert icon={<SecurityOutlinedIcon />} severity="info" className="session-revoke-note">Şifrə dəyişəndə bu cihaz istisna olmaqla bütün aktiv sessiyalar dərhal bağlanacaq.</Alert>
          <Button type="submit" variant="contained" color="secondary" disabled={passwordPending} startIcon={passwordPending ? <CircularProgress size={16} /> : <LockResetOutlinedIcon />}>Şifrəni təhlükəsiz dəyiş</Button>
        </Card>
      </Box>
    </Box>
  )
}
