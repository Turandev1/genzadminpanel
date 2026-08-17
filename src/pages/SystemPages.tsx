import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import SearchOffOutlinedIcon from '@mui/icons-material/SearchOffOutlined'
import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

function StatePage({ denied }: { denied?: boolean }) {
  return <Box className="state-page">{denied ? <LockOutlinedIcon /> : <SearchOffOutlinedIcon />}<Typography component="h1">{denied ? 'Bu sahəyə girişiniz yoxdur' : 'Səhifə tapılmadı'}</Typography><Typography>{denied ? 'Bu əməliyyat üçün tələb olunan capability hesabınıza təyin edilməyib.' : 'Axtardığınız səhifə köçürülmüş və ya artıq mövcud olmaya bilər.'}</Typography><Button variant="contained" component={Link} to="/" startIcon={<ArrowBackIcon />}>İcmala qayıt</Button></Box>
}

export function AccessDenied() { return <StatePage denied /> }
export function NotFoundPage() { return <StatePage /> }
