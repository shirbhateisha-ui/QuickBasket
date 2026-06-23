# Phase 5 — Polish & Launch

**Goal:** Shippable, observable, tested app in stores and on the web.  
**Previous:** [Phase 4 — Tracking](./phase-4-tracking.md)  
**Companion docs:** [architecture.md](../architecture.md) · [requirements.md](../requirements.md)

---

## Prerequisites

- [ ] [Phase 4 End-Goal Checklist](./phase-4-tracking.md#end-goal-checklist) complete
- [ ] Apple Developer + Google Play Console accounts ready
- [ ] Store listing assets drafted (icon, screenshots, description)
- [ ] Production Postgres + Redis provisioned (separate from dev)

---

## Tasks

### API — promotions

- [ ] `[BE]` `GET /promotions` — active banners within `startsAt`/`endsAt`, sorted by `sortOrder`
- [ ] `[BE]` Verify seed promotions returned correctly (3 Home banners)

### Mobile — promotions & polish

- [ ] `[MOB]` Home `BannerCarousel` driven by `GET /promotions`
- [ ] `[MOB]` Tap banner → deep link to category or product list
- [ ] `[MOB]` **Empty states** on Cart, Orders, Catalog, Search
- [ ] `[MOB]` **Skeleton loaders** on Home, Catalog, ProductDetail
- [ ] `[MOB]` **Error boundaries** + retry on network failures
- [ ] `[MOB]` **PaymentMethods screen** — static "Cash on Delivery" info
- [ ] `[MOB]` Profile screen: user name, phone, logout, app version

### Observability

- [ ] `[INFRA]` **Sentry account + projects** — sign up at `sentry.io` → create org → two projects:
  - Node.js → `quickbasket-api` (capture **DSN** → `SENTRY_DSN`)
  - React Native → `quickbasket-mobile` (capture its DSN)
  - Generate a **Sentry auth token** for source-map uploads (`SENTRY_AUTH_TOKEN`)
- [ ] `[INFRA]` Sentry on API (Pino integration + unhandled errors)
- [ ] `[INFRA]` Sentry on mobile (Expo SDK)
- [ ] `[INFRA]` Source maps uploaded for readable stack traces

### CI/CD

- [ ] `[INFRA]` GitHub Actions workflow on PR:
  - `pnpm install`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- [ ] `[INFRA]` Cache turbo + pnpm for speed

### Deployment

- [ ] `[INFRA]` API deploy to Railway / Render / EC2
  - `prisma migrate deploy` in release step (not `migrate dev`)
  - **Do not** run dev seed in production
- [ ] `[INFRA]` Set production secrets via host secret manager
- [ ] `[INFRA]` Web deploy: Vercel or Cloudflare Pages (Expo web export)
- [ ] `[INFRA]` EAS Build profiles: `development`, `preview`, `production`
- [ ] `[INFRA]` EAS Submit to App Store + Play Store
- [ ] `[INFRA]` EAS Update configured for OTA patches

### Testing

- [ ] `[QA]` **Jest** unit tests:
  - `cartSlice` reducers + selectors
  - `authSlice`
  - `formatPrice`, coupon discount helpers
- [ ] `[QA]` **RNTL** component tests:
  - `ProductCard` (discount badge, low stock)
  - Login/Register form validation
- [ ] `[QA]` **Supertest** API tests:
  - Auth: register, login, refresh, duplicate phone
  - Products: list, search, pagination
  - Orders: place order, stock decrement, invalid coupon
- [ ] `[QA]` **Detox E2E** (recommended):
  - Login flow
  - Browse → add to cart → checkout → place order

### Performance audit

- [ ] `[QA]` FlashList: `estimatedItemSize`, remove unnecessary re-renders
- [ ] `[QA]` Image cache tuning (Expo Image)
- [ ] `[QA]` Bundle size check; remove unused deps
- [ ] `[QA]` Cold start < 2s on mid-range Android device
- [ ] `[QA]` Product list holds 60 fps under load

---

## End-Goal Checklist

Mark Phase 5 complete when **all** items are checked:

- [ ] Home banners render from `GET /promotions` with correct scheduling
- [ ] All major screens have loading, empty, and error states
- [ ] No unhandled crashes in Sentry during smoke test
- [ ] CI passes on PRs to `main`
- [ ] Production API deployed; `GET /health` returns 200
- [ ] iOS + Android builds produced via EAS
- [ ] Web build deployed and reachable
- [ ] Unit + API test suites green
- [ ] E2E checkout passes (or documented manual test script signed off)
- [ ] Cold start < 2s; catalog scroll ~60 fps on target device

---

## Production checklist

- [ ] `DATABASE_URL` set via secret manager (not committed)
- [ ] `prisma migrate deploy` used in CI/CD — never `migrate dev` in prod
- [ ] Dev seed **not** run against production (no `Password@123` test accounts)
- [ ] JWT secrets rotated for production
- [ ] CORS restricted to production origins
- [ ] Sentry DSN configured for API + mobile production builds
