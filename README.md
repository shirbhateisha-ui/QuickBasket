# QuickBasket

A single-store grocery app — **iOS · Android · Web** from one React Native (Expo) codebase, with a
custom **Node.js + Fastify + Prisma/PostgreSQL** backend. Phone + password auth, Cash on Delivery.

- **Docs:** [requirements](docs/requirements.md) · [architecture](docs/architecture.md) · [execution plan](docs/execution-plan.md) · [database design](docs/database-design.md) · [database setup](docs/database-setup.md)
- **Phase checklists:** [docs/phases/](docs/phases/)

> **Status:** Phase 1 in progress. The monorepo, shared packages, and the **API (auth)** are done and
> verified. The mobile app currently lives at [`QuickBasket/`](QuickBasket/) and is pending migration
> into `apps/mobile/` (Phase 1, Stage 2).

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | 24 LTS | see [`.nvmrc`](.nvmrc) |
| **pnpm** | 11+ | `corepack enable && corepack prepare pnpm@latest --activate` |
| **Docker Desktop** | any recent | for local PostgreSQL (or use a hosted Postgres) |
| **Git** | any | |

---

## Repository layout

```
quickbasket/
├── apps/
│   └── api/          ← Fastify + Prisma backend  (✅ runnable)
├── packages/
│   ├── types/        ← shared TypeScript contracts
│   ├── utils/        ← formatPrice, slugify, dateHelpers
│   ├── store/        ← Redux Toolkit (authSlice)
│   └── ui/           ← shared UI components (placeholder)
├── QuickBasket/      ← Expo mobile app (to be moved to apps/mobile)
├── docs/             ← all project docs
├── turbo.json · pnpm-workspace.yaml · tsconfig.base.json
```

---

## 1. Start PostgreSQL (local, via Docker)

```bash
docker run --name quickbasket-db \
  -e POSTGRES_USER=quickbasket \
  -e POSTGRES_PASSWORD=quickbasket \
  -e POSTGRES_DB=quickbasket \
  -p 5432:5432 -d postgres:16
```

Already created it once? Just start it: `docker start quickbasket-db`.
(Prefer a hosted DB? Skip this and use its connection string in step 3.)

---

## 2. Install dependencies (root)

From the repo root:

```bash
pnpm install
```

This installs the API and all shared packages. If pnpm reports **"Ignored build scripts"**, run
`pnpm approve-builds` once (select all) — the allowlist is already in `pnpm-workspace.yaml`.

---

## 3. Configure API environment

```bash
cd apps/api
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env
```

Edit `apps/api/.env` if your Postgres differs from the Docker default. Required keys:
`DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (≥16 chars each).

---

## 4. Create tables & seed data

From `apps/api`:

```bash
pnpm db:migrate --name init   # create schema
pnpm db:seed                  # 6 categories, 100+ products, users, coupons, slots, delivery config
pnpm db:studio                # optional: browse data at http://localhost:5555
```

---

## 5. Run the API

From the repo root:

```bash
pnpm api            # = pnpm --filter @quickbasket/api dev  (tsx watch, port 3000)
```

Verify:

```bash
curl http://localhost:3000/health      # {"status":"ok","db":"ok"}
```

### Auth endpoints

| Method | Route | Body |
|--------|-------|------|
| POST | `/auth/register` | `{ phone, name, password }` |
| POST | `/auth/login` | `{ phone, password }` |
| POST | `/auth/refresh` | `{ refreshToken }` |
| POST | `/auth/logout` | `{ refreshToken }` |
| GET  | `/auth/me` | — (Bearer access token) |

Quick login test (seeded user):

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"9999900001","password":"Password@123"}'
```

### Catalog endpoints (Phase 2)

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/categories` | active categories, sorted |
| GET | `/products` | `?categoryId=&search=&featured=true&page=1&limit=20` (paginated) |
| GET | `/products/:id` | single product with category |

> **Caching is optional.** If `REDIS_URL` is set (local Redis: `docker run --name quickbasket-redis -p 6379:6379 -d redis:7`), `/categories` and `/products` are cache-aside in Redis. Without it, the API runs fine and just skips caching.

---

## 6. Run the mobile app

> The mobile app is currently the Expo starter at [`QuickBasket/`](QuickBasket/) (npm-based) and has
> **not yet** been wired to the API — that lands in Phase 1, Stage 2. To run it as-is:

```bash
cd QuickBasket
npm install
npm run web        # or: npm run android  /  npm run ios
```

After Stage 2 (move to `apps/mobile/` + pnpm), it will run from the root via `pnpm mobile`.
Point the app at the API with your machine's LAN IP (e.g. `http://192.168.x.x:3000`) so devices/emulators can reach it.

---

## Seeded test accounts

| Role | Phone | Password |
|------|-------|----------|
| Customer | `9999900001` | `Password@123` |
| Staff | `9999900002` | `Password@123` |

---

## Useful scripts (root)

| Command | Does |
|---------|------|
| `pnpm api` | run the API (dev, watch) |
| `pnpm dev` | run all workspace `dev` tasks via Turbo |
| `pnpm build` | build all packages |
| `pnpm typecheck` | type-check the workspace |
| `pnpm format` | Prettier write |

API-specific (run from `apps/api`): `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:reset`, `pnpm db:studio`.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `Can't reach database server` | Is `quickbasket-db` running? `docker ps`. Check `DATABASE_URL`. |
| `Invalid environment variables` on API start | Fill `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (≥16 chars) in `apps/api/.env`. |
| pnpm "Ignored build scripts" | `pnpm approve-builds` (select all) — needed for Prisma engines + argon2. |
| `argon2` build error (Windows) | Usually uses a prebuilt binary; if not, install VS Build Tools or switch to `@node-rs/argon2`. |
| Seed runs but no rows | Ensure `"prisma": { "seed": "tsx prisma/seed.ts" }` is in `apps/api/package.json`. |

More detail: [docs/database-setup.md](docs/database-setup.md).
