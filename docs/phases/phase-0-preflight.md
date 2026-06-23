# Phase 0 — Pre-flight

**Goal:** Every external dependency and account is ready so building is never blocked on procurement.  
**Next phase:** [Phase 1 — Foundation](./phase-1-foundation.md)  
**Companion docs:** [database-setup.md](../database-setup.md) · [architecture.md](../architecture.md)

---

## Prerequisites

- [x] GitHub repo created and `main` pushed
- [x] Product decisions signed off:
  - [x] Phone + password auth for launch
  - [x] Cash on Delivery only
  - [x] No admin portal, OTP, or online payments in v1

---

## Tasks

### Local development tools

- [x] `[INFRA]` Install **Node.js 24 LTS** — v24.14.0 (project standard is Node 24)
- [x] `[INFRA]` Install **pnpm** (`corepack enable` or global install) — v11.8.0
- [x] `[INFRA]` Install **Git** — v2.53.0
- [x] `[INFRA]` Install **Docker Desktop** (optional — for local Postgres) — v29.5.3
- [x] `[INFRA]` On Windows: note **VS Build Tools** may be needed for native `argon2` compile — `argon2` built & seed ran OK

### Accounts needed now

Create accounts and store credentials securely (password manager or host secret store — never commit):

- [x] `[INFRA]` **GitHub** — repo exists (`shirbhateisha-ui/QuickBasket`)

> Other third-party accounts are now created in the phase that first needs them, not here:
> **Expo / EAS** → Phase 1 · **Redis + Cloudflare R2** → Phase 2 · **Firebase / FCM** → Phase 4 ·
> **Sentry** (+ Apple Developer / Google Play) → Phase 5.

### Provision dev infrastructure

- [x] `[INFRA]` Start **dev PostgreSQL**: Docker container up on `localhost:5432`, schema migrated + seeded
- [x] `[INFRA]` Document connection strings in a local secrets file (not committed) — `apps/api/.env` (git-ignored)

> Dev **Redis** provisioning moved to [Phase 2](./phase-2-catalog.md) (first used for caching).

### Repository hygiene

- [x] `[INFRA]` Add `.nvmrc` with `24`
- [x] `[INFRA]` Add root `.gitignore`: `node_modules/`, `.env*`, `dist/`, `build/`, `.expo/`, `.turbo/`, `.claude/`

---

## End-Goal Checklist

Mark Phase 0 complete when **all** items are checked:

- [x] Node 24 + pnpm work on your machine (`node -v`, `pnpm -v`) — Node v24.14.0, pnpm v11.8.0
- [x] Dev Postgres is reachable (Docker running or hosted instance healthy)
- [x] GitHub repo exists; credentials stored outside the repo
- [x] `.nvmrc` and `.gitignore` are in place

---

## Quick reference — local Postgres via Docker

```bash
docker run --name quickbasket-db \
  -e POSTGRES_USER=quickbasket \
  -e POSTGRES_PASSWORD=quickbasket \
  -e POSTGRES_DB=quickbasket \
  -p 5432:5432 \
  -d postgres:16
```

Connection string:
```
postgresql://quickbasket:quickbasket@localhost:5432/quickbasket
```
