# QuickBasket — Phase-wise Execution Plan

**Companion docs:** [requirements.md](./requirements.md) · [architecture.md](./architecture.md)
**Detailed plan:** [execution-plan-detailed.md](./execution-plan-detailed.md)
**Last updated:** 2026-06-22

> **Expanded docs:** Each phase has a dedicated checklist doc under [`docs/phases/`](./phases/):
> [Phase 0](./phases/phase-0-preflight.md) · [Phase 1](./phases/phase-1-foundation.md) ·
> [Phase 2](./phases/phase-2-catalog.md) · [Phase 3](./phases/phase-3-checkout.md) ·
> [Phase 4](./phases/phase-4-tracking.md) · [Phase 5](./phases/phase-5-launch.md)

This plan is the working checklist for building QuickBasket. Each phase has **Prerequisites**
(what must be true before starting), **Tasks** (the work, tagged `[INFRA] [BE] [MOB] [QA]`), and an
**End-Goal Checklist** (objective exit criteria). Do not start a phase until the previous phase's
checklist is fully green.

**Current decisions baked in:** phone + password auth (argon2, JWT/refresh) · Cash on Delivery only ·
OTP and online payments are future scope.

---

## Phase 0 — Pre-flight

**Goal:** every external dependency and account is ready so building is never blocked on procurement.

### Prerequisites
- [ ] GitHub repo created and `main` pushed (done).
- [ ] Decision sign-off: password auth + COD for launch.

### Tasks
- [ ] `[INFRA]` Create accounts: Expo/EAS, Postgres host (Railway/Supabase), Redis (Upstash), Cloudflare R2, Sentry, FCM.
- [ ] `[INFRA]` Provision **dev** PostgreSQL + Redis; capture connection strings in a secrets store / `.env`.
- [ ] `[INFRA]` Add `.nvmrc` (Node 24 LTS); confirm pnpm as the package manager.
- [ ] `[INFRA]` Confirm `.gitignore` covers `node_modules/`, `.env*`, build output, `.claude/`.
- [ ] `[INFRA]` Set up branch protection on `main` (PR + passing CI to merge).

### End-Goal Checklist
- [ ] All third-party accounts exist and credentials are stored securely.
- [ ] Dev Postgres + Redis reachable from a local machine.
- [ ] Repo has `.nvmrc`, `.gitignore`, and branch protection in place.

---

## Phase 1 — Foundation

**Goal:** an empty but runnable end-to-end skeleton with password authentication working on iOS, Android, and Web.

### Prerequisites
- [ ] Phase 0 checklist complete.
- [ ] Dev DB connection string available.

### Tasks
**Monorepo & tooling**
- [ ] `[INFRA]` Turborepo + pnpm workspaces; create `apps/{mobile,api}` + `packages/{ui,store,types,utils}`.
- [ ] `[INFRA]` Root `turbo.json` pipelines (dev/build/lint/test); shared base `tsconfig.json`.
- [ ] `[INFRA]` ESLint + Prettier shared config; TypeScript strict mode everywhere.
- [ ] `[INFRA]` `packages/types` skeleton (User, Address, Product, Order interfaces).

**API**
- [ ] `[BE]` Fastify bootstrap: server, Pino logging, env validation (zod), health-check route.
- [ ] `[BE]` Prisma init + Postgres connection; `User` (with `passwordHash`) + `Address` models; first migration.
- [ ] `[BE]` JWT access + refresh-token utilities (sign, verify, rotate); auth middleware.
- [ ] `[BE]` Password hashing module (argon2): `hashPassword`, `verifyPassword`.
- [ ] `[BE]` `POST /auth/register` (phone, name, password; reject duplicate phone) → tokens.
- [ ] `[BE]` `POST /auth/login` (phone, password) → tokens.
- [ ] `[BE]` `POST /auth/refresh` token rotation.

**Mobile**
- [ ] `[MOB]` Expo Bare init; NativeWind v4 + theme constants; Expo Image, secure-store deps.
- [ ] `[MOB]` React Navigation v7: Auth Stack (Splash, Onboarding, Login, Register) + Main Tab navigator (5 stubbed tabs).
- [ ] `[MOB]` Redux store + `authSlice`; redux-persist; tokens in `expo-secure-store`.
- [ ] `[MOB]` Register screen (phone, name, password, confirm, validation) → register call.
- [ ] `[MOB]` Login screen (phone + password, show/hide toggle) → login → Home tab.
- [ ] `[MOB]` Auth gate: route Auth vs Main Tabs by token; silent refresh on launch.

