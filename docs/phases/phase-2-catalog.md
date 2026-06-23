# Phase 2 — Product Catalog

**Goal:** Customers browse, search, and view a real catalog with smooth performance.  
**Previous:** [Phase 1 — Foundation](./phase-1-foundation.md)  
**Next:** [Phase 3 — Checkout](./phase-3-checkout.md)  
**Companion docs:** [database-design.md](../database-design.md) · [architecture.md](../architecture.md)

---

## Prerequisites

- [ ] [Phase 1 End-Goal Checklist](./phase-1-foundation.md#end-goal-checklist) complete
- [ ] `REDIS_URL` configured in API `.env`
- [ ] Cloudflare R2 bucket created; credentials in `.env`:
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`
- [ ] Seed data loaded (100+ products — run `pnpm db:seed` from `apps/api`)

---

## Tasks

### Accounts & infra (set up in this phase)

- [x] `[INFRA]` **Redis (dev)** — local Docker `quickbasket-redis` (redis:7) on `redis://localhost:6379`; `REDIS_URL` in `apps/api/.env`
  - Or hosted **Upstash**: sign up at `upstash.com` → create a Regional DB (e.g. Mumbai) → copy the `rediss://` URL
- [ ] `[INFRA]` **Cloudflare R2** — create bucket + API token:
  - Sign up at `dash.cloudflare.com` → **R2** → Create bucket `quickbasket-images`
  - **Manage R2 API Tokens** → create an **Object Read & Write** token
  - Capture into `apps/api/.env`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

### API — catalog endpoints

- [x] `[BE]` `GET /categories` — active categories, sorted by `sortOrder`
- [x] `[BE]` `GET /products` — query params:
  - `categoryId` (optional)
  - `search` (Postgres `ILIKE`, case-insensitive on name)
  - `page`, `limit` (pagination; returns `Paginated<Product>`)
  - `featured` (optional `true`/`false`)
- [x] `[BE]` `GET /products/:id` — single product with category (404 if missing)
- [x] `[BE]` Response DTOs aligned with `packages/types` (`Product` w/ `discountPercent`, `Category`)

### API — Redis cache

- [x] `[BE]` Redis client module (`lib/cache.ts`, optional — no-ops when `REDIS_URL` unset)
- [x] `[BE]` Cache-aside for `GET /categories` (TTL 300s)
- [x] `[BE]` Cache-aside for `GET /products` list (keyed by query hash, TTL 120s)
- [x] `[BE]` Cache invalidation hook (`cacheInvalidate(prefix)` — stub for future admin writes)
- [x] `[BE]` Log cache hit/miss in dev (`req.log.debug`); verified via Redis keys

### API — R2 image storage

- [ ] `[BE]` R2 upload helper (S3-compatible SDK) — **pending R2 account**
- [ ] `[BE]` Presigned URL generation for uploads (staff/admin future use) — **pending R2 account**
- [ ] `[BE]` (Optional) Upload sample product images to R2; update seed URLs from `picsum.photos` to R2

### Mobile — shared components

- [ ] `[MOB]` `packages/ui` — `ProductCard`:
  - Image, name, unit, price, MRP, discount badge
  - Low-stock badge when `stock <= 3 && stock > 0`
  - Out-of-stock state when `stock === 0`
- [ ] `[MOB]` `CategoryChip` — selectable category filter pill
- [ ] `[MOB]` `packages/store` — `productApi` (RTK Query):
  - `getCategories`
  - `getProducts` (with pagination)
  - `getProductById`

### Mobile — screens

- [ ] `[MOB]` **Home screen:**
  - `BannerCarousel` (static placeholders until Phase 5 promotions API)
  - `CategoryGrid` — navigate to Catalog with category pre-selected
  - `FeaturedProducts` — horizontal FlashList of `isFeatured` products
- [ ] `[MOB]` **Catalog screen:**
  - Horizontal category chips
  - 2-column FlashList grid
  - Infinite scroll / pagination
- [ ] `[MOB]` **Search:**
  - Search bar on Catalog (and/or Home)
  - Server search via `GET /products?search=`
  - Client-side Fuse.js fuzzy layer on loaded results
- [ ] `[MOB]` **ProductDetail screen:**
  - Multi-image carousel (Expo Image + blurhash placeholder)
  - Price, MRP, unit, stock status
  - **Add to cart** button (stub until Phase 3)

### Verification

- [ ] `[QA]` Browse all 6 categories; 100+ products visible
- [ ] `[QA]` Search "banana", "milk", etc. — relevant results
- [ ] `[QA]` Scroll product grid — target ~60 fps on mid-range device
- [ ] `[QA]` Redis cache hits visible in API logs on repeated requests

---

## End-Goal Checklist

Mark Phase 2 complete when **all** items are checked:

- [ ] Full seeded catalog browsable by category on mobile + web
- [ ] Search returns relevant results (server + optional client fuzzy match)
- [ ] Product grid scrolls smoothly (~60 fps); images load with placeholders
- [ ] Category/product reads served from Redis on cache hit (verified in logs)
- [ ] ProductDetail shows correct price, stock, and images
- [ ] Shared types in `packages/types` match API responses

---

## Seeded catalog summary

| Data | Details |
|------|---------|
| Categories | 6 (Fruits & Veg, Dairy, Bakery, Staples, Beverages, Household) |
| Products | 100+ with varied stock levels |
| Featured | First 2 products per category |
| Images | `picsum.photos` placeholders (swap for R2 in this phase) |
