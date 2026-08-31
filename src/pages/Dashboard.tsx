import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import { Avatar, Box, Button, Card, Chip, IconButton, LinearProgress, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGetIdentity } from 'react-admin'
import { sessionStore } from '../auth/session'

type Metric = { label: string; value: string; delta: string; detail: string; color: string; icon: React.ReactNode }

const roleContent = {
  superadmin: { title: 'Platform pulse', subtitle: 'Sistem, growth və risk siqnallarının vahid görünüşü.', badge: 'SUPERADMIN', metrics: [
    { label: 'Aktiv istifadəçilər', value: '24,892', delta: '+12.4%', detail: 'son 30 gündə', color: '#B7F34A', icon: <GroupOutlinedIcon /> },
    { label: 'Aylıq gəlir', value: '₼48.2K', delta: '+8.7%', detail: 'keçən aya qarşı', color: '#72E6B1', icon: <ArrowUpwardIcon /> },
    { label: 'Yaxın tədbirlər', value: '38', delta: '12 yeni', detail: 'bu həftə', color: '#8EDBFF', icon: <CalendarMonthOutlinedIcon /> },
    { label: 'Risk siqnalları', value: '3', delta: '2 yüksək', detail: 'diqqət tələb edir', color: '#FF8394', icon: <SecurityOutlinedIcon /> },
  ] },
  admin: { title: 'Əməliyyat mərkəzi', subtitle: 'Prioritet növbələr və platformanın gündəlik sağlamlığı.', badge: 'ADMIN', metrics: [
    { label: 'Açıq şikayətlər', value: '23', delta: '−8.1%', detail: 'keçən həftəyə qarşı', color: '#FF9C77', icon: <SecurityOutlinedIcon /> },
    { label: 'Gözləyən müraciət', value: '14', delta: '6 yeni', detail: 'son 24 saat', color: '#FFD66B', icon: <CampaignOutlinedIcon /> },
    { label: 'Aktiv istifadəçilər', value: '8,491', delta: '+6.2%', detail: 'bu gün', color: '#B7F34A', icon: <GroupOutlinedIcon /> },
    { label: 'Uğursuz işlər', value: '3', delta: '1 kritik', detail: 'retry mümkündür', color: '#FF8394', icon: <SecurityOutlinedIcon /> },
  ] },
} satisfies Record<string, { title: string; subtitle: string; badge: string; metrics: Metric[] }>

const chartValues = [42, 54, 49, 62, 57, 73, 69, 81, 76, 86, 78, 92]
const activity = [
  { initials: 'AQ', name: 'Aysel Quliyeva', action: 'istifadəçi statusunu aktivləşdirdi', target: 'Nihad Abbasov', time: '4 dəq', color: '#FF9C77' },
  { initials: 'NM', name: 'Nərgiz Məmmədli', action: 'tədbiri yayımladı', target: 'Design after dark', time: '18 dəq', color: '#8EDBFF' },
  { initials: 'S', name: 'Sistem', action: 'şübhəli sessiyanı blokladı', target: 'reuse detection', time: '42 dəq', color: '#FF8394' },
  { initials: 'LƏ', name: 'Leyla Əliyeva', action: 'tapşırıq sübutu göndərdi', target: 'Campus event recap', time: '1 saat', color: '#C6A7FF' },
]

export function Dashboard() {
  const { identity } = useGetIdentity()
  const role = sessionStore.getContext()?.roles[0] || 'admin'
  const content = roleContent[role as keyof typeof roleContent] || roleContent.admin
  const greeting = useMemo(() => new Date().getHours() < 12 ? 'Sabahınız xeyir' : new Date().getHours() < 18 ? 'Günortanız xeyir' : 'Axşamınız xeyir', [])

  return (
    <Box className="dashboard-page">
      <Box className="dashboard-header">
        <Box><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Chip label={content.badge} size="small" className="role-chip" /><span className="live-label"><i /> CANLI</span></Stack><Typography component="h1">{greeting}, {String(identity?.fullName || 'operator').split(' ')[0]}.</Typography><Typography>{content.subtitle}</Typography></Box>
		<Stack direction="row" spacing={1}><Button variant="outlined" component={Link} to="/audit-events">Audit izi</Button><Button variant="contained" endIcon={<ArrowForwardIcon />} component={Link} to="/reports">Növbəni aç</Button></Stack>
      </Box>

      <Box className="metrics-grid">{content.metrics.map((metric) => <Card className="metric-card" key={metric.label}><Box className="metric-icon" sx={{ backgroundColor: metric.color }}>{metric.icon}</Box><Typography>{metric.label}</Typography><strong>{metric.value}</strong><Box><span>{metric.delta}</span> {metric.detail}</Box></Card>)}</Box>

      <Box className="dashboard-grid">
        <Card className="performance-card">
          <Box className="card-heading"><Box><Typography component="h2">{content.title}</Typography><Typography>Son 12 həftənin əsas platform siqnalı</Typography></Box><Stack direction="row" spacing={1}><Chip label="12 həftə" variant="outlined" /><IconButton><MoreHorizIcon /></IconButton></Stack></Box>
		  <Box className="chart-summary"><strong>68.4K</strong><span><ArrowUpwardIcon /> 14.8%</span></Box>
          <Box className="bar-chart" aria-label="12 həftəlik performans qrafiki">{chartValues.map((value, index) => <Box key={index} className="bar-column"><span style={{ height: `${value}%` }} /><small>{index % 2 === 0 ? `${index + 1}h` : ''}</small></Box>)}</Box>
        </Card>
        <Card className="queue-card">
          <Box className="card-heading"><Box><Typography component="h2">Bu günün fokusları</Typography><Typography>Prioritetləşdirilmiş əməliyyat növbəsi</Typography></Box><Chip label="8 açıq" className="soft-warning" /></Box>
          {[{ label: 'Yüksək prioritetli şikayətlər', value: 6, progress: 72, color: '#FF8394', to: '/reports' }, { label: 'Ambassador müraciətləri', value: 14, progress: 54, color: '#FFD66B', to: '/ambassador-applications' }, { label: 'Publish gözləyən tədbirlər', value: 4, progress: 38, color: '#8EDBFF', to: '/events' }].map((item) => <Box className="queue-row" key={item.label} component={Link} to={item.to}><Box><span className="queue-dot" style={{ background: item.color }} /><Typography>{item.label}</Typography><strong>{item.value}</strong></Box><LinearProgress variant="determinate" value={item.progress} sx={{ '& .MuiLinearProgress-bar': { backgroundColor: item.color } }} /></Box>)}
          <Button endIcon={<ArrowForwardIcon />} fullWidth component={Link} to="/reports">Bütün növbəni göstər</Button>
        </Card>
      </Box>

      <Card className="activity-card"><Box className="card-heading"><Box><Typography component="h2">Son fəaliyyət</Typography><Typography>Platformada təhlükəsiz və izlənə bilən dəyişikliklər</Typography></Box><Button component={Link} to="/audit-events">Hamısına bax</Button></Box><Box className="activity-list">{activity.map((item) => <Box className="activity-row" key={`${item.name}-${item.time}`}><Avatar sx={{ bgcolor: item.color, color: '#17191F' }}>{item.initials}</Avatar><Box><Typography><strong>{item.name}</strong> {item.action}</Typography><span>{item.target}</span></Box><time>{item.time} əvvəl</time></Box>)}</Box></Card>
    </Box>
  )
}
