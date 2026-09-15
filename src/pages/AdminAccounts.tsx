import AddIcon from '@mui/icons-material/Add'
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, FormControlLabel, IconButton, MenuItem, Paper, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useNotify, usePermissions } from 'react-admin'
import { apiRequest } from '../data/httpClient'

type AdminAccount = {
  id: string
  display_name: string
  email: string
  username: string
  status: 'active' | 'suspended' | 'deleted'
  role: 'admin' | 'superadmin'
  preset_slugs: string[]
  direct_grants: Record<string, 'allow' | 'deny'>
  effective_permissions: string[]
  mfa_enrolled: boolean
  active_sessions: number
  must_change_password: boolean
  version: number
  created_at: string
  updated_at: string
}

type AccessCatalog = {
  roles: string[]
  permissions: { key: string; description: string; risk_level: string }[]
  presets: { slug: string; name: string; description: string; permissions: string[] }[]
}

type DialogMode = 'create' | 'status' | 'password' | 'access' | 'delete' | null
type GrantEffect = '' | 'allow' | 'deny'

const emptyCatalog: AccessCatalog = { roles: ['admin', 'superadmin'], permissions: [], presets: [] }
const strongPassword = (value: string) => value.length >= 12 && value.length <= 128 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9\s]/.test(value)

