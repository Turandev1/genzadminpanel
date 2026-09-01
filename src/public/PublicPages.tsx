import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import Diversity3OutlinedIcon from "@mui/icons-material/Diversity3Outlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { type ChangeEvent, type FormEvent, useState } from "react";
import { portalAuth } from "../shared/portalHttp";

type PublicRoute = "/" | "/login" | "/register" | "/partner" | "/ambassador";
type PageProps = { onNavigate: (to: PublicRoute) => void };

function PublicHeader({ onNavigate }: PageProps) {
  return <Box component="header" className="public-header">
    <Button className="public-logo" onClick={() => onNavigate("/")} disableRipple>
      <span className="public-logo-mark">G</span><span>GEN Z</span>
    </Button>
    <Stack direction="row" spacing={1}>
      <Button color="inherit" onClick={() => onNavigate("/login")}>Giriş</Button>
      <Button variant="contained" onClick={() => onNavigate("/register")}>Partner ol</Button>
    </Stack>
  </Box>;
}

export function LandingPage({ onNavigate }: PageProps) {
  return <Box className="public-page public-landing">
    <Container maxWidth="lg"><PublicHeader onNavigate={onNavigate} />
      <Box className="public-hero">
        <Box className="public-hero-copy">
          <Typography className="public-eyebrow">YENİ NƏSİL İCMASI</Typography>
          <Typography component="h1">Gəncliyi bir araya gətirən <em>hərəkət.</em></Typography>
          <Typography className="public-lead">GEN Z Club insanları, ideyaları və yerli imkanları bir platformada birləşdirir. Tədbirlərdən imtiyazlara, icmadan real əlaqələrə.</Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} className="public-hero-actions">
            <Button size="large" variant="contained" endIcon={<ArrowForwardIcon />} onClick={() => onNavigate("/register")}>Şirkətini qoş</Button>
            <Button size="large" variant="outlined" onClick={() => onNavigate("/login")}>Hesaba daxil ol</Button>
          </Stack>
          <Box className="public-proof"><strong>10K+</strong><span>aktiv gənc</span><strong>100+</strong><span>lokal tərəfdaş</span></Box>
        </Box>
        <Box className="public-hero-art" aria-label="GEN Z Club community illustration">
          <Box className="orbit orbit-one" /><Box className="orbit orbit-two" />
          <Box className="hero-card card-one"><span>✦</span><strong>Yaradıcı ideyalar</strong></Box>
          <Box className="hero-card card-two"><span>↗</span><strong>Yeni imkanlar</strong></Box>
          <Box className="hero-glyph">G</Box>
        </Box>
      </Box>
      <Box className="public-value-grid">
        {[[<Diversity3OutlinedIcon />, "İcma", "Sənin maraqlarını bölüşən insanlarla tanış ol."], [<BusinessOutlinedIcon />, "Tərəfdaşlıq", "Brendini yeni nəsillə mənalı şəkildə tanış et."], [<PersonOutlinedIcon />, "İmkan", "Tədbirlər, üstünlüklər və şəxsi inkişaf bir yerdə."]].map(([icon, title, text]) => <Paper key={String(title)} className="public-value-card">{icon}<Typography variant="h6">{title}</Typography><Typography>{text}</Typography></Paper>)}
      </Box>
    </Container>
  </Box>;
}

export function PortalLoginPage({ onNavigate }: PageProps) {
  const [role, setRole] = useState<"admin" | "partner" | "ambassador">("partner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (role === "admin") {
      window.location.assign("/admin/login");
      return;
    }
    setPending(true); setError("");
    try {
      const context = await portalAuth.login(email, password);
      if (!context.principal_kinds.includes(role)) {
        await portalAuth.logout();
        throw new Error(role === "partner" ? "Bu hesab Partner kabinetinə aid deyil." : "Bu hesab Ambassador kabinetinə aid deyil.");
      }
      onNavigate(role === "partner" ? "/partner" : "/ambassador");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Giriş mümkün olmadı.");
    } finally { setPending(false); }
  };

  return <Box className="public-page public-auth-page"><Container maxWidth="sm"><PublicHeader onNavigate={onNavigate} />
    <Paper className="public-auth-card" component="form" onSubmit={submit}>
      <Typography className="public-eyebrow">HESABINA DAXİL OL</Typography><Typography component="h1">Xoş gəldin.</Typography>
      <Typography color="text.secondary">Rolunu seç və davam et.</Typography>
      <Tabs value={role} onChange={(_, value) => { setRole(value); setError(""); }} variant="fullWidth" className="role-tabs">
        <Tab value="admin" label="Admin" /><Tab value="partner" label="Partner" /><Tab value="ambassador" label="Ambassador" />
      </Tabs>
      {error && <Alert severity="error">{error}</Alert>}
      {role === "admin" ? <Box className="admin-login-note"><LockOutlinedIcon /><Typography>İnzibatçı və SuperAdmin hesabları qorunan idarəetmə girişindən istifadə edir.</Typography><Button type="submit" variant="contained" fullWidth>Admin girişinə keç</Button></Box> : <Stack spacing={2} sx={{ mt: 3 }}>
        <TextField label="E-poçt" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        <TextField label="Şifrə" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" />
        <Button type="submit" size="large" variant="contained" disabled={pending} endIcon={pending ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}>Daxil ol</Button>
      </Stack>}
      {role === "partner" && <Typography className="auth-footnote">Şirkətin yoxdur? <Button onClick={() => onNavigate("/register")}>Partner hesabı yarat</Button></Typography>}
    </Paper>
  </Container></Box>;
}

