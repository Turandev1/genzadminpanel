/* eslint-disable react-refresh/only-export-components */
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import PublishIcon from '@mui/icons-material/Publish'
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined'
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Create, CreateButton, Datagrid, DateTimeInput, Edit, EditButton, FunctionField, List, ListButton, NumberInput,
  SearchInput, SelectInput, Show, ShowButton, SimpleForm, SimpleShowLayout, TextInput, TopToolbar,
  useNotify, usePermissions, useRecordContext, useRefresh, type RaRecord,
} from 'react-admin'
import { decideFraudReview, publishResource } from '../data/dataProvider'
import { apiRequest } from '../data/httpClient'
import { canAccess, type ResourceContract, type ResourceField } from '../data/resourceRegistry'

const statusLabels: Record<string, string> = { active: 'Aktiv', inactive: 'Qaralama', published: 'Yayımlanıb', draft: 'Draft', archived: 'Arxiv', pending: 'Gözləyir', approved: 'Təsdiqlənib', paid: 'Ödənib', completed: 'Tamamlandı', failed: 'Uğursuz', open: 'Açıq', reviewing: 'İcmalda', resolved: 'Həll edilib', suspended: 'Dayandırılıb', blocked: 'Bloklanıb', success: 'Uğurlu', available: 'Hazır', verified: 'Təsdiqli', configured: 'Qurulub', secret: 'Məxfi', critical: 'Kritik', high: 'Yüksək', medium: 'Orta', low: 'Aşağı', review: 'İcmal' }
const statusTone = (status: string) => ['active', 'published', 'approved', 'paid', 'completed', 'success', 'available', 'verified', 'configured', 'checked_in', 'converted'].includes(status) ? 'success' : ['pending', 'draft', 'open', 'reviewing', 'in_progress', 'review'].includes(status) ? 'warning' : ['failed', 'blocked', 'suspended', 'critical', 'high'].includes(status) ? 'error' : 'default'
const userDeletePasswordRequired = false

