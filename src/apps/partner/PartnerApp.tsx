import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { type FormEvent, useState } from 'react'
import { portalAuth, type PartnerContext, type PortalContext } from '../../shared/portalHttp'

export default function PartnerApp() {
  const [context, setContext] = useState<PortalContext | null>(null)
	const [selectedOrganization, setSelectedOrganization] = useState('')
	const [partnerContext, setPartnerContext] = useState<PartnerContext | null>(null)
	const [membersCount, setMembersCount] = useState(0)
	const [offersCount, setOffersCount] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const login = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      const next = await portalAuth.login(email, password)
	  if (!next.principal_kinds.includes('partner')) {
		await portalAuth.logout()
		throw new Error('Bu hesab Partner kabinetinə aid deyil')
	  }
      setContext(next)
	  await selectOrganization(next.available_organizations[0]?.id || '')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Giriş mümkün olmadı')
    }
  }

	const selectOrganization = async (organizationId: string) => {
	  if (!organizationId) return
	  const [nextContext, members, offers] = await Promise.all([
		portalAuth.partnerContext(organizationId), portalAuth.partnerMembers(organizationId), portalAuth.partnerOffers(organizationId),
	  ])
	  setSelectedOrganization(organizationId)
	  setPartnerContext(nextContext)
	  setMembersCount(members.length)
	  setOffersCount(offers.length)
	}

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#eef7f4', p: { xs: 2, md: 6 } }}>
      <Paper sx={{ maxWidth: 760, mx: 'auto', p: { xs: 3, md: 5 }, borderRadius: 5 }}>
        <Typography variant="overline">GEN Z Club Business</Typography>
        <Typography variant="h3" sx={{ mb: 2 }}>Partner kabineti</Typography>
        {context ? (
          <Stack spacing={2}>
            <Typography variant="h5">Salam, {context.identity.display_name}</Typography>
			<TextField select label="Organization" value={selectedOrganization} onChange={(event) => void selectOrganization(event.target.value)}>
			  {context.available_organizations.map((organization) => <MenuItem key={organization.id} value={organization.id}>{organization.name}</MenuItem>)}
			</TextField>
			<Typography>Rol: <strong>{partnerContext?.organization.role}</strong></Typography>
			<Typography>Aktiv üzvlər: {membersCount} · Offer-lər: {offersCount}</Typography>
			<Typography variant="body2">İcazələr: {partnerContext?.permissions.join(', ')}</Typography>
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
