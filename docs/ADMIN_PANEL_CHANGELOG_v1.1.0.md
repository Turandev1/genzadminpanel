# GEN Z Club Admin Panel — v1.1.0

**Buraxılış tarixi:** 17 avqust 2026  
**Əhatə:** təhlükəsiz admin sessiyası, dörd rol üçün hesab əməliyyatları, Superadmin bootstrap və UI/UX polish

## Qısa nəticə

Bu versiya admin frontend ilə backend arasındakı işləməyən auth kontraktını bağlayır, adi mobil session token-inin admin səthinə girişini dayandırır, bütün panel rolları üçün real hesab redaktəsi/şifrə dəyişikliyi yaradır və Superadmin-i server/UI səviyyəsində limitsiz capability kimi modelləşdirir. Sidebar collapse artefaktı aradan qaldırılıb və yeni premium vizual token-lər tətbiq edilib.

## Backend və təhlükəsizlik

### Admin browser sessiyası

- `backend/internal/api/admin_handlers.go`
  - `POST /api/v1/admin/auth/login|refresh|logout` endpoint-ləri əlavə edildi.
  - Refresh credential yalnız `HttpOnly`, `SameSite=Strict` cookie-də saxlanılır; production-da `Secure` və `__Host-` prefiksi aktivdir.
  - Refresh response body-dən refresh token çıxarılır; access token qısaömürlü olaraq frontend memory store-a verilir.
- `backend/internal/api/admin_middleware.go`
  - Refresh/logout üçün exact-origin allowlist əlavə edildi.
  - Birdəfəlik ilkin şifrə dəyişdirilənədək hesab yalnız context və account endpoint-lərinə buraxılır.
- `backend/internal/repos/admin.go`
  - Admin request-i üçün aktiv `admin_sessions` sətri və idle timeout məcburidir; adi mobil session artıq panel principal sayılmır.
  - Admin/Superadmin üçün 15 dəqiqə, Moderator/Ambassador üçün 30 dəqiqə sliding idle timeout tətbiq edildi.
- `backend/internal/security/security.go`, `backend/internal/repos/users.go`
  - Access/refresh JWT-lərə random `jti`, issuer və `nbf` əlavə edildi.
  - Rotasiya olunmuş refresh token təkrar istifadə ediləndə session family revoke edilir.
- `backend/internal/config/config.go`
  - Production CORS, HTTPS origin, ayrı və minimum 32 simvolluq JWT secret-lər, 5–10 dəqiqə access TTL və real webhook secret startup zamanı fail-fast yoxlanır.

### Hesab əməliyyatları

- `backend/internal/models/admin.go`
  - Təhlükəsiz self-service DTO-lar əlavə edildi; rol, MFA, payout və digər privileged sahələr update DTO-ya daxil deyil.
- `backend/internal/services/admin.go`
  - Ad/e-poçt/username normalizasiyası, allowlist simvol yoxlaması və şifrə gücü siyasəti əlavə edildi.
  - Yeni şifrə 12–128 simvol, böyük/kiçik hərf, rəqəm və xüsusi işarə tələb edir.
- `backend/internal/repos/admin.go`
  - Profil dəyişikliyi və şifrə dəyişikliyi audit + outbox ilə eyni transaction-da yazılır.
  - Şifrə dəyişəndə cari cihazdan başqa bütün sessiyalar revoke edilir.
- `backend/internal/api/router.go`
  - `GET/PATCH /api/v1/admin/me` və `POST /api/v1/admin/me/password` route-ları bütün dörd panel rolu üçün əlavə edildi.

### Superadmin credential refresh

- `backend/internal/repos/admin.go`
  - Superadmin context-i `permissions: ["*"]` qaytarır; yeni permission əlavə edildikdə ayrıca mapping gözləmədən backend bypass ilə uyğun qalır.
- `backend/migrations/000014_admin_account_security.sql`
  - `must_change_password` və self-account permission-ları əlavə edildi.
