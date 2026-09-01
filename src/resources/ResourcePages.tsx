/* eslint-disable react-refresh/only-export-components */
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PublishIcon from '@mui/icons-material/Publish'
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material'
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
  return <TextInput source={field.source} label={field.label} fullWidth />
}

function ListActions({ contract }: { contract: ResourceContract }) {
  const { permissions } = usePermissions<string[]>()
  return <TopToolbar>{contract.createPermission && canAccess(permissions, contract.createPermission) && <CreateButton label={`${contract.singular} yarat`} icon={<AddIcon />} />}</TopToolbar>
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

export function createResourcePages(contract: ResourceContract) {
  const ListPage = () => <PermissionGate permission={contract.readPermission}><Box className="resource-page"><Box className="resource-heading" sx={{ '--resource-accent': contract.accent }}><Box><Typography className="resource-kicker">{contract.group}</Typography><Typography component="h1">{contract.label}</Typography><Typography>{contract.description}</Typography>{contract.name === 'fraud-reviews' && <FraudMetrics />}</Box></Box><List title={contract.label} perPage={25} sort={{ field: contract.fields.find((field) => field.kind === 'date')?.source || 'id', order: 'DESC' }} filters={[<SearchInput key="q" source="q" placeholder="Axtar…" alwaysOn />, <SelectInput key="status" source="status" label="Status" choices={['active', 'inactive', 'pending', 'draft', 'published', 'archived', 'failed'].map((id) => ({ id, name: statusLabels[id] }))} />]} actions={<ListActions contract={contract} />} empty={false}><Datagrid bulkActionButtons={false} rowClick={contract.supportsShow === false ? false : 'show'} className="resource-table">{contract.fields.map((field) => <FieldDisplay key={field.source} field={field} label={field.label} />)}{contract.name === 'fraud-reviews' && <FraudDecisionButton />}{contract.supportsShow !== false && <ShowButton label="Bax" />}{contract.name !== 'fraud-reviews' && <PermissionedEditButton contract={contract} />}</Datagrid></List></Box></PermissionGate>

  const ShowPage = () => <PermissionGate permission={contract.readPermission}><Show title={contract.singular} actions={<ShowActions contract={contract} />}><Box className="detail-shell"><Box className="detail-accent" sx={{ background: contract.accent }} /><Typography className="resource-kicker">{contract.singular} məlumatı</Typography><SimpleShowLayout>{contract.fields.map((field) => <FieldDisplay key={field.source} field={field} label={field.label} />)}{contract.name === 'clubs' && <PublishClubButton />}</SimpleShowLayout></Box></Show></PermissionGate>

  const EditPage = () => <PermissionGate permission={contract.writePermission || contract.readPermission}><Edit title={`${contract.singular} — düzəliş`} mutationMode="pessimistic"><SimpleForm className="resource-form"><Box className="form-intro"><Typography component="h2">{contract.singular} məlumatlarını yenilə</Typography><Typography>Dəyişikliklər versiya yoxlamasından keçir və audit izinə yazılır.</Typography></Box><Stack className="form-grid">{contract.fields.filter((field) => field.editable).map((field) => <FormField key={field.source} field={field} />)}</Stack></SimpleForm></Edit></PermissionGate>

  const CreatePage = () => <PermissionGate permission={contract.createPermission || contract.readPermission}><Create title={`Yeni ${contract.singular}`}><SimpleForm className="resource-form"><Box className="form-intro"><Typography component="h2">Yeni {contract.singular.toLocaleLowerCase('az')} yarat</Typography><Typography>Məcburi sahələri tamamlayın. Yeni qeyd əvvəlcə draft kimi saxlanılır.</Typography></Box><Stack className="form-grid">{contract.fields.filter((field) => field.editable).map((field) => <FormField key={field.source} field={field} />)}</Stack></SimpleForm></Create></PermissionGate>

  return { list: ListPage, show: ShowPage, edit: EditPage, create: CreatePage }
}
