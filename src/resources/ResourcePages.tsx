/* eslint-disable react-refresh/only-export-components */
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PublishIcon from '@mui/icons-material/Publish'
import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Create, CreateButton, Datagrid, DateTimeInput, Edit, EditButton, FunctionField, List, ListButton, NumberInput,
  SearchInput, SelectInput, Show, ShowButton, SimpleForm, SimpleShowLayout, TextInput, TopToolbar,
  useNotify, usePermissions, useRecordContext, useRefresh, type RaRecord,
} from 'react-admin'
import { publishResource } from '../data/dataProvider'
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

export function createResourcePages(contract: ResourceContract) {
  const ListPage = () => <PermissionGate permission={contract.readPermission}><Box className="resource-page"><Box className="resource-heading" sx={{ '--resource-accent': contract.accent }}><Box><Typography className="resource-kicker">{contract.group}</Typography><Typography component="h1">{contract.label}</Typography><Typography>{contract.description}</Typography></Box></Box><List title={contract.label} perPage={25} sort={{ field: contract.fields.find((field) => field.kind === 'date')?.source || 'id', order: 'DESC' }} filters={[<SearchInput key="q" source="q" placeholder="Axtar…" alwaysOn />, <SelectInput key="status" source="status" label="Status" choices={['active', 'inactive', 'pending', 'draft', 'published', 'archived', 'failed'].map((id) => ({ id, name: statusLabels[id] }))} />]} actions={<ListActions contract={contract} />} empty={false}><Datagrid bulkActionButtons={false} rowClick="show" className="resource-table">{contract.fields.map((field) => <FieldDisplay key={field.source} field={field} label={field.label} />)}<ShowButton label="Bax" /><PermissionedEditButton contract={contract} /></Datagrid></List></Box></PermissionGate>

  const ShowPage = () => <PermissionGate permission={contract.readPermission}><Show title={contract.singular} actions={<ShowActions contract={contract} />}><Box className="detail-shell"><Box className="detail-accent" sx={{ background: contract.accent }} /><Typography className="resource-kicker">{contract.singular} məlumatı</Typography><SimpleShowLayout>{contract.fields.map((field) => <FieldDisplay key={field.source} field={field} label={field.label} />)}{contract.name === 'clubs' && <PublishClubButton />}</SimpleShowLayout></Box></Show></PermissionGate>

  const EditPage = () => <PermissionGate permission={contract.writePermission || contract.readPermission}><Edit title={`${contract.singular} — düzəliş`} mutationMode="pessimistic"><SimpleForm className="resource-form"><Box className="form-intro"><Typography component="h2">{contract.singular} məlumatlarını yenilə</Typography><Typography>Dəyişikliklər versiya yoxlamasından keçir və audit izinə yazılır.</Typography></Box><Stack className="form-grid">{contract.fields.filter((field) => field.editable).map((field) => <FormField key={field.source} field={field} />)}</Stack></SimpleForm></Edit></PermissionGate>

  const CreatePage = () => <PermissionGate permission={contract.createPermission || contract.readPermission}><Create title={`Yeni ${contract.singular}`}><SimpleForm className="resource-form"><Box className="form-intro"><Typography component="h2">Yeni {contract.singular.toLocaleLowerCase('az')} yarat</Typography><Typography>Məcburi sahələri tamamlayın. Yeni qeyd əvvəlcə draft kimi saxlanılır.</Typography></Box><Stack className="form-grid">{contract.fields.filter((field) => field.editable).map((field) => <FormField key={field.source} field={field} />)}</Stack></SimpleForm></Create></PermissionGate>

  return { list: ListPage, show: ShowPage, edit: EditPage, create: CreatePage }
}
