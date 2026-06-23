# QuickBasket — Detailed Phase-wise Execution Plan

**Companion docs:** [requirements.md](./requirements.md) · [architecture.md](./architecture.md) · [database-design.md](./database-design.md) · [database-setup.md](./database-setup.md)  
**Phase docs:** [phases/](./phases/)  
**Last updated:** 2026-06-22

---

## How to use this document

Each phase has its own doc under [`docs/phases/`](./phases/) with full task lists and checklists. This file is the **overview and index**.

| Section | Purpose |
|---------|---------|
| **Prerequisites** | Must be true before starting the phase |
| **Tasks** | Actionable work tagged `[INFRA]` `[BE]` `[MOB]` `[QA]` |
| **End-Goal Checklist** | Objective criteria to mark the phase complete |

**Rule:** Do not start a phase until the previous phase's **End-Goal Checklist** is fully checked.

**Decisions baked in:** phone + password auth (argon2, JWT/refresh) · Cash on Delivery only · OTP and online payments are future scope.

---

## Current repo status

| Item | Status |
|------|--------|
| GitHub repo + docs | Done |
| `apps/api/prisma/schema.prisma` (full schema) | Done |
| `apps/api/prisma/seed.ts` (idempotent seed) | Done |
| Monorepo (`package.json`, Turborepo, workspaces) | Not started |
| `apps/api` Fastify server | Not started |
| `apps/mobile` Expo app | Not started |
| `packages/{ui,store,types,utils}` | Not started |

> The Prisma schema already includes all entities (User through Order). Phase 1 applies a single `init` migration rather than incremental model additions.

---

## Phase index

| Phase | Goal | Doc |
|-------|------|-----|
| **0 — Pre-flight** | Accounts and dev infra ready | [phase-0-preflight.md](./phases/phase-0-preflight.md) |
| **1 — Foundation** | Auth skeleton on iOS, Android, Web | [phase-1-foundation.md](./phases/phase-1-foundation.md) |
| **2 — Catalog** | Browse, search, view 100+ products | [phase-2-catalog.md](./phases/phase-2-catalog.md) |
| **3 — Checkout** | Cart → COD order with address, slot, coupon | [phase-3-checkout.md](./phases/phase-3-checkout.md) |
| **4 — Tracking** | Real-time orders, push, reorder | [phase-4-tracking.md](./phases/phase-4-tracking.md) |
| **5 — Launch** | Shippable, tested, deployed app | [phase-5-launch.md](./phases/phase-5-launch.md) |

---

## Environment variables (cumulative)

| Variable | Phase | Used by |
|----------|-------|---------|
| `DATABASE_URL` | 0/1 | API / Prisma |
| `JWT_ACCESS_SECRET` | 1 | API auth |
| `JWT_REFRESH_SECRET` | 1 | API auth |
| `PORT`, `NODE_ENV` | 1 | API |
| `REDIS_URL` | 2 | API cache + BullMQ |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL` | 2 | API image storage |
| `GOOGLE_MAPS_API_KEY` | 3 | Mobile maps (if required) |
| `FCM_*` / Expo push credentials | 4 | API worker |
| `SENTRY_DSN` | 5 | API + mobile |
| `CORS_ORIGINS` | 1+ | API |

---

## API endpoints (by phase)

| Phase | Endpoints |
|-------|-----------|
| 1 | `GET /health`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| 2 | `GET /categories`, `GET /products`, `GET /products/:id` |
| 3 | `GET/POST/PUT/DELETE /addresses`, `GET /delivery-slots`, `POST /coupons/validate`, `POST /orders` |
| 4 | `GET /orders`, `GET /orders/:id`, `PATCH /internal/orders/:id/status`, `PUT /users/me/push-token` |
| 5 | `GET /promotions` |

---

## Suggested PR / milestone mapping

| Milestone | Suggested PR |
|-----------|--------------|
| Phase 0 | `chore: repo tooling and gitignore` |
| Phase 1a | `feat: turborepo monorepo scaffold` |
| Phase 1b | `feat(api): fastify bootstrap + prisma + auth` |
| Phase 1c | `feat(mobile): expo auth flow` |
| Phase 2a | `feat(api): catalog endpoints + redis cache` |
| Phase 2b | `feat(mobile): home, catalog, product detail` |
| Phase 3a | `feat: cart slice and cart screen` |
| Phase 3b | `feat: checkout, orders API, delivery fee` |
| Phase 4 | `feat: order tracking, socket.io, push` |
| Phase 5 | `feat: promotions, sentry, ci, eas deploy` |

---

## Cross-phase definition of done

Every task/PR is **done** only when:

- [ ] Code merged to `main` via PR
- [ ] `packages/types` updated if API contracts changed
- [ ] Relevant tests added or updated (required from Phase 3 onward for new features)
- [ ] No new Sentry errors from the change (Phase 5 onward)
- [ ] Manual smoke test documented in PR description

---

## Future scope (not in this plan)

| Feature | What it adds |
|---------|--------------|
| OTP login (MSG91) | `OtpProvider`, OTP screen, DLT registration |
| OTP password reset | `/auth/forgot-password`, `/auth/reset` |
| Online payments | `Payment` model, Razorpay, payment status flow |
| Admin / staff portal | Replaces interim internal status endpoint |
| Delivery-partner app | Separate delivery-side app |