### End-Goal Checklist
- [ ] `pnpm dev` runs both apps; `turbo lint` and `turbo build` pass.
- [ ] User can **register** and **log in** with phone + password on iOS, Android, and Web.
- [ ] Token persists across app restart; expired access token silently refreshes.
- [ ] Logging in lands on an (empty) Home tab; logging out returns to Login.

---

## Phase 2 — Product Catalog

**Goal:** customers can browse, search, and view a real catalog with smooth performance.

### Prerequisites
- [ ] Phase 1 checklist complete.
- [ ] Cloudflare R2 bucket ready for product images.

### Tasks
**API**
- [ ] `[BE]` Prisma `Category` + `Product` models; migration.
- [ ] `[BE]` Seed script: ~6 categories, 100+ products with image URLs (sample images uploaded to R2).
- [ ] `[BE]` `GET /categories`.
- [ ] `[BE]` `GET /products` with `categoryId` + `search` (Postgres `ILIKE`) + pagination.
- [ ] `[BE]` Redis cache-aside layer for category/product reads (TTL + invalidation hook).
- [ ] `[BE]` R2 upload helper + presigned URLs.

**Mobile**
- [ ] `[MOB]` `productApi` (RTK Query): getCategories, getProducts in `packages/store`.
- [ ] `[MOB]` Reusable `ProductCard` (price/MRP/discount badge, unit, low-stock badge) + `CategoryChip`.
- [ ] `[MOB]` Home screen: BannerCarousel + CategoryGrid + FeaturedProducts (FlashList).
- [ ] `[MOB]` Catalog screen: FlashList 2-column grid + horizontal category chips + pagination.
- [ ] `[MOB]` Search bar + Fuse.js client-side fuzzy match layered over API search.
- [ ] `[MOB]` ProductDetail: multi-image carousel + blurhash, unit/price/stock, Add-to-cart button (stub action).

### End-Goal Checklist
- [ ] Catalog of 100+ seeded products is browsable by category.
- [ ] Search returns relevant results (server + fuzzy client match).
- [ ] Product grid scrolls at ~60 fps; images load with blurhash placeholders and cache.
- [ ] Cached category/product reads served from Redis (verified via logs/metrics).

---

## Phase 3 — Cart & Checkout

**Goal:** a customer can build a cart and place a Cash-on-Delivery order with address, slot, and coupon.

### Prerequisites
- [ ] Phase 2 checklist complete.
- [ ] Maps API key configured for `react-native-maps` (if required by platform).

### Tasks
**Cart**
- [ ] `[MOB]` `cartSlice` (addItem, removeItem, updateQty, clearCart) + selectors (subtotal, count).
- [ ] `[MOB]` redux-persist for cart via AsyncStorage.
- [ ] `[MOB]` CartScreen: qty steppers, swipe-to-remove, price summary, checkout CTA.
- [ ] `[MOB]` Wire ProductDetail + ProductCard Add-to-cart to `cartSlice`.

**Coupons**
- [ ] `[BE]` `Coupon` model (code, type, value, minOrder, start/end, usageLimit) + migration.
- [ ] `[BE]` `POST /coupons/validate` (returns discount or rejection reason).
- [ ] `[MOB]` Coupon input on cart; applied-discount display.

**Address & slots**
- [ ] `[BE]` Address CRUD (`GET/POST/PUT/DELETE /addresses`).
- [ ] `[MOB]` Address picker: `react-native-maps` + `expo-location`; save to AddressBook.
- [ ] `[BE]` `DeliverySlot` model + `GET /delivery-slots` (available slots by date).
- [ ] `[MOB]` Delivery-slot selection screen.

**Order placement (COD)**
- [ ] `[BE]` `Order` + `OrderItem` models with `paymentMethod="COD"`, `paymentStatus`, `status`, `address` Json, `slot` Json; migration.
- [ ] `[BE]` `POST /orders`: validate stock, recompute totals server-side, apply coupon, decrement stock, create order.
- [ ] `[BE]` BullMQ setup (Redis) + enqueue notification job on order create.
- [ ] `[MOB]` Checkout flow: address + slot + summary + place-order (RTK `placeOrder`); clear cart on success.