function formatField(field: ResourceField, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (field.kind === 'date') return new Intl.DateTimeFormat('az-AZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(String(value)))
  if (field.kind === 'money') return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(Number(value) / 100)
  if (field.kind === 'number') return new Intl.NumberFormat('az-AZ').format(Number(value))
  return String(value)
}

function PermissionGate({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { permissions, isPending } = usePermissions<string[]>()
  if (isPending) return null
  if (!canAccess(permissions, permission)) return <Navigate to="/access-denied" replace />
  return children
}

function FieldDisplay({ field }: { field: ResourceField; label?: string }) {
  return <FunctionField label={field.label} source={field.source} render={(record: RaRecord) => field.kind === 'status' ? <Chip size="small" label={statusLabels[String(record[field.source])] || String(record[field.source] || '—')} color={statusTone(String(record[field.source]))} className="status-chip" /> : <span className={field.kind === 'money' || field.kind === 'number' ? 'tabular-value' : undefined}>{formatField(field, record[field.source])}</span>} />
}

function FormField({ field }: { field: ResourceField }) {
  if (field.kind === 'date') return <DateTimeInput source={field.source} label={field.label} />
  if (field.kind === 'number' || field.kind === 'money') return <NumberInput source={field.source} label={field.label} />
  if (field.kind === 'status') return <SelectInput source={field.source} label={field.label} choices={['draft', 'active', 'published', 'pending', 'archived'].map((id) => ({ id, name: statusLabels[id] }))} />
  if (field.source === 'registration_type') return <SelectInput source={field.source} label={field.label} choices={[{ id: 'free', name: 'Pulsuz' }, { id: 'approval', name: 'Təsdiq ilə' }, { id: 'paid', name: 'Ödənişli' }]} />
  return <TextInput source={field.source} label={field.label} fullWidth />
}

function ListActions({ contract }: { contract: ResourceContract }) {
  const { permissions } = usePermissions<string[]>()
  return <TopToolbar>
    {contract.name === 'ambassador-applications' && <AmbassadorCreateButton />}
    {contract.createPermission && canAccess(permissions, contract.createPermission) && <CreateButton label={`${contract.singular} yarat`} icon={<AddIcon />} />}
  </TopToolbar>
}

function AmbassadorCreateButton() {
  const { permissions } = usePermissions<string[]>()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [city, setCity] = useState('')
  const [motivation, setMotivation] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  if (!canAccess(permissions, 'ops.ambassadors.create')) return null
  const reset = () => {
    setName(''); setEmail(''); setUsername(''); setCity(''); setMotivation(''); setTemporaryPassword(''); setMfaCode('')
  }
  const close = () => {
    if (pending) return
    setOpen(false)
    reset()
  }
  const valid = name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email.trim()) && /^[\p{L}\p{N}_.-]{3,30}$/u.test(username.trim())
    && temporaryPassword.length >= 6 && /\p{Lu}/u.test(temporaryPassword) && /\p{Ll}/u.test(temporaryPassword) && /^\d{6}$/.test(mfaCode)
  const submit = async () => {
    setPending(true)
    try {
      await apiRequest('/admin/mfa/step-up', { method: 'POST', body: { code: mfaCode } })
      await apiRequest('/admin/ambassadors', { method: 'POST', body: {
        name: name.trim(), email: email.trim(), username: username.trim(), city: city.trim(), motivation: motivation.trim(), temporary_password: temporaryPassword,
      } })
      notify('Ambassador hesabı və aktiv referral linki yaradıldı', { type: 'success' })
      setOpen(false)
      reset()
      refresh()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Ambassador hesabını yaratmaq mümkün olmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }
  return <>
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>Ambassador yarat</Button>
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Yeni ambassador hesabı</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Alert severity="info">Hesab dərhal aktiv yaradılır, ambassador rolu və unikal referral linki avtomatik təyin edilir.</Alert>
        <TextField label="Ad və soyad" value={name} onChange={(event) => setName(event.target.value)} autoFocus required slotProps={{ htmlInput: { maxLength: 100 } }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="E-poçt" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth slotProps={{ htmlInput: { maxLength: 254 } }} />
          <TextField label="İstifadəçi adı" value={username} onChange={(event) => setUsername(event.target.value)} required fullWidth slotProps={{ htmlInput: { maxLength: 30 } }} helperText="Hərf, rəqəm, nöqtə, tire və alt xətt" />
        </Stack>
        <TextField label="Şəhər" value={city} onChange={(event) => setCity(event.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField label="Müvəqqəti şifrə" type="password" value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} required autoComplete="new-password" helperText="Minimum 6 simvol, böyük və kiçik hərf olmalıdır." />
        <TextField label="Motivasiya / qeyd" value={motivation} onChange={(event) => setMotivation(event.target.value)} multiline minRows={2} slotProps={{ htmlInput: { maxLength: 2000 } }} />
        <TextField label="MFA kodu" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required helperText="Bu yüksək səlahiyyətli əməliyyat admin auditinə yazılır." />
      </Stack></DialogContent>
      <DialogActions><Button onClick={close} disabled={pending}>Ləğv et</Button><Button variant="contained" onClick={() => void submit()} disabled={pending || !valid}>Hesabı yarat</Button></DialogActions>
    </Dialog>
  </>
}

function PermissionedEditButton({ contract }: { contract: ResourceContract }) {
  const { permissions } = usePermissions<string[]>()
  if (!contract.writePermission || !canAccess(permissions, contract.writePermission)) return null
  return <EditButton label="Dəyiş" />
}

function ShowActions({ contract }: { contract: ResourceContract }) {
  return <TopToolbar><ListButton label="Siyahıya qayıt" icon={<ArrowBackIcon />} /><PermissionedEditButton contract={contract} /></TopToolbar>
}

function PublishClubButton() {
  const record = useRecordContext<RaRecord>()
  const { permissions } = usePermissions<string[]>()
  const notify = useNotify()
  const refresh = useRefresh()
  const [pending, setPending] = useState(false)
  if (!record || record.status !== 'inactive' || !canAccess(permissions, 'content.clubs.publish')) return null
  const publish = async () => {
    setPending(true)
    try {
      await publishResource('clubs', record.id)
      notify('Klub yayımlandı', { type: 'success' })
      refresh()
    } catch {
      notify('Klubu yayımlamaq mümkün olmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }
  return <Button onClick={publish} disabled={pending} startIcon={<PublishIcon />} variant="contained">Yayımla</Button>
}

function FraudDecisionButton() {
  const record = useRecordContext<RaRecord>()
  const { permissions } = usePermissions<string[]>()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve')
  const [reason, setReason] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [pending, setPending] = useState(false)
  if (!record || !canAccess(permissions, 'ops.referrals.review')) return null
  const submit = async () => {
    setPending(true)
    try {
      await decideFraudReview(record.id, decision, reason.trim(), mfaCode.trim())
      notify(decision === 'approve' ? 'Referral təsdiqləndi və qualification yenidən başladıldı' : 'Referral rədd edildi', { type: 'success' })
      setOpen(false)
      refresh()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Qərarı saxlamaq mümkün olmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }
  return <>
    <Button size="small" variant="outlined" onClick={() => setOpen(true)}>Qərar ver</Button>
    <Dialog open={open} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>Fraud icmalı — risk {String(record.risk_score)}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <TextField select label="Qərar" value={decision} onChange={(event) => setDecision(event.target.value as 'approve' | 'reject')}>
          <MenuItem value="approve">Təsdiqlə</MenuItem><MenuItem value="reject">Rədd et</MenuItem>
        </TextField>
        <TextField label="Audit səbəbi" value={reason} onChange={(event) => setReason(event.target.value)} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 500 } }} required />
        <TextField label="MFA kodu" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required />
        <Typography variant="caption">Qərar actor, request ID və səbəblə audit izinə yazılır. Raw telefon, IP və cihaz məlumatı göstərilmir.</Typography>
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={pending}>Ləğv et</Button><Button onClick={submit} disabled={pending || reason.trim().length < 3 || mfaCode.length !== 6} variant="contained">Təsdiqlə</Button></DialogActions>
    </Dialog>
  </>
}

function FraudMetrics() {
  const [metrics, setMetrics] = useState<{ pending: number; approved: number; rejected: number; false_positive_rate: number } | null>(null)
  useEffect(() => { void apiRequest<typeof metrics>('/admin/referrals/metrics').then(setMetrics).catch(() => undefined) }, [])
  if (!metrics) return null
  return <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
    <Chip label={`Review növbəsi: ${metrics.pending}`} /><Chip label={`Manual qəbul: ${metrics.approved}`} color="success" /><Chip label={`Manual rədd: ${metrics.rejected}`} color="error" /><Chip label={`False-positive proxy: ${(metrics.false_positive_rate * 100).toFixed(1)}%`} color="warning" />
  </Stack>
}

function UserOperationsButton() {
  const record = useRecordContext<RaRecord>()
  const { permissions } = usePermissions<string[]>()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [operation, setOperation] = useState<'suspend' | 'activate' | 'revoke'>('revoke')
  const [reason, setReason] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [pending, setPending] = useState(false)
  const canStatus = canAccess(permissions, 'ops.users.suspend') && (record?.status === 'active' || record?.status === 'suspended')
  const canRevoke = canAccess(permissions, 'security.sessions.revoke')
  if (!record || (!canStatus && !canRevoke)) return null
  const show = () => {
    setOperation(canStatus ? (record.status === 'active' ? 'suspend' : 'activate') : 'revoke')
    setReason('')
    setMfaCode('')
    setOpen(true)
  }
  const submit = async () => {
    setPending(true)
    try {
      await apiRequest('/admin/mfa/step-up', { method: 'POST', body: { code: mfaCode } })
      if (operation === 'revoke') {
        await apiRequest(`/admin/users/${encodeURIComponent(String(record.id))}/sessions/revoke-all`, { method: 'POST', body: { reason } })
        notify('İstifadəçinin mobil və portal sessiyaları bağlandı', { type: 'success' })
      } else {
        const headers = new Headers()
        headers.set('If-Match', `"${String(record.version)}"`)
        headers.set('Idempotency-Key', crypto.randomUUID())
        await apiRequest(`/admin/users/${encodeURIComponent(String(record.id))}/status`, { method: 'POST', headers, body: { status: operation === 'suspend' ? 'suspended' : 'active', reason } })
        notify(operation === 'suspend' ? 'İstifadəçi dayandırıldı və sessiyaları bağlandı' : 'İstifadəçi aktivləşdirildi', { type: 'success' })
      }
      setOpen(false)
      refresh()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'İstifadəçi əməliyyatı tamamlanmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }
  return <>
    <Button size="small" startIcon={<ManageAccountsOutlinedIcon />} onClick={show}>Hesab nəzarəti</Button>
    <Dialog open={open} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{String(record.name || 'İstifadəçi')} — hesab nəzarəti</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <TextField select label="Əməliyyat" value={operation} onChange={(event) => setOperation(event.target.value as 'suspend' | 'activate' | 'revoke')}>
          {canStatus && record.status === 'active' && <MenuItem value="suspend">Hesabı dayandır</MenuItem>}
          {canStatus && record.status === 'suspended' && <MenuItem value="activate">Hesabı aktivləşdir</MenuItem>}
          {canRevoke && <MenuItem value="revoke">Bütün sessiyaları bağla</MenuItem>}
        </TextField>
        <TextField label="Audit səbəbi" value={reason} onChange={(event) => setReason(event.target.value)} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 500 } }} required />
        <TextField label="MFA kodu" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required />
        <Typography variant="caption">Dayandırma mobil və partner/ambassador portal sessiyalarını dərhal ləğv edir. Hər əməliyyat request ID və səbəblə auditə yazılır.</Typography>
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={pending}>Ləğv et</Button><Button onClick={() => void submit()} disabled={pending || reason.trim().length < 3 || mfaCode.length !== 6} variant="contained">Təsdiqlə</Button></DialogActions>
    </Dialog>
  </>
}

function UserDeleteButton() {
  const record = useRecordContext<RaRecord>()
  const { permissions } = usePermissions<string[]>()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [pending, setPending] = useState(false)
  if (!record || !canAccess(permissions, 'ops.users.update') || !['active', 'suspended'].includes(String(record.status))) return null

  const close = () => {
    if (pending) return
    setOpen(false)
    setCurrentPassword('')
  }

  const submit = async () => {
    setPending(true)
    try {
      const headers = new Headers()
      headers.set('If-Match', `"${String(record.version)}"`)
      headers.set('Idempotency-Key', crypto.randomUUID())
      await apiRequest(`/admin/users/${encodeURIComponent(String(record.id))}`, {
        method: 'DELETE', headers, body: { current_password: currentPassword },
      })
      notify(`${String(record.name || 'İstifadəçi')} adlı istifadəçi silinmə prosesinə göndərildi`, { type: 'success' })
      setOpen(false)
      setCurrentPassword('')
      refresh()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'İstifadəçini silmək mümkün olmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }

  return <>
    <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={(event) => { event.stopPropagation(); setOpen(true) }}>Sil</Button>
    <Dialog open={open} onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>İstifadəçini sil</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <Alert severity="error">
          <strong>{String(record.name || 'İstifadəçi')}</strong> adlı istifadəçini silirsiniz.
        </Alert>
        <Typography variant="body2" color="text.secondary">Bu əməliyyat hesabı dərhal deaktiv edir və şəxsi məlumatların, media fayllarının və giriş məlumatlarının daimi silinmə prosesini başladır.</Typography>
        {userDeletePasswordRequired && <TextField label="Admin şifrəsi" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required />}
      </Stack></DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={pending}>Ləğv et</Button>
        <Button color="error" variant="contained" onClick={() => void submit()} disabled={pending || (userDeletePasswordRequired && currentPassword.length === 0)}>{pending ? 'Silinir…' : 'Təsdiqlə və sil'}</Button>
      </DialogActions>
    </Dialog>
  </>
}

function EventLifecycleButton() {
  const record = useRecordContext<RaRecord>()
  const { permissions } = usePermissions<string[]>()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [command, setCommand] = useState<'publish' | 'cancel' | 'archive'>('publish')
  const [reason, setReason] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [pending, setPending] = useState(false)
  if (!record) return null
  const choices = [
    record.status === 'draft' && canAccess(permissions, 'content.events.publish') ? { id: 'publish', name: 'Yayımla' } : null,
    ['draft', 'published'].includes(String(record.status)) && canAccess(permissions, 'content.events.cancel') ? { id: 'cancel', name: 'Ləğv et' } : null,
    ['draft', 'cancelled', 'completed'].includes(String(record.status)) && canAccess(permissions, 'content.events.cancel') ? { id: 'archive', name: 'Arxivlə' } : null,
  ].filter((item): item is { id: 'publish' | 'cancel' | 'archive'; name: string } => item !== null)
  if (!choices.length) return null
  const show = () => {
    setCommand(choices[0].id)
    setReason('')
    setMfaCode('')
    setOpen(true)
  }
  const submit = async () => {
    setPending(true)
    try {
      await apiRequest('/admin/mfa/step-up', { method: 'POST', body: { code: mfaCode } })
      const headers = new Headers()
      headers.set('If-Match', `"${String(record.version)}"`)
      headers.set('Idempotency-Key', crypto.randomUUID())
      await apiRequest(`/admin/events/${encodeURIComponent(String(record.id))}/${command}`, { method: 'POST', headers, body: { reason } })
      notify(command === 'publish' ? 'Tədbir yayımlandı' : command === 'cancel' ? 'Tədbir ləğv edildi' : 'Tədbir arxivləndi', { type: 'success' })
      setOpen(false)
      refresh()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Tədbir əməliyyatı tamamlanmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }
  return <>
    <Button size="small" variant="outlined" onClick={show}>Lifecycle</Button>
    <Dialog open={open} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{String(record.title)} — lifecycle</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <TextField select label="Əməliyyat" value={command} onChange={(event) => setCommand(event.target.value as 'publish' | 'cancel' | 'archive')}>{choices.map((choice) => <MenuItem key={choice.id} value={choice.id}>{choice.name}</MenuItem>)}</TextField>
        <TextField label="Audit səbəbi" value={reason} onChange={(event) => setReason(event.target.value)} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 500 } }} required />
        <TextField label="MFA kodu" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required />
        <Typography variant="caption">Yayımlama yalnız aktiv klub və gələcək tarix üçün mümkündür. Ləğv və arxiv ayrıca audit/outbox hadisəsi yaradır.</Typography>
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={pending}>Ləğv et</Button><Button variant="contained" onClick={() => void submit()} disabled={pending || reason.trim().length < 3 || mfaCode.length !== 6}>Təsdiqlə</Button></DialogActions>
    </Dialog>
  </>
}

function PartnerOperationsButton() {
  const record = useRecordContext<RaRecord>()
  const { permissions } = usePermissions<string[]>()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [operation, setOperation] = useState('owner')
  const [ownerUserID, setOwnerUserID] = useState('')
  const [reason, setReason] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [pending, setPending] = useState(false)
  if (!record || !canAccess(permissions, 'ops.partners.review')) return null
  const statusChoices = record.status === 'pending_review' ? [{ id: 'approved', name: 'Müraciəti təsdiqlə' }, { id: 'rejected', name: 'Müraciəti rədd et' }]
    : record.status === 'approved' ? [{ id: 'active', name: 'Aktivləşdir' }, { id: 'rejected', name: 'Rədd et' }]
      : record.status === 'active' ? [{ id: 'suspended', name: 'Dayandır' }]
        : record.status === 'suspended' ? [{ id: 'active', name: 'Yenidən aktivləşdir' }] : []
  const choices = [{ id: 'owner', name: 'Owner təyin et' }, ...statusChoices]
  const show = () => {
    setOperation(Number(record.owners_count) === 0 ? 'owner' : (statusChoices[0]?.id || 'owner'))
    setOwnerUserID('')
    setReason('')
    setMfaCode('')
    setOpen(true)
  }
  const submit = async () => {
    setPending(true)
    try {
      await apiRequest('/admin/mfa/step-up', { method: 'POST', body: { code: mfaCode } })
      const headers = new Headers()
      headers.set('If-Match', `"${String(record.version)}"`)
      headers.set('Idempotency-Key', crypto.randomUUID())
      if (operation === 'owner') {
        await apiRequest(`/admin/partner-organizations/${encodeURIComponent(String(record.id))}/owners`, { method: 'POST', headers, body: { user_id: ownerUserID, reason } })
        notify('Partner owner təyin edildi', { type: 'success' })
      } else {
        await apiRequest(`/admin/partner-organizations/${encodeURIComponent(String(record.id))}/decision`, { method: 'POST', headers, body: { status: operation, reason } })
        notify('Partner statusu yeniləndi', { type: 'success' })
      }
      setOpen(false)
      refresh()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Partner əməliyyatı tamamlanmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }
  return <>
    <Button size="small" variant="outlined" onClick={show}>İdarə et</Button>
    <Dialog open={open} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{String(record.name)} — partner lifecycle</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {Number(record.owners_count) === 0 && <Alert severity="warning">Təşkilatı aktivləşdirməzdən əvvəl aktiv owner təyin edin.</Alert>}
        <TextField select label="Əməliyyat" value={operation} onChange={(event) => setOperation(event.target.value)}>{choices.map((choice) => <MenuItem key={choice.id} value={choice.id}>{choice.name}</MenuItem>)}</TextField>
        {operation === 'owner' && <TextField label="Owner user UUID" value={ownerUserID} onChange={(event) => setOwnerUserID(event.target.value.trim())} required helperText="Yalnız aktiv mobil istifadəçi owner kimi əlavə edilə bilər." />}
        <TextField label="Audit səbəbi" value={reason} onChange={(event) => setReason(event.target.value)} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 500 } }} required />
        <TextField label="MFA kodu" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required />
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={pending}>Ləğv et</Button><Button variant="contained" onClick={() => void submit()} disabled={pending || reason.trim().length < 3 || mfaCode.length !== 6 || (operation === 'owner' && ownerUserID.length < 36)}>Təsdiqlə</Button></DialogActions>
    </Dialog>
  </>
}

function AmbassadorDecisionButton() {
  const record = useRecordContext<RaRecord>()
  const { permissions } = usePermissions<string[]>()
  const notify = useNotify()
  const refresh = useRefresh()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('approved')
  const [reason, setReason] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [pending, setPending] = useState(false)
  if (!record || !canAccess(permissions, 'ops.ambassadors.review')) return null
  const choices = record.status === 'pending' ? [{ id: 'approved', name: 'Təsdiqlə' }, { id: 'rejected', name: 'Rədd et' }]
    : record.status === 'approved' ? [{ id: 'active', name: 'Aktivləşdir' }, { id: 'suspended', name: 'Dayandır' }]
      : record.status === 'active' ? [{ id: 'suspended', name: 'Dayandır' }]
        : record.status === 'suspended' ? [{ id: 'active', name: 'Yenidən aktivləşdir' }] : []
  if (!choices.length) return null
  const show = () => {
    setStatus(choices[0].id)
    setReason('')
    setMfaCode('')
    setOpen(true)
  }
  const submit = async () => {
    setPending(true)
    try {
      await apiRequest('/admin/mfa/step-up', { method: 'POST', body: { code: mfaCode } })
      const headers = new Headers()
      headers.set('If-Match', `"${String(record.version)}"`)
      headers.set('Idempotency-Key', crypto.randomUUID())
      await apiRequest(`/admin/ambassadors/${encodeURIComponent(String(record.id))}/decision`, { method: 'POST', headers, body: { status, reason } })
      notify('Ambassador statusu və referral link vəziyyəti yeniləndi', { type: 'success' })
      setOpen(false)
      refresh()
    } catch (caught) {
      notify(caught instanceof Error ? caught.message : 'Ambassador qərarı tamamlanmadı', { type: 'error' })
    } finally {
      setPending(false)
    }
  }
  return <>
    <Button size="small" variant="outlined" onClick={show}>Qərar ver</Button>
    <Dialog open={open} onClose={() => !pending && setOpen(false)} fullWidth maxWidth="sm">
      <DialogTitle>{String(record.name)} — Ambassador qərarı</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <TextField select label="Yeni status" value={status} onChange={(event) => setStatus(event.target.value)}>{choices.map((choice) => <MenuItem key={choice.id} value={choice.id}>{choice.name}</MenuItem>)}</TextField>
        <TextField label="Audit səbəbi" value={reason} onChange={(event) => setReason(event.target.value)} multiline minRows={3} slotProps={{ htmlInput: { maxLength: 500 } }} required />
        <TextField label="MFA kodu" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" required />
        <Typography variant="caption">Suspend/reject aktiv referral linkini dayandırır; reactivation linki yenidən aktiv edir. Qərar və reason auditə yazılır.</Typography>
      </Stack></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={pending}>Ləğv et</Button><Button variant="contained" onClick={() => void submit()} disabled={pending || reason.trim().length < 3 || mfaCode.length !== 6}>Təsdiqlə</Button></DialogActions>
    </Dialog>
  </>
}

export function createResourcePages(contract: ResourceContract) {
  const ListPage = () => <PermissionGate permission={contract.readPermission}><Box className="resource-page"><Box className="resource-heading" sx={{ '--resource-accent': contract.accent }}><Box><Typography className="resource-kicker">{contract.group}</Typography><Typography component="h1">{contract.label}</Typography><Typography>{contract.description}</Typography>{contract.name === 'fraud-reviews' && <FraudMetrics />}</Box></Box><List title={contract.label} perPage={25} sort={{ field: contract.fields.find((field) => field.kind === 'date')?.source || 'id', order: 'DESC' }} filters={[<SearchInput key="q" source="q" placeholder="Axtar…" alwaysOn />, <SelectInput key="status" source="status" label="Status" choices={['active', 'approved', 'rejected', 'suspended', 'cancelled', 'completed', 'pending_review', 'pending_deletion', 'deleted', 'inactive', 'pending', 'draft', 'published', 'archived', 'failed'].map((id) => ({ id, name: statusLabels[id] || id }))} />]} actions={<ListActions contract={contract} />} empty={false}><Datagrid bulkActionButtons={false} rowClick={contract.supportsShow === false ? false : 'show'} className="resource-table">{contract.fields.filter((field) => field.list !== false).map((field) => <FieldDisplay key={field.source} field={field} label={field.label} />)}{contract.name === 'fraud-reviews' && <FraudDecisionButton />}{contract.name === 'users' && <UserOperationsButton />}{contract.name === 'users' && <UserDeleteButton />}{contract.name === 'events' && <EventLifecycleButton />}{contract.name === 'partner-organizations' && <PartnerOperationsButton />}{contract.name === 'ambassador-applications' && <AmbassadorDecisionButton />}{contract.supportsShow !== false && <ShowButton label="Bax" />}{contract.name !== 'fraud-reviews' && <PermissionedEditButton contract={contract} />}</Datagrid></List></Box></PermissionGate>

  const ShowPage = () => <PermissionGate permission={contract.readPermission}><Show title={contract.singular} actions={<ShowActions contract={contract} />}><Box className="detail-shell"><Box className="detail-accent" sx={{ background: contract.accent }} /><Typography className="resource-kicker">{contract.singular} məlumatı</Typography><SimpleShowLayout>{contract.fields.map((field) => <FieldDisplay key={field.source} field={field} label={field.label} />)}{contract.name === 'clubs' && <PublishClubButton />}{contract.name === 'users' && <UserOperationsButton />}{contract.name === 'users' && <UserDeleteButton />}{contract.name === 'events' && <EventLifecycleButton />}</SimpleShowLayout></Box></Show></PermissionGate>

  const EditPage = () => <PermissionGate permission={contract.writePermission || contract.readPermission}><Edit title={`${contract.singular} — düzəliş`} mutationMode="pessimistic"><SimpleForm className="resource-form"><Box className="form-intro"><Typography component="h2">{contract.singular} məlumatlarını yenilə</Typography><Typography>Dəyişikliklər versiya yoxlamasından keçir və audit izinə yazılır.</Typography></Box><Stack className="form-grid">{contract.fields.filter((field) => field.editable).map((field) => <FormField key={field.source} field={field} />)}</Stack></SimpleForm></Edit></PermissionGate>

  const CreatePage = () => <PermissionGate permission={contract.createPermission || contract.readPermission}><Create title={`Yeni ${contract.singular}`}><SimpleForm className="resource-form"><Box className="form-intro"><Typography component="h2">Yeni {contract.singular.toLocaleLowerCase('az')} yarat</Typography><Typography>Məcburi sahələri tamamlayın. Yeni qeyd əvvəlcə draft kimi saxlanılır.</Typography></Box><Stack className="form-grid">{contract.fields.filter((field) => field.editable).map((field) => <FormField key={field.source} field={field} />)}</Stack></SimpleForm></Create></PermissionGate>

  return { list: ListPage, show: ShowPage, edit: EditPage, create: CreatePage }
}