export function AdminAccounts() {
  const { permissions, isPending: permissionsPending } = usePermissions<string[]>()
  const notify = useNotify()
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [catalog, setCatalog] = useState<AccessCatalog>(emptyCatalog)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [mode, setMode] = useState<DialogMode>(null)
  const [target, setTarget] = useState<AdminAccount | null>(null)
  const [pending, setPending] = useState(false)
  const [reason, setReason] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<'admin' | 'superadmin'>('admin')
  const [presetSlugs, setPresetSlugs] = useState<string[]>([])
  const [grants, setGrants] = useState<Record<string, GrantEffect>>({})

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const query = new URLSearchParams({ page: '1', per_page: '100' })
      if (search.trim()) query.set('q', search.trim())
      if (status) query.set('status', status)
      const [list, access] = await Promise.all([
        apiRequest<{ items: AdminAccount[]; total: number }>(`/admin/admin-accounts?${query}`),
        apiRequest<AccessCatalog>('/admin/access-catalog'),
      ])
      setAccounts(list.items)
      setCatalog(access)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Admin hesablarını yükləmək mümkün olmadı')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250)
    return () => window.clearTimeout(timer)
  }, [load])

  const closeDialog = () => {
    setMode(null)
    setTarget(null)
    setReason('')
    setMfaCode('')
    setTemporaryPassword('')
    setDisplayName('')
    setEmail('')
    setUsername('')
    setRole('admin')
    setPresetSlugs([])
    setGrants({})
  }

  const openDialog = (nextMode: Exclude<DialogMode, null>, account?: AdminAccount) => {
    setTarget(account || null)
    setMode(nextMode)
    setReason('')
    setMfaCode('')
    setTemporaryPassword('')
    if (nextMode === 'access' && account) {
      setRole(account.role)
      setPresetSlugs(account.preset_slugs)
      setGrants({ ...account.direct_grants })
    }
  }

  const stepUp = async () => {
    await apiRequest('/admin/mfa/step-up', { method: 'POST', body: { code: mfaCode } })
  }

  const versionHeaders = (account: AdminAccount) => {
    const headers = new Headers()
    headers.set('If-Match', `"${account.version}"`)
    headers.set('Idempotency-Key', crypto.randomUUID())
    return headers
  }

  const submit = async () => {
    setPending(true)
    try {
      await stepUp()
      if (mode === 'create') {
        await apiRequest('/admin/admin-accounts', { method: 'POST', body: {
          display_name: displayName, email, username, temporary_password: temporaryPassword,
          role, preset_slugs: role === 'superadmin' ? [] : presetSlugs, reason,
        } })
        notify('Admin hesabı yaradıldı; ilk girişdə şifrə dəyişikliyi və MFA tələb olunur', { type: 'success' })
      } else if (mode === 'status' && target) {
        await apiRequest(`/admin/admin-accounts/${target.id}/status`, { method: 'POST', headers: versionHeaders(target), body: { status: target.status === 'active' ? 'suspended' : 'active', reason } })
        notify(target.status === 'active' ? 'Admin bloklandı və sessiyaları bağlandı' : 'Admin yenidən aktivləşdirildi', { type: 'success' })
      } else if (mode === 'password' && target) {
        await apiRequest(`/admin/admin-accounts/${target.id}/password-reset`, { method: 'POST', headers: versionHeaders(target), body: { temporary_password: temporaryPassword, reason } })
        notify('Müvəqqəti şifrə tətbiq edildi və bütün sessiyalar bağlandı', { type: 'success' })
      } else if (mode === 'access' && target) {
        const directGrants = Object.entries(grants).filter((entry): entry is [string, 'allow' | 'deny'] => entry[1] === 'allow' || entry[1] === 'deny').map(([permission, effect]) => ({ permission, effect }))
        await apiRequest(`/admin/admin-accounts/${target.id}/access`, { method: 'PUT', headers: versionHeaders(target), body: {
          role, preset_slugs: role === 'superadmin' ? [] : presetSlugs,
          grants: role === 'superadmin' ? [] : directGrants, reason,
        } })
        notify('Rol və icazələr atomik yeniləndi; aktiv sessiyalar bağlandı', { type: 'success' })
      } else if (mode === 'delete' && target) {
        await apiRequest(`/admin/admin-accounts/${target.id}`, { method: 'DELETE', headers: versionHeaders(target), body: { reason } })
        notify('Admin hesabı silindi, identifikatorları təmizləndi və sessiyaları bağlandı', { type: 'success' })
      }
      closeDialog()
      await load()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Əməliyyat tamamlanmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }

  const selectedPresetPermissions = useMemo(() => new Set(catalog.presets.filter((preset) => presetSlugs.includes(preset.slug)).flatMap((preset) => preset.permissions)), [catalog.presets, presetSlugs])
  const reasonValid = reason.trim().length >= 3
  const mfaValid = /^\d{6}$/.test(mfaCode)
  const passwordValid = strongPassword(temporaryPassword)
  const createValid = displayName.trim().length >= 2 && email.includes('@') && username.trim().length >= 3 && passwordValid
  const canSubmit = reasonValid && mfaValid && !pending && (mode !== 'create' || createValid) && (mode !== 'password' || passwordValid)

  if (permissionsPending) return <Box sx={{ p: 4 }}><CircularProgress /></Box>
  if (!permissions?.includes('*')) return <Navigate to="/access-denied" replace />

  return <Box className="resource-page" sx={{ p: { xs: 2, md: 3 } }}>
    <Stack direction={{ xs: 'column', md: 'row' }} sx={{ mb: 3, justifyContent: 'space-between', gap: 2 }}>
      <Box>
        <Typography className="resource-kicker">SUPERADMIN · TƏHLÜKƏSİZLİK</Typography>
        <Typography component="h1" variant="h4">Admin hesabları</Typography>
        <Typography color="text.secondary">Admin lifecycle, rol, preset və fərdi allow/deny icazələri.</Typography>
      </Box>
      <Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog('create')}>Admin yarat</Button>
    </Stack>

    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField fullWidth label="Ad, e-poçt və ya username üzrə axtar" value={search} onChange={(event) => setSearch(event.target.value)} />
        <TextField select label="Status" value={status} onChange={(event) => setStatus(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">Aktiv və bloklanmış</MenuItem><MenuItem value="active">Aktiv</MenuItem><MenuItem value="suspended">Bloklanmış</MenuItem><MenuItem value="deleted">Silinmiş</MenuItem>
        </TextField>
      </Stack>
    </Paper>

    {error && <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" onClick={() => void load()}>Yenidən yoxla</Button>}>{error}</Alert>}
    {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead><TableRow><TableCell>Admin</TableCell><TableCell>Giriş vəziyyəti</TableCell><TableCell>Rol və preset</TableCell><TableCell>Sessiyalar</TableCell><TableCell align="right">Əməliyyatlar</TableCell></TableRow></TableHead>
        <TableBody>{accounts.map((account) => <TableRow key={account.id} hover>
          <TableCell><Typography sx={{ fontWeight: 700 }}>{account.display_name}</Typography><Typography variant="body2">{account.email}</Typography><Typography variant="caption" color="text.secondary">@{account.username} · v{account.version}</Typography></TableCell>
          <TableCell><Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap' }}><Chip size="small" color={account.status === 'active' ? 'success' : account.status === 'suspended' ? 'error' : 'default'} label={account.status === 'active' ? 'Aktiv' : account.status === 'suspended' ? 'Bloklanıb' : 'Silinib'} /><Chip size="small" color={account.mfa_enrolled ? 'success' : 'warning'} label={account.mfa_enrolled ? 'MFA aktiv' : 'MFA gözləyir'} />{account.must_change_password && <Chip size="small" color="warning" label="Şifrə dəyişməlidir" />}</Stack></TableCell>
          <TableCell><Typography variant="body2" sx={{ fontWeight: 700 }}>{account.role === 'superadmin' ? 'Superadmin' : 'Admin'}</Typography><Typography variant="caption" color="text.secondary">{account.role === 'superadmin' ? 'Wildcard capability' : account.preset_slugs.join(', ') || 'Preset yoxdur'} · {account.effective_permissions.length} capability</Typography></TableCell>
          <TableCell>{account.active_sessions}</TableCell>
          <TableCell align="right">{account.status !== 'deleted' && <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Tooltip title="Rol və icazələr"><IconButton onClick={() => openDialog('access', account)}><SecurityOutlinedIcon /></IconButton></Tooltip>
            <Tooltip title="Şifrəni sıfırla"><IconButton onClick={() => openDialog('password', account)}><KeyOutlinedIcon /></IconButton></Tooltip>
            <Tooltip title={account.status === 'active' ? 'Blokla' : 'Aktivləşdir'}><IconButton color={account.status === 'active' ? 'warning' : 'success'} onClick={() => openDialog('status', account)}>{account.status === 'active' ? <BlockOutlinedIcon /> : <LockOpenOutlinedIcon />}</IconButton></Tooltip>
            <Tooltip title="Sil"><IconButton color="error" onClick={() => openDialog('delete', account)}><DeleteOutlineIcon /></IconButton></Tooltip>
          </Stack>}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </TableContainer>}

    <Dialog open={mode !== null} onClose={() => { if (!pending) closeDialog() }} fullWidth maxWidth={mode === 'access' ? 'md' : 'sm'}>
      <DialogTitle><Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}><AdminPanelSettingsOutlinedIcon />{mode === 'create' ? 'Yeni Admin hesabı' : mode === 'status' ? (target?.status === 'active' ? 'Admini blokla' : 'Admini aktivləşdir') : mode === 'password' ? 'Admin şifrəsini sıfırla' : mode === 'access' ? 'Rol və icazələri dəyiş' : 'Admin hesabını sil'}</Stack></DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {target && <Alert severity={mode === 'delete' ? 'error' : 'info'}>{target.display_name} · {target.email} · cari versiya {target.version}</Alert>}
        {mode === 'create' && <>
          <TextField label="Ad və soyad" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required slotProps={{ htmlInput: { maxLength: 100 } }} />
          <TextField label="E-poçt" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required slotProps={{ htmlInput: { maxLength: 254 } }} />
          <TextField label="Username" value={username} onChange={(event) => setUsername(event.target.value)} required slotProps={{ htmlInput: { maxLength: 30 } }} />
          <TextField select label="Rol" value={role} onChange={(event) => { setRole(event.target.value as 'admin' | 'superadmin'); setPresetSlugs([]) }}><MenuItem value="admin">Admin</MenuItem><MenuItem value="superadmin">Superadmin</MenuItem></TextField>
        </>}
        {(mode === 'create' || mode === 'password') && <TextField label="Müvəqqəti şifrə" type="password" value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} error={temporaryPassword.length > 0 && !passwordValid} helperText="12–128 simvol; böyük/kiçik hərf, rəqəm və simvol. Server bu dəyəri cavabda və auditdə qaytarmır." required />}
        {mode === 'access' && <>
          <TextField select label="Rol" value={role} onChange={(event) => { setRole(event.target.value as 'admin' | 'superadmin'); setPresetSlugs([]); setGrants({}) }}><MenuItem value="admin">Admin</MenuItem><MenuItem value="superadmin">Superadmin</MenuItem></TextField>
          {role === 'superadmin' ? <Alert severity="warning">Superadmin wildcard capability alır; preset və direct grant tətbiq edilmir.</Alert> : <>
            <Box><Typography sx={{ mb: 0.5, fontWeight: 700 }}>Preset-lər</Typography>{catalog.presets.map((preset) => <FormControlLabel key={preset.slug} control={<Checkbox checked={presetSlugs.includes(preset.slug)} onChange={(_, checked) => setPresetSlugs((current) => checked ? [...current, preset.slug] : current.filter((slug) => slug !== preset.slug))} />} label={`${preset.name} — ${preset.description}`} />)}</Box>
            <Box><Typography sx={{ fontWeight: 700 }}>Fərdi allow / deny</Typography><Typography variant="caption" color="text.secondary">Deny rol və preset-dən gələn allow üzərində üstünlük təşkil edir.</Typography><Stack spacing={1} sx={{ mt: 1, maxHeight: 320, overflowY: 'auto', pr: 1 }}>{catalog.permissions.filter((permission) => !permission.key.startsWith('security.admins.')).map((permission) => <Stack key={permission.key} direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 1, alignItems: { sm: 'center' } }}><Box sx={{ flex: 1 }}><Typography variant="body2" sx={{ fontWeight: selectedPresetPermissions.has(permission.key) ? 700 : 500 }}>{permission.key}</Typography><Typography variant="caption" color="text.secondary">{permission.description} · {permission.risk_level}</Typography></Box><TextField select size="small" value={grants[permission.key] || ''} onChange={(event) => setGrants((current) => ({ ...current, [permission.key]: event.target.value as GrantEffect }))} sx={{ minWidth: 130 }}><MenuItem value="">Default</MenuItem><MenuItem value="allow">Allow</MenuItem><MenuItem value="deny">Deny</MenuItem></TextField></Stack>)}</Stack></Box>
          </>}
        </>}
        {mode === 'delete' && <Alert severity="error">Bu əməliyyat identifikatorları təmizləyir, giriş və MFA məlumatını ləğv edir. Audit tarixçəsi saxlanılır və əməliyyat geri qaytarılmır.</Alert>}
        <TextField label="Audit səbəbi" value={reason} onChange={(event) => setReason(event.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 500 } }} required />
        <TextField label="MFA kodu" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required />
      </Stack></DialogContent>
      <DialogActions><Button onClick={closeDialog} disabled={pending}>Ləğv et</Button><Button variant="contained" color={mode === 'delete' ? 'error' : 'primary'} onClick={() => void submit()} disabled={!canSubmit}>{pending ? <CircularProgress size={20} /> : 'Təsdiqlə'}</Button></DialogActions>
    </Dialog>
  </Box>
}