export function PartnerRegisterPage({ onNavigate }: PageProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ email: "", password: "", passwordRepeat: "", organization_name: "", owner_first_name: "", owner_last_name: "", contact_phone: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const update = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => setForm((current) => ({ ...current, [field]: event.target.value }));
  const next = () => {
    if (form.password !== form.passwordRepeat) return setError("Şifrələr eyni deyil.");
    setError(""); setStep(1);
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setPending(true); setError("");
    try {
      await portalAuth.registerPartnerOwner({ email: form.email, password: form.password, organization_name: form.organization_name, owner_first_name: form.owner_first_name, owner_last_name: form.owner_last_name, contact_phone: form.contact_phone });
      onNavigate("/partner");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Qeydiyyat tamamlanmadı."); }
    finally { setPending(false); }
  };
  return <Box className="public-page public-auth-page"><Container maxWidth="sm"><PublicHeader onNavigate={onNavigate} />
    <Paper className="public-auth-card" component="form" onSubmit={submit}>
      <Typography className="public-eyebrow">PARTNEROWNER QEYDİYYATI · {step + 1}/2</Typography><Typography component="h1">Şirkətini GEN Z-yə gətir.</Typography>
      <Typography color="text.secondary">{step === 0 ? "Əvvəl giriş məlumatlarını yaradaq." : "Şirkət və əlaqə məlumatlarını əlavə et."}</Typography>
      <Box className="step-progress"><span className={step >= 0 ? "active" : ""} /><span className={step >= 1 ? "active" : ""} /></Box>
      {error && <Alert severity="error">{error}</Alert>}
      {step === 0 ? <Stack spacing={2} sx={{ mt: 3 }}>
        <TextField label="E-poçt" type="email" value={form.email} onChange={update("email")} required autoComplete="email" />
        <TextField label="Şifrə" type="password" helperText="Ən azı 8 simvol, böyük və kiçik hərf." value={form.password} onChange={update("password")} required autoComplete="new-password" />
        <TextField label="Şifrəni təkrarla" type="password" value={form.passwordRepeat} onChange={update("passwordRepeat")} required autoComplete="new-password" />
        <Button type="button" size="large" variant="contained" onClick={next} endIcon={<ArrowForwardIcon />}>Davam et</Button>
      </Stack> : <Stack spacing={2} sx={{ mt: 3 }}>
        <TextField label="Şirkətin adı" value={form.organization_name} onChange={update("organization_name")} required />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Sahibin adı" value={form.owner_first_name} onChange={update("owner_first_name")} required /><TextField fullWidth label="Sahibin soyadı" value={form.owner_last_name} onChange={update("owner_last_name")} required /></Stack>
        <TextField label="Əlaqə nömrəsi" type="tel" value={form.contact_phone} onChange={update("contact_phone")} required autoComplete="tel" />
        <Stack direction="row" spacing={1.5}><Button type="button" onClick={() => setStep(0)}>Geri</Button><Button type="submit" size="large" variant="contained" fullWidth disabled={pending} endIcon={pending ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}>Kabineti yarat</Button></Stack>
      </Stack>}
      <Typography className="auth-footnote">E-poçt təsdiqi hazırda tələb olunmur. Qeydiyyatdan sonra birbaşa şirkət kabinetinə keçəcəksən.</Typography>
    </Paper>
  </Container></Box>;
}
