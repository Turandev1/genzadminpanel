import { Alert, Box, Button, Chip, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { type FormEvent, useEffect, useState } from 'react'
import { portalAuth, type AmbassadorContext, type AmbassadorMetrics, type AmbassadorReferral, type AmbassadorReward, type PortalContext } from '../../shared/portalHttp'

export default function AmbassadorApp() {
  const [context, setContext] = useState<PortalContext | null>(null)
  const [ambassador, setAmbassador] = useState<AmbassadorContext | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [metrics, setMetrics] = useState<AmbassadorMetrics | null>(null)
  const [rewards, setRewards] = useState<AmbassadorReward[]>([])
  const [referrals, setReferrals] = useState<AmbassadorReferral[]>([])

  useEffect(() => {
    const resumePortal = async () => {
      try {
        const next = await portalAuth.context()
        if (!next?.principal_kinds.includes('ambassador')) return
        const [ambassadorContext, nextMetrics, nextRewards, nextReferrals] = await Promise.all([portalAuth.ambassadorContext(), portalAuth.ambassadorMetrics(), portalAuth.ambassadorRewards(), portalAuth.ambassadorReferrals()])
        setContext(next)
        setAmbassador(ambassadorContext)
        setMetrics(nextMetrics)
        setRewards(nextRewards.items)
        setReferrals(nextReferrals.items)
      } catch {
        // A fresh page load has no in-memory portal token; the login form stays visible.
      }
    }
    void resumePortal()
  }, [])

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      const next = await portalAuth.login(email, password)
	  if (!next.principal_kinds.includes('ambassador')) {
		await portalAuth.logout()
		throw new Error('Bu hesab Ambassador kabinetinə aid deyil')
	  }
	  const [ambassadorContext, nextMetrics, nextRewards, nextReferrals] = await Promise.all([portalAuth.ambassadorContext(), portalAuth.ambassadorMetrics(), portalAuth.ambassadorRewards(), portalAuth.ambassadorReferrals()])
      setContext(next)
	  setAmbassador(ambassadorContext)
	  setMetrics(nextMetrics)
	  setRewards(nextRewards.items)
	  setReferrals(nextReferrals.items)
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
            {metrics && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {[['Captured', metrics.captured], ['Pending', metrics.pending], ['Qualified', metrics.qualified], ['Rejected', metrics.rejected], ['Reversed', metrics.reversed], ['Review hold', metrics.review_queue]].map(([label, value]) => <Paper variant="outlined" sx={{ p: 2 }} key={String(label)}><Typography variant="caption">{label}</Typography><Typography variant="h5">{value}</Typography></Paper>)}
              <Paper variant="outlined" sx={{ p: 2, gridColumn: { xs: 'span 2', md: 'span 2' } }}><Typography variant="caption">Təsdiqlənmiş reward</Typography><Typography variant="h5">{new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(metrics.reward_amount_minor / 100)}</Typography></Paper>
            </Box>}
            <Divider />
            <Typography variant="h6">Son referral-lar</Typography>
            {referrals.length ? referrals.map((item) => <Stack key={item.id} direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between' }}><Typography>{item.masked_name} · {item.masked_email}</Typography><Chip size="small" label={item.status} /></Stack>) : <Typography color="text.secondary">Referral hələ yoxdur.</Typography>}
            <Divider />
            <Typography variant="h6">Reward ledger</Typography>
            {rewards.length ? rewards.map((item) => <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between' }}><Typography>{item.reference} · {item.entry_type}</Typography><Typography>{new Intl.NumberFormat('az-AZ', { style: 'currency', currency: item.currency }).format(item.amount_minor / 100)} · {item.status}</Typography></Stack>) : <Typography color="text.secondary">Reward əməliyyatı hələ yoxdur.</Typography>}
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
