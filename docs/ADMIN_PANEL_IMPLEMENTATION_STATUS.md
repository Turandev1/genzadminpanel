# Admin panel implementation status

Bu sənəd `ADMIN_PANEL_MASTER_PLAN.md` üzrə hazır vertical slice-ı və açıq production işlərini ayırır.

## Tamamlanan hissələr

- React Admin starter tam əvəz edilib; responsive shell, light/dark theme və Azərbaycan dilli dizayn sistemi qurulub.
- Dörd rol üçün capability-driven menyu və fərqli dashboard yaradılıb.
- 18 idarəetmə resursu üçün registry, list/show/create/edit səthləri və route permission guard mövcuddur.
- Access token memory-only saxlanılır, refresh single-flight-dir, cookie request-lərində CSRF header dəstəyi var.
- Real envelope-aware provider və yalnız development build-də aktiv demo provider qurulub.
- Moderator, Ambassador, Admin və Superadmin məlumat arxitekturası UI-da əhatə olunub.
- Backend-də permission kataloqu, role mapping, admin session/MFA metadata, audit/outbox/idempotency, optimistic version və ambassador ledger migration-ları əlavə edilib.
- `/admin/auth/context`, scoped `/admin/clubs`, `/admin/events` və `/admin/audit-events` read API-ləri deny-by-default middleware ilə əlavə edilib.
- Klub detail/create/update/publish/archive endpoint-ləri object scope, strict DTO, `If-Match` optimistic concurrency və eyni transaction-da audit + outbox ilə əlavə edilib; paneldə create/edit/archive və publish əməliyyatları real API-yə bağlanıb.
- Legacy ambassador review route-dan Moderator çıxarılıb.
- Frontend unit testləri, lint/typecheck/build; backend test/vet qapıları yaşıl keçir.
- Desktop və 390px mobil render in-app browser ilə yoxlanılıb.
- `v1.1.0`: real `/admin/auth/login|refresh|logout` cookie kontraktı, exact-origin/CSRF, admin-session idle enforcement, random JWT JTI və refresh reuse revoke əlavə edilib.
- `v1.1.0`: dörd panel rolu üçün `/admin/me` profil redaktəsi və güclü şifrə dəyişikliyi UI/API axını əlavə edilib; dəyişikliklər transaction daxilində audit/outbox-a yazılır.
- `v1.1.0`: Superadmin permission context-i limitsiz `*` capability qaytarır və birdəfəlik production bootstrap command-i yaradılıb.
- `v1.1.0`: premium theme polish, account səhifəsi və sidebar collapse artefaktının tam həlli desktop/mobil brauzerdə doğrulanıb.

## Növbəti backend vertical slice

1. WebAuthn/TOTP enrollment, login challenge, recovery və fresh-MFA step-up.
2. Event create/update/publish/archive/cancel command-ləri; transaction daxilində audit + outbox. Klub lifecycle tamamlanıb.
3. Join-request, attendee və replay-safe check-in endpoint-ləri.
4. Ambassador campaign/referral/reward aggregate və own-scope endpoint-ləri.
5. Operations users/reports/jobs və Superadmin roles/sessions/settings/finance/backups command-ləri.
6. PostgreSQL integration test, tam authorization matrisi, Playwright E2E və Redis-backed distributed limiter.

Production rollout bu açıq hissələr tamamlanmadan edilməməlidir; development demo rejimi production build-də texniki olaraq deaktivdir.
