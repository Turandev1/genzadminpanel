import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import { Alert, Avatar, Box, Button, Card, Chip, LinearProgress, Skeleton, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetIdentity } from 'react-admin'
import { sessionStore } from '../auth/session'
import { apiRequest } from '../data/httpClient'

type DashboardMetric = { key: string; value: number }
type DashboardTrendPoint = { label: string; value: number }
type DashboardQueue = { key: string; value: number }
type DashboardActivity = { id: string; actor_name: string; action: string; resource: string; occurred_at: string; outcome: string }
type DashboardData = { generated_at: string; metrics: DashboardMetric[]; trend: DashboardTrendPoint[]; queues: DashboardQueue[]; activity: DashboardActivity[] }

const roleContent = {
  superadmin: { title: 'Platform pulse', subtitle: 'Sistem, growth və risk siqnallarının vahid görünüşü.', badge: 'SUPERADMIN' },
  admin: { title: 'Əməliyyat mərkəzi', subtitle: 'Prioritet növbələr və platformanın gündəlik sağlamlığı.', badge: 'ADMIN' },
} satisfies Record<string, { title: string; subtitle: string; badge: string }>

const metricMeta: Record<string, { label: string; color: string; icon: React.ReactNode; format?: 'currency' }> = {
  active_users: { label: 'Aktiv hesablar', color: '#B7F34A', icon: <GroupOutlinedIcon /> },
  month_revenue_minor: { label: 'Aylıq gəlir', color: '#72E6B1', icon: <CampaignOutlinedIcon />, format: 'currency' },
  upcoming_events: { label: 'Yaxın tədbirlər', color: '#8EDBFF', icon: <CalendarMonthOutlinedIcon /> },
  open_reports: { label: 'Açıq şikayətlər', color: '#FF9C77', icon: <SecurityOutlinedIcon /> },
  pending_ambassadors: { label: 'Gözləyən müraciətlər', color: '#FFD66B', icon: <CampaignOutlinedIcon /> },
  pending_fraud_reviews: { label: 'Risk siqnalları', color: '#FF8394', icon: <SecurityOutlinedIcon /> },
  failed_jobs: { label: 'Uğursuz işlər', color: '#FF8394', icon: <ReplayOutlinedIcon /> },
}

const queueMeta: Record<string, { label: string; color: string; to?: string }> = {
  pending_fraud_reviews: { label: 'Fraud review növbəsi', color: '#FF8394', to: '/fraud-reviews' },
  pending_ambassadors: { label: 'Ambassador müraciətləri', color: '#FFD66B' },
  open_reports: { label: 'Açıq şikayətlər', color: '#FF9C77' },
  failed_jobs: { label: 'Uğursuz fon işləri', color: '#FF8394' },
}

function formatMetric(metric: DashboardMetric) {
  if (metricMeta[metric.key]?.format === 'currency') return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN', maximumFractionDigits: 2 }).format(metric.value / 100)
  return new Intl.NumberFormat('az-AZ').format(metric.value)
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000))
  if (seconds < 60) return 'indi'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} dəq əvvəl`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat əvvəl`
  return `${Math.floor(seconds / 86400)} gün əvvəl`
}

