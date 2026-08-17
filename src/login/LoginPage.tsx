import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import { Alert, Box, Button, Chip, CircularProgress, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import { type FormEvent, useState } from 'react'
import { useLogin } from 'react-admin'
import { runtimeConfig } from '../app/runtimeConfig'

const demoUsers = [
  { role: 'Superadmin', email: 'superadmin@genz.club' }, { role: 'Admin', email: 'admin@genz.club' },
  { role: 'Moderator', email: 'moderator@genz.club' }, { role: 'Ambassador', email: 'ambassador@genz.club' },
]

export function LoginPage() {
  const login = useLogin()
  const [email, setEmail] = useState('admin@genz.club')
  const [password, setPassword] = useState('admin-demo')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaStage, setMfaStage] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError('')
    try {
      await login({ email, password, mfaCode: mfaStage ? mfaCode : undefined })
    } catch (caught) {
      if (caught instanceof Error && caught.message === 'MFA_CHALLENGE') setMfaStage(true)
      else setError(caught instanceof Error ? caught.message : 'Giriş mümkün olmadı')
    } finally { setPending(false) }
  }

  return (
    <Box className="login-shell">
      <Box className="login-story">
        <Box className="login-brand"><Box className="brand-mark brand-mark-large"><span>G</span></Box><span>GEN Z CLUB</span></Box>
        <Box className="login-story-copy">
          <Chip label="ADMIN CONTROL ROOM" className="eyebrow-chip" />
          <Typography component="h1">Community-ni<br /><em>aydınlıqla</em> idarə et.</Typography>
          <Typography>Klublar, tədbirlər, ambassador proqramı və əməliyyatlar — bir təhlükəsiz səthdə.</Typography>
        </Box>
        <Box className="login-signal-card">
          <Box><span className="signal-dot" /><Typography>Platform statusu</Typography></Box><strong>99.98%</strong><span>Son 30 gün uptime</span>
        </Box>
      </Box>
      <Box className="login-panel">
        <Box component="form" onSubmit={submit} className="login-form">
          <Box className="mobile-login-brand"><Box className="brand-mark"><span>G</span></Box><strong>GEN Z CLUB</strong></Box>
          <Typography className="login-kicker">İdarəetmə paneli</Typography>
          <Typography component="h2">Xoş gəldiniz</Typography>
          <Typography className="login-description">{mfaStage ? 'Authenticator tətbiqindəki 6 rəqəmli kodu daxil edin.' : 'Davam etmək üçün iş hesabınızla daxil olun.'}</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {!mfaStage ? <>
            <TextField label="E-poçt" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start"><AlternateEmailIcon /></InputAdornment> } }} />
            <TextField label="Şifrə" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required fullWidth slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment> } }} />
          </> : <TextField label="MFA kodu" value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required fullWidth autoFocus slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]{6}' }, input: { startAdornment: <InputAdornment position="start"><SecurityOutlinedIcon /></InputAdornment> } }} />}
          <Button type="submit" variant="contained" size="large" endIcon={pending ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />} disabled={pending}>{mfaStage ? 'Təsdiqlə' : 'Təhlükəsiz giriş'}</Button>
          <Box className="security-note"><SecurityOutlinedIcon /><span>Access token yalnız yaddaşda saxlanılır. Sessiya HttpOnly cookie, exact-origin və CSRF nəzarəti ilə qorunur.</span></Box>
          {runtimeConfig.demoMode && <Box className="demo-roles"><Typography>Demo rol seçimi</Typography><Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap' }}>{demoUsers.map((item) => <Chip key={item.role} label={item.role} clickable variant={email === item.email ? 'filled' : 'outlined'} onClick={() => setEmail(item.email)} />)}</Stack></Box>}
        </Box>
      </Box>
    </Box>
  )
}