### End-Goal Checklist
- [ ] Add items → apply valid coupon → pick address + slot → place a COD order successfully.
- [ ] Order and its items are persisted; stock decremented; totals computed server-side (not trusted from client).
- [ ] Cart survives app restart (redux-persist).
- [ ] Invalid/expired coupons are rejected with a clear message.

---

## Phase 4 — Orders & Tracking

**Goal:** real-time order lifecycle with push notifications, history, and one-tap reorder.

### Prerequisites
- [ ] Phase 3 checklist complete.
- [ ] FCM credentials + Expo push configured; physical device available for push testing.

### Tasks
- [ ] `[BE]` Order state-machine service with valid-transition guards (PLACED→CONFIRMED→PACKED→OUT_FOR_DELIVERY→DELIVERED / CANCELLED).
- [ ] `[BE]` Internal status-transition endpoint (interim staff control; protected).
- [ ] `[BE]` Socket.io server; emit `order:status` to the order's user room.
- [ ] `[BE]` BullMQ worker: send push via Expo Notifications + FCM on each transition.
- [ ] `[MOB]` Expo Notifications registration; store push token on the User.
- [ ] `[MOB]` OrdersScreen — active orders with live status (Socket.io subscription).
- [ ] `[MOB]` `GET /orders` history + OrderDetail (item breakdown, address, slot, status timeline).
- [ ] `[MOB]` Reorder: clone past `OrderItem`s into cart.

### End-Goal Checklist
- [ ] Advancing an order's status on the backend updates the app UI live (no manual refresh).
- [ ] A push notification arrives on a real device for each status change.
- [ ] Order history lists past orders; OrderDetail shows full breakdown.
- [ ] Reorder repopulates the cart from a previous order.

---

## Phase 5 — Polish & Launch

**Goal:** a shippable, observable, tested app in the stores and on the web.

### Prerequisites
- [ ] Phase 4 checklist complete.
- [ ] Apple Developer + Google Play Console accounts ready; store listings drafted.

### Tasks
- [ ] `[BE]` `Promotion` model with start/end scheduling; `GET /promotions` drives banners.
- [ ] `[MOB]` Empty states, error boundaries, skeleton loaders across screens.
- [ ] `[MOB]` Static "Cash on Delivery" PaymentMethods screen.
- [ ] `[INFRA]` Sentry on mobile + API.
- [ ] `[INFRA]` GitHub Actions CI: lint + test + build on PR.
- [ ] `[INFRA]` EAS Build + EAS Submit (App Store / Play); EAS Update for OTA; web deploy (Vercel/Cloudflare Pages).
- [ ] `[QA]` Jest + RNTL (cartSlice, hooks, ProductCard, password/login form); Supertest (auth, products, orders); Detox E2E (login + checkout).
- [ ] `[QA]` Perf audit: FlashList tuning, image cache, bundle size, cold start <2s.

### End-Goal Checklist
- [ ] Offer banners render from scheduled promotions.
- [ ] All screens have empty/error/loading states; no unhandled crashes (verified in Sentry).
- [ ] CI passes on PRs; builds produced via EAS for iOS + Android; web deployed.
- [ ] Test suites green; E2E checkout passes.
- [ ] Cold start < 2s on a mid-range device; product list holds 60 fps.

---

## Cross-Phase Definition of Done

Every ticket is "done" only when:
- [ ] Code merged to `main` via PR with passing CI.
- [ ] Shared types updated in `packages/types` where contracts changed.
- [ ] Relevant tests added/updated.
- [ ] No new Sentry errors introduced (from Phase 5 onward).

---

## Future Scope (not in this plan)

| Feature | Adds |
|---|---|
| OTP login (MSG91) | `OtpProvider` behind `/auth/*`, OTP screen, DLT registration |
| OTP-based password reset | `/auth/forgot-password`, `/auth/reset` |
| Online payments | `Payment` model, gateway (Razorpay), payment-status flow |
| Admin / staff portal | Replaces interim internal status-transition endpoint |
| Delivery-partner app | Separate delivery-side app |
