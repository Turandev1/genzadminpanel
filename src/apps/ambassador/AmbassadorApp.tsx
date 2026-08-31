import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { type FormEvent, useState } from 'react'
import { portalAuth, type AmbassadorContext, type PortalContext } from '../../shared/portalHttp'

export default function AmbassadorApp() {
  const [context, setContext] = useState<PortalContext | null>(null)
  const [ambassador, setAmbassador] = useState<AmbassadorContext | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      const next = await portalAuth.login(email, password)
	  if (!next.principal_kinds.includes('ambassador')) {
		await portalAuth.logout()
		throw new Error('Bu hesab Ambassador kabinetinə aid deyil')
	  }
	  const ambassadorContext = await portalAuth.ambassadorContext()
      setContext(next)
	  setAmbassador(ambassadorContext)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Giriş mümkün olmadı')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f6f2ff', p: { xs: 2, md: 6 } }}>
      <Paper sx={{ maxWidth: 760, mx: 'auto', p: { xs: 3, md: 5 }, borderRadius: 5 }}>
        <Typography variant="overline">GEN Z Club</Typography>
        <Typography variant="h3" sx={{ mb: 2 }}>Ambassador kabineti</Typography>
        {context ? (
          <Stack spacing={2}>
            <Typography variant="h5">Salam, {context.identity.display_name}</Typography>
			<Typography>Status: {ambassador?.status}</Typography>
			<Typography>Referral kodu: <strong>{ambassador?.referral_code}</strong></Typography>
			<Typography>Public ID: {ambassador?.public_id}</Typography>
            <Button onClick={async () => { await portalAuth.logout(); setContext(null) }}>Çıxış</Button>
          </Stack>
        ) : (
          <Stack component="form" spacing={2} onSubmit={login}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="E-poçt" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <TextField label="Şifrə" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" variant="contained">Daxil ol</Button>
          </Stack>
        )}
      </Paper>
    </Box>
  )
}
