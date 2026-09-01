import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type FormEvent, useEffect, useState } from "react";
import {
  portalAuth,
  type PartnerContext,
  type PortalContext,
} from "../../shared/portalHttp";

export default function PartnerApp() {
  const [context, setContext] = useState<PortalContext | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [partnerContext, setPartnerContext] = useState<PartnerContext | null>(
    null,
  );
  const [membersCount, setMembersCount] = useState(0);
  const [members, setMembers] = useState<
    Array<{
      id: string;
      display_name: string;
      email: string;
      role: "owner" | "staff";
      status: string;
      version: number;
    }>
  >([]);
  const [offersCount, setOffersCount] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionMode, setDeletionMode] = useState<"admin_review" | "soft">(
    "admin_review",
  );
  const [restorePassword, setRestorePassword] = useState("");
  const [notice, setNotice] = useState("");

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      const next = await portalAuth.login(email, password);
      if (!next.principal_kinds.includes("partner")) {
        await portalAuth.logout();
        throw new Error("Bu hesab Partner kabinetinə aid deyil");
      }
      setContext(next);
      await selectOrganization(next.available_organizations[0]?.id || "");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Giriş mümkün olmadı",
      );
    }
  };

  const selectOrganization = async (organizationId: string) => {
    if (!organizationId) return;
    const [nextContext, members, offers] = await Promise.all([
      portalAuth.partnerContext(organizationId),
      portalAuth.partnerMembers(organizationId),
      portalAuth.partnerOffers(organizationId),
    ]);
    setSelectedOrganization(organizationId);
    setPartnerContext(nextContext);
    setMembersCount(members.length);
    setMembers(members);
    setOffersCount(offers.length);
  };

  useEffect(() => {
    const resumePortal = async () => {
      try {
        const next = await portalAuth.context();
        if (next?.principal_kinds.includes("partner")) {
          setContext(next);
          await selectOrganization(next.available_organizations[0]?.id || "");
        }
      } catch {
        // A fresh page load has no in-memory portal token; the login form stays visible.
      }
    };
    void resumePortal();
  }, []);

  const manageStaff = async (
    member: { id: string; display_name: string; version: number },
    mode: "soft" | "hard",
  ) => {
    if (
      !selectedOrganization ||
      !window.confirm(`${member.display_name} üçün əməliyyat təsdiqlənsin?`)
    )
      return;
    try {
      await portalAuth.deletePartnerMember(selectedOrganization, member.id, {
        mode,
        reason: "Owner managed staff access",
        version: member.version,
      });
      setNotice("Staff access yeniləndi.");
      await selectOrganization(selectedOrganization);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Staff əməliyyatı mümkün olmadı",
      );
    }
  };
  const transferOwnership = async (membershipId: string) => {
    if (!selectedOrganization || !window.confirm("Owner rolu köçürülsün?"))
      return;
    try {
      await portalAuth.transferPartnerOwnership(selectedOrganization, {
        membership_id: membershipId,
        reason: "Owner initiated transfer",
      });
      await selectOrganization(selectedOrganization);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Owner transfer mümkün olmadı",
      );
    }
  };

  const requestDeletion = async () => {
    if (!selectedOrganization) return;
    try {
      const result = await portalAuth.requestPartnerDeletion(
        selectedOrganization,
        { mode: deletionMode, reason: deletionReason, confirmation: "DELETE" },
      );
      setNotice(
        result.status === "admin_review"
          ? "Silinmə sorğusu admin yoxlamasına göndərildi."
          : "Organization 30 günlüyə deaktiv edildi.",
      );
      await selectOrganization(selectedOrganization);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sorğu tamamlanmadı");
    }
  };

  const restoreOrganization = async () => {
    if (!selectedOrganization) return;
    try {
      await portalAuth.restorePartnerOrganization(selectedOrganization, {
        current_password: restorePassword,
        confirmation: "RESTORE",
      });
      setNotice("Organization bərpa edildi.");
      setRestorePassword("");
      await selectOrganization(selectedOrganization);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Bərpa mümkün olmadı",
      );
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#eef7f4", p: { xs: 2, md: 6 } }}>
      <Paper
        sx={{ maxWidth: 760, mx: "auto", p: { xs: 3, md: 5 }, borderRadius: 5 }}
      >
        <Typography variant="overline">GEN Z Club Business</Typography>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Partner kabineti
        </Typography>
        {context ? (
          <Stack spacing={2}>
            <Typography variant="h5">
              Salam, {context.identity.display_name}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {notice && <Alert severity="success">{notice}</Alert>}
            <TextField
              select
              label="Organization"
              value={selectedOrganization}
              onChange={(event) => void selectOrganization(event.target.value)}
            >
              {context.available_organizations.map((organization) => (
                <MenuItem key={organization.id} value={organization.id}>
                  {organization.name}
                </MenuItem>
              ))}
            </TextField>
            <Typography>
              Rol: <strong>{partnerContext?.organization.role}</strong>
            </Typography>
            <Typography>
              Aktiv üzvlər: {membersCount} · Offer-lər: {offersCount}
            </Typography>
            <Typography variant="body2">
              İcazələr: {partnerContext?.permissions.join(", ")}
            </Typography>
            {partnerContext?.organization.role === "owner" &&
            partnerContext.organization.status === "active" ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1">Staff idarəetməsi</Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {members
                    .filter((member) => member.role === "staff")
                    .map((member) => (
                      <Stack
                        key={member.id}
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                      >
                        <Typography sx={{ flex: 1 }}>
                          {member.display_name} · {member.status}
                        </Typography>
                        <Button
                          size="small"
                          onClick={() => void transferOwnership(member.id)}
                        >
                          Owner et
                        </Button>
                        <Button
                          size="small"
                          onClick={() => void manageStaff(member, "soft")}
                        >
                          Deaktiv et
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => void manageStaff(member, "hard")}
                        >
                          Sil
                        </Button>
                      </Stack>
                    ))}
                </Stack>
              </Paper>
            ) : null}
            {partnerContext?.organization.status === "pending_deletion" ? (
              <Alert severity="warning">
                Organization deaktivdir. Bərpa müddəti bitməzdən əvvəl yalnız
                Owner bərpa edə bilər.
              </Alert>
            ) : null}
            {partnerContext?.organization.role === "owner" &&
            partnerContext?.organization.status === "active" ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1">
                  Organization silinməsi
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <TextField
                    select
                    label="Silinmə üsulu"
                    value={deletionMode}
                    onChange={(event) =>
                      setDeletionMode(
                        event.target.value as "admin_review" | "soft",
                      )
                    }
                  >
                    <MenuItem value="admin_review">Admin yoxlaması</MenuItem>
                    <MenuItem value="soft">30 günlük deaktivasiya</MenuItem>
                  </TextField>
                  <TextField
                    label="Səbəb"
                    value={deletionReason}
                    onChange={(event) => setDeletionReason(event.target.value)}
                    required
                    slotProps={{ htmlInput: { maxLength: 500 } }}
                  />
                  <Button
                    color="error"
                    variant="outlined"
                    disabled={deletionReason.trim().length < 3}
                    onClick={() => void requestDeletion()}
                  >
                    DELETE ilə silinmə sorğusu göndər
                  </Button>
                </Stack>
              </Paper>
            ) : null}
            {partnerContext?.organization.role === "owner" &&
            partnerContext?.organization.status === "pending_deletion" ? (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1">
                  Organization-u bərpa et
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ mt: 1 }}
                >
                  <TextField
                    type="password"
                    label="Cari şifrə"
                    value={restorePassword}
                    onChange={(event) => setRestorePassword(event.target.value)}
                  />
                  <Button
                    variant="contained"
                    disabled={!restorePassword}
                    onClick={() => void restoreOrganization()}
                  >
                    RESTORE ilə bərpa et
                  </Button>
                </Stack>
              </Paper>
            ) : null}
            <Button
              onClick={async () => {
                await portalAuth.logout();
                setContext(null);
              }}
            >
              Çıxış
            </Button>
          </Stack>
        ) : (
          <Stack component="form" spacing={2} onSubmit={login}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="E-poçt"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Şifrə"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" variant="contained">
              Daxil ol
            </Button>
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
