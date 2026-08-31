import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { apiRequest } from '../data/httpClient'

type Enrollment = { secret: string; otpauth_url: string }

export function MFAEnrollment() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [code, setCode] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest<Enrollment>('/admin/mfa/enroll', { method: 'POST' })
      .then(setEnrollment)
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'MFA enrollment başlatmaq mümkün olmadı'))
  }, [])

  const confirm = async () => {
    setError('')
    try {
      const result = await apiRequest<{ recovery_codes: string[] }>('/admin/mfa/confirm', { method: 'POST', body: { code } })
      setRecoveryCodes(result.recovery_codes)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Kod təsdiqlənmədi')
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h4">İki mərhələli doğrulama</Typography>
          <Typography>Authenticator tətbiqində yeni TOTP hesabı yaradın və aşağıdakı secret-i daxil edin.</Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {recoveryCodes.length ? (
            <>
              <Alert severity="success">MFA aktivdir. Bu recovery kodlarını təhlükəsiz yerdə bir dəfə saxlayın.</Alert>
              <Box component="pre" sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>{recoveryCodes.join('\n')}</Box>
              <Button variant="contained" href="/internal">Davam et</Button>
            </>
          ) : (
            <>
              <TextField label="TOTP secret" value={enrollment?.secret || ''} slotProps={{ htmlInput: { readOnly: true } }} />
              <TextField label="6 rəqəmli kod" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
              <Button variant="contained" disabled={!enrollment || code.length !== 6} onClick={confirm}>MFA-nı aktiv et</Button>
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  )
}
