# GEN Z Club Admin Control Room

React Admin 5 + React 19 + TypeScript/Vite əsasında capability-driven inzibatçı paneli.

## Lokal işə salma

```bash
cp .env.example .env.local
npm install
npm run dev
```

Development build default olaraq təhlükəsiz demo provider-dan istifadə edir. Giriş ekranında `Superadmin`, `Admin`, `Moderator` və `Ambassador` rolları arasında keçid etmək mümkündür. Demo rejimi `import.meta.env.DEV` ilə məhduddur və production build-də aktiv ola bilməz.

Real backend üçün:

```bash
VITE_ADMIN_DEMO_MODE=false npm run dev
```

## Yoxlama

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

## Arxitektura

- `src/auth`: memory-only access token, single-flight refresh və React Admin `authProvider`.
- `src/data`: envelope-aware HTTP client, typed resource registry, real/demo `dataProvider`.
- `src/layout`: capability-driven menyu və responsive shell.
- `src/pages`: rol əsaslı dashboard və sistem state-ləri.
- `src/resources`: permission guard-lı list/show/create/edit factory.
- `src/design-system`: light/dark token-lər və MUI theme.

Production API contract: `backend/docs/ADMIN_API.md`. Tam inkişaf proqramı: `docs/ADMIN_PANEL_MASTER_PLAN.md`.
