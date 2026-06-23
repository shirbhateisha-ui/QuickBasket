# Phase 1 — Foundation

**Goal:** Runnable end-to-end skeleton with phone + password auth on iOS, Android, and Web.  
**Previous:** [Phase 0 — Pre-flight](./phase-0-preflight.md)  
**Next:** [Phase 2 — Catalog](./phase-2-catalog.md)  
**Companion docs:** [database-setup.md](../database-setup.md) · [architecture.md](../architecture.md) · [database-design.md](../database-design.md)

---

## Prerequisites

- [ ] [Phase 0 End-Goal Checklist](./phase-0-preflight.md#end-goal-checklist) complete
- [ ] `DATABASE_URL` available for dev Postgres
- [ ] API base URL decided for local dev (e.g. `http://localhost:3000`)

### Already in repo

- [x] Full Prisma schema at `apps/api/prisma/schema.prisma`
- [x] Idempotent seed at `apps/api/prisma/seed.ts`

---

## Tasks

### Accounts (set up in this phase)

- [x] `[INFRA]` **Expo / EAS** account created at `expo.dev`; logged in via `eas login` in terminal
  - CLI installed (`npm i -g eas-cli`); Expo email/password stored in secrets manager
  - (CI build token `EXPO_TOKEN` is generated later in Phase 5)

### Monorepo & shared tooling

- [x] `[INFRA]` Initialize Turborepo monorepo with pnpm workspaces (`apps/*`, `packages/*`):
  ```
  quickbasket/
  ├── apps/api/          ✅ done
  ├── apps/mobile/       ⏳ migration from QuickBasket/ pending (Stage 2)
  ├── packages/ui/       ✅ placeholder
  ├── packages/store/    ✅ authSlice
  ├── packages/types/    ✅ done
  └── packages/utils/    ✅ done
  ```
- [x] `[INFRA]` Root `package.json` with workspace scripts: `dev`, `build`, `lint`, `typecheck`, `test`
- [x] `[INFRA]` `turbo.json` pipelines: `dev`, `build`, `lint`, `typecheck`, `test`
- [x] `[INFRA]` Shared `tsconfig.base.json`; strict TypeScript in all packages
- [ ] `[INFRA]` Shared ESLint + Prettier config consumed by apps/packages — **Prettier done; ESLint pending**
- [x] `[INFRA]` `packages/types` — shared interfaces: `PublicUser`, `Address`, `AuthTokens`, `ApiError`, DTOs
- [x] `[INFRA]` `packages/utils` — `formatPrice`, `discountPercent`, `slugify`, `dateHelpers`

### API — bootstrap

- [x] `[BE]` Scaffold `apps/api` with Fastify + TypeScript
- [x] `[BE]` Env validation with Zod:
  - `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `NODE_ENV`, TTLs, CORS
- [x] `[BE]` Pino structured logging (pino-pretty in dev)
- [x] `[BE]` `GET /health` — returns `{ status: "ok", db }` (with DB ping)
- [x] `[BE]` CORS configured for mobile/web dev origins
- [x] `[BE]` Global error handler (consistent JSON error shape; Zod + AppError)

### API — database

- [x] `[BE]` Add `apps/api/package.json` with Prisma deps per [database-setup.md](../database-setup.md):
  - `@prisma/client`, `argon2`, `prisma`, `tsx`
- [x] `[BE]` Register Prisma seed + db scripts in `package.json`
- [x] `[BE]` Create `apps/api/.env` with `DATABASE_URL` (git-ignored)
- [x] `[BE]` Run `pnpm db:migrate --name init`
- [x] `[BE]` Run `pnpm db:seed` — verified test users via Prisma Studio
- [x] `[BE]` Prisma client singleton module (`lib/prisma.ts`)

### API — authentication

- [x] `[BE]` Password module: `hashPassword`, `verifyPassword` (argon2)
- [x] `[BE]` JWT utilities:
  - Sign/verify access token (15m TTL)
  - Opaque refresh token (7d), **hashed** in `refresh_tokens` table
  - Rotation on refresh; old token revoked (verified: reuse → 401)
- [x] `[BE]` Auth middleware: validate access token, attach `userId` to request
- [x] `[BE]` `POST /auth/register` — body: `{ phone, name, password }`
  - Reject duplicate phone (409) ✅
  - Return `{ user, accessToken, refreshToken }`
- [x] `[BE]` `POST /auth/login` — body: `{ phone, password }`
  - Invalid credentials → 401 ✅
  - Return tokens + user
- [x] `[BE]` `POST /auth/refresh` — body: `{ refreshToken }`
  - Rotate refresh token; return new pair ✅
- [x] `[BE]` `POST /auth/logout` — revoke refresh token
- [x] `[BE]` `GET /auth/me` — current user (Bearer-protected)

### Mobile — bootstrap

- [x] `[MOB]` Expo app migrated into `apps/mobile` (managed workflow, **expo-router**, not Bare)
- [~] `[MOB]` ~~NativeWind v4~~ — using stock Expo styling (themed components + `theme.ts`); NativeWind deferred
- [x] `[MOB]` Install: `expo-secure-store` ✓, `expo-image` ✓ (pre-installed); navigation = **expo-router** (not React Navigation)
- [x] `[MOB]` Wire `packages/store` and `packages/types` into mobile

### Mobile — navigation & auth UI

- [x] `[MOB]` **Auth group `(auth)`:** Login + Register (Splash = `AnimatedSplashOverlay` + hydration gate; Onboarding skipped)
- [~] `[MOB]` **Tabs `(tabs)`:** Home + Explore stubbed; Catalog/Cart/Orders/Profile tabs added as those phases land
- [x] `[MOB]` Redux store (`@quickbasket/store` `authSlice`) configured in app; tokens in `expo-secure-store` (web → localStorage fallback)
- [x] `[MOB]` Fetch wrapper (`lib/api.ts`) with auth header injection
- [x] `[MOB]` **Register screen:** name, phone, password, confirm + client validation → `POST /auth/register`
- [x] `[MOB]` **Login screen:** phone + password → `POST /auth/login`
- [x] `[MOB]` **Auth gate:** `Stack.Protected` guards `(tabs)` vs `(auth)`; session hydrated from storage on launch
- [x] `[MOB]` **Silent refresh:** `lib/api.ts` retries once via `POST /auth/refresh` on 401
- [x] `[MOB]` **Logout** on Home → clears tokens → returns to Login

### Verification

- [x] `[QA]` Mobile typecheck passes; **web bundle builds** (Metro, 1201 modules, all routes resolve)
- [ ] `[QA]` Manual: register new user on Web (`pnpm mobile` → `w`) — **needs your run**
- [ ] `[QA]` Manual: login with seeded user `9999900001` / `Password@123` — **needs your run**
- [ ] `[QA]` Manual: kill app, relaunch — still logged in — **needs your run**
- [ ] `[QA]` Manual: repeat on Android emulator + iOS simulator if available

---

## End-Goal Checklist

Mark Phase 1 complete when **all** items are checked:

- [ ] `pnpm dev` starts API + mobile without errors
- [ ] `pnpm lint` and `pnpm build` pass at repo root
- [ ] `GET /health` returns 200
- [ ] User can **register** and **login** with phone + password on **Web** (minimum)
- [ ] User can **login** on **iOS** and **Android** (or platform blockers documented)
- [ ] Access token persists across app restart via secure-store
- [ ] Expired access token silently refreshes on launch
- [ ] Login lands on empty **Home** tab; logout returns to **Login**
- [ ] Database migrated and seed data present (verify via `pnpm db:studio`)

---

## Test credentials (after seed)

| Role | Phone | Password |
|------|-------|----------|
| Customer | `9999900001` | `Password@123` |
| Staff | `9999900002` | `Password@123` |