export function Dashboard() {
  const { identity } = useGetIdentity()
  const role = sessionStore.getContext()?.roles[0] || 'admin'
  const content = roleContent[role as keyof typeof roleContent] || roleContent.admin
  const greeting = useMemo(() => new Date().getHours() < 12 ? 'Sabahınız xeyir' : new Date().getHours() < 18 ? 'Günortanız xeyir' : 'Axşamınız xeyir', [])
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(false)
    try { setData(await apiRequest<DashboardData>('/admin/dashboard')) } catch { setData(null); setError(true) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    void apiRequest<DashboardData>('/admin/dashboard').then(
      (response) => { if (active) setData(response) },
      () => { if (active) setError(true) },
    ).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const maximumTrendValue = Math.max(...(data?.trend.map((point) => point.value) || []), 1)

  return (
    <Box className="dashboard-page">
      <Box className="dashboard-header">
        <Box><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Chip label={content.badge} size="small" className="role-chip" />{!loading && !error && <span className="live-label"><i /> CANLI</span>}</Stack><Typography component="h1">{greeting}, {String(identity?.fullName || 'operator').split(' ')[0]}.</Typography><Typography>{content.subtitle}</Typography></Box>
        <Button variant="outlined" component={Link} to="/audit-events">Audit izi</Button>
      </Box>

      {error && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void loadDashboard()}>Yenidən yoxla</Button>}>Dashboard məlumatları yüklənmədi. Məlumat dəyişdirilməyib.</Alert>}

      <Box className="metrics-grid">
        {loading && Array.from({ length: 4 }, (_, index) => <Card className="metric-card" key={index}><Skeleton variant="rounded" width={40} height={40} /><Skeleton width="65%" /><Skeleton width="42%" height={42} /></Card>)}
        {!loading && data?.metrics.map((metric) => {
          const meta = metricMeta[metric.key]
          if (!meta) return null
          return <Card className="metric-card" key={metric.key}><Box className="metric-icon" sx={{ backgroundColor: meta.color }}>{meta.icon}</Box><Typography>{meta.label}</Typography><strong>{formatMetric(metric)}</strong><Box><span>Canlı aggregate</span></Box></Card>
        })}
      </Box>

      {!loading && !error && data?.metrics.length === 0 && <Alert severity="info">Bu rol üçün görünə bilən dashboard göstəricisi yoxdur.</Alert>}

      <Box className="dashboard-grid">
        <Card className="performance-card">
          <Box className="card-heading"><Box><Typography component="h2">{content.title}</Typography><Typography>Son 12 həftədə yeni qeydiyyatlar</Typography></Box></Box>
          {loading ? <Skeleton variant="rounded" height={220} /> : data?.trend.length ? <Box className="bar-chart" aria-label="12 həftəlik yeni qeydiyyatlar qrafiki">{data.trend.map((point) => <Box key={point.label} className="bar-column" title={`${point.label}: ${point.value}`}><span style={{ height: `${Math.max((point.value / maximumTrendValue) * 100, point.value ? 3 : 0)}%` }} /><small>{point.label}</small></Box>)}</Box> : <Box className="dashboard-empty">Bu qrafiki görmək üçün istifadəçi oxuma icazəsi tələb olunur.</Box>}
        </Card>
        <Card className="queue-card">
          <Box className="card-heading"><Box><Typography component="h2">Bu günün fokusları</Typography><Typography>İcazəniz daxilindəki aktiv növbələr</Typography></Box></Box>
          {loading && <Stack spacing={2}><Skeleton height={48} /><Skeleton height={48} /><Skeleton height={48} /></Stack>}
          {!loading && data?.queues.map((queue) => {
            const meta = queueMeta[queue.key]
            if (!meta) return null
            const queueContent = <><Box><span className="queue-dot" style={{ background: meta.color }} /><Typography>{meta.label}</Typography><strong>{new Intl.NumberFormat('az-AZ').format(queue.value)}</strong></Box><LinearProgress variant="determinate" value={queue.value > 0 ? 100 : 0} sx={{ '& .MuiLinearProgress-bar': { backgroundColor: meta.color } }} /></>
            return meta.to ? <Box className="queue-row" key={queue.key} component={Link} to={meta.to}>{queueContent}</Box> : <Box className="queue-row" key={queue.key}>{queueContent}</Box>
          })}
          {!loading && data?.queues.length === 0 && <Box className="dashboard-empty">Aktiv növbə yoxdur və ya bu növbələr üçün icazəniz yoxdur.</Box>}
        </Card>
      </Box>

      <Card className="activity-card"><Box className="card-heading"><Box><Typography component="h2">Son fəaliyyət</Typography><Typography>Platformada təhlükəsiz və izlənə bilən dəyişikliklər</Typography></Box><Button component={Link} to="/audit-events">Hamısına bax</Button></Box>
        {loading && <Stack spacing={2}>{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} height={44} />)}</Stack>}
        {!loading && data?.activity.length ? <Box className="activity-list">{data.activity.map((item) => <Box className="activity-row" key={item.id}><Avatar sx={{ bgcolor: item.outcome === 'failed' ? '#FF8394' : '#8EDBFF', color: '#17191F' }}>{item.actor_name.slice(0, 2).toUpperCase()}</Avatar><Box><Typography><strong>{item.actor_name}</strong> {item.action}</Typography><span>{item.resource}</span></Box><time>{relativeTime(item.occurred_at)}</time></Box>)}</Box> : !loading && <Box className="dashboard-empty">Son fəaliyyət üçün audit icazəsi yoxdur və ya hələ heç bir qeyd yaranmayıb.</Box>}
      </Card>
    </Box>
  )
}