- `backend/cmd/refresh-superadmin/main.go`
  - Advisory lock + serializable transaction ilə mövcud superadmin hesablarını atomik şəkildə əvəz edən production command yaradıldı.
  - Plaintext şifrə source/SQL/binary daxilində saxlanılmır; yalnız runtime secret-dən oxunur və DB-yə bcrypt hash yazılır.
  - `REFRESH_SUPERADMIN=true` olmadan command fail-closed davranır.
  - Hesab ilk girişdə şifrəni dəyişməyə məcburdur və yaradılma audit event-i yazılır.
- `backend/Makefile`
  - `refresh-superadmin` target-i əlavə edildi.

İlkin production icrası:

```bash
cd backend
REFRESH_SUPERADMIN=true \
SUPERADMIN_EMAIL='owner@example.com' \
SUPERADMIN_PASSWORD='StrongPassword123!' \
DATABASE_URL='postgres://…' \
make refresh-superadmin
```

Yaranan superadmin hesabı:

- Email: `SUPERADMIN_EMAIL` env dəyişənindən gəlir.
- İlkin şifrə: `SUPERADMIN_PASSWORD` env dəyişənindən gəlir.

İcradan dərhal sonra şifrə paneldən dəyişdirilməli və `REFRESH_SUPERADMIN`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD` secret manager-dən silinməlidir. Command bütün mövcud superadmin hesablarını əvəz edir.

## Frontend və UI/UX

- `admin/src/pages/AccountSettings.tsx`
  - Superadmin, Admin, Moderator və Ambassador üçün ortaq “Hesab əməliyyatları” səhifəsi yaradıldı.
  - “Hesaba düzəliş et” və “Şifrəni dəyiş” formaları real API-yə bağlandı.
  - İlk şifrə warning-i, rol badge-ləri, digər sessiyaların revoke xəbərdarlığı və responsive iki-card layout əlavə edildi.
- `admin/src/layout/AppMenu.tsx`, `admin/src/layout/AppLayout.tsx`
  - Hesab səhifəsi sidebar və profile menyusuna əlavə edildi.
  - İlkin şifrə dəyişdirilməlidirsə client proaktiv olaraq account səhifəsinə yönləndirir; backend yenə son qərarı verir.
- `admin/src/App.css`
  - Sidebar `240px → 55px` keçidi smooth edildi; fixed element width/padding sinxronlaşdırıldı, dar vəziyyətdə label artefaktı tam gizlədildi və horizontal overflow aradan qaldırıldı.
  - Account səhifəsi və mobil drawer üçün responsive polish əlavə edildi.
- `admin/src/design-system/theme.ts`
  - Daha dərin midnight səthlər, yumşaq premium accent, daha balanslı border/shadow/radius token-ləri və uyğun dark palette tətbiq edildi.
- `admin/src/resources/ResourcePages.tsx`
  - Edit düymələri yalnız real write permission olduqda görünür; read-only resurslarda qırıq edit route-u artıq təqdim edilmir.
- `admin/package.json`, `admin/package-lock.json`
  - Versiya `1.1.0` edildi.

## Doğrulama

- Admin: `npm run lint`, `npm run build`, `npm run test:unit` — yaşıl (`3` test faylı, `7` test).
- Backend: `go test ./...`, `go vet ./...`, `go build ./...` — yaşıl.
- Yeni security unit testləri:
  - bootstrap email/account normalization;
  - güclü şifrə matrisi;
  - eyni saniyədə refresh token unikallığı və hardened claims.
- Browser visual QA:
  - desktop dashboard və account səhifəsi;
  - sidebar expanded/collapsed (`55px`, horizontal overflow yoxdur, label-lar gizlidir);
  - `390 × 844` mobil account layout və `240px` temporary drawer.

## Production deployment qeydi

Migration `000014_admin_account_security.sql` API rollout-dan əvvəl tətbiq edilməlidir. Production startup yeni secret/CORS/TTL tələblərindən biri ödənmirsə qəsdən dayanacaq. WebAuthn/TOTP məcburi MFA, Redis-backed distributed limiter və master planın hələ endpoint-i olmayan operations/growth/system modulları tamamlanmadan bütün master plan üzrə ümumi production sign-off verilməməlidir.
