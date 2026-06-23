# QuickBasket — Database Design

**Engine:** PostgreSQL · **ORM:** Prisma
**Schema:** [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma)
**Seed:** [`apps/api/prisma/seed.ts`](../apps/api/prisma/seed.ts)
**Companion docs:** [requirements.md](./requirements.md) · [architecture.md](./architecture.md)
**Last updated:** 2026-06-22

Reflects current decisions: **phone + password auth** (argon2), **Cash on Delivery only**.
OTP and online payments are future scope.

---

## 1. Entity Relationship Overview

```
User 1───* Address
User 1───* Order
User 1───* RefreshToken
Category 1───* Product
Order 1───* OrderItem *───1 Product
Coupon        (referenced by code snapshot on Order)
DeliverySlot  (referenced by Json snapshot on Order)
Promotion     (standalone — drives Home banners)
```

- **One store, many customers.** No store/tenant table — single-store scope.
- **Orders are immutable snapshots.** `Order.address` and `Order.slot` are JSON copies, and each
  `OrderItem` snapshots `name/unit/price`, so editing a Product or Address later never rewrites history.
- **Stock lives on Product** (`stock: Int`); Redis caches it for low-stock badges, Postgres is source of truth.

---

## 2. Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| id | cuid | PK |
| phone | string | **unique** — login identifier |
| name | string? | |
| passwordHash | string | argon2 hash (never plaintext) |
| role | enum | `CUSTOMER` \| `STAFF` (interim status control) |
| pushToken | string? | Expo/FCM token for notifications |
| createdAt / updatedAt | datetime | |

### `refresh_tokens`
Stores **hashed** refresh tokens for rotation + revocation. `tokenHash` unique; `revokedAt` nullable;
`expiresAt` enforced in app logic. Cascade-deletes with the user.

### `addresses`
User address book. `isDefault` flags the primary address. Optional `lat/lng` from the map picker.
Cascade-deletes with the user.

### `categories`
`name`, **unique `slug`**, `image`, `sortOrder`, `isActive`. One-to-many to products.

### `products`
| Column | Notes |
|---|---|
| name, **slug (unique)** | slug derived from name+unit to stay unique across repeats |
| price, mrp | `mrp` drives the discount badge |
| stock | 0 = out of stock |
| unit | "500g", "1L", "dozen" |
| images | string[] (R2 URLs) |
| categoryId | FK → categories |
| isActive, isFeatured | featured shown on Home |

Indexed on `categoryId` and `name` (search via Postgres `ILIKE`).

### `coupons`
`code` (unique), `type` (`PERCENT`/`FLAT`), `value`, `minOrder`, `maxDiscount?` (caps percent),
validity window (`startsAt`/`endsAt`), `usageLimit?`, `usedCount`, `isActive`.

### `delivery_slots`
`date` + `startTime` + `endTime` (**unique together**), `capacity`, `bookedCount`, `isActive`.
Checkout picks an available slot; `bookedCount < capacity` gates availability.

### `promotions`
Banner `title`, `image`, optional `link` (category slug / deep link), validity window, `sortOrder`.

### `delivery_config`
Single-row config (id is fixed to `"default"`) driving the **per-kilometer delivery fee**.

| Column | Notes |
|---|---|
| storeLat / storeLng | store origin for distance calculation |
| baseFee | flat handling component |
| perKmFee | charged per km |
| minFee | floor after base + per-km |
| maxFee? | optional cap on the fee |
| freeAboveSubtotal? | free delivery when cart subtotal ≥ this |
| maxDistanceKm | serviceable radius (beyond = out of range) |
| roundUpKm | ceil distance to whole km before charging |

**Fee formula (applied at checkout):**
```
distanceKm = haversine(store, deliveryAddress)        // ceil to whole km if roundUpKm
if distanceKm > maxDistanceKm  -> reject (out of serviceable range)
if subtotal >= freeAboveSubtotal -> deliveryFee = 0
else deliveryFee = clamp(baseFee + perKmFee * distanceKm, minFee, maxFee)
```
The computed `distanceKm` and `deliveryFee` are then snapshotted onto the `Order`.

### `orders`
| Column | Notes |
|---|---|
| userId | FK → users |
| status | `OrderStatus` state machine, default `PLACED` |
| paymentMethod | `COD` (only value this release) |
| paymentStatus | `PENDING` \| `COLLECTED` \| `REFUNDED` |
| subtotal, discount, deliveryFee, total | computed **server-side** |
| distanceKm | store→address distance the per-km `deliveryFee` was based on |
| couponCode | snapshot of applied code |
| address (Json) | snapshot of delivery address |
| slot (Json) | `{ date, from, to }` snapshot |

Indexed on `userId` and `status`.

### `order_items`
FK to `orders` (cascade) and `products`. Snapshots `name/unit/price` + `qty` at purchase time.

---

## 3. Enums

| Enum | Values |
|---|---|
| `UserRole` | CUSTOMER, STAFF |
| `OrderStatus` | PLACED, CONFIRMED, PACKED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED |
| `PaymentMethod` | COD *(ONLINE = future scope)* |
| `PaymentStatus` | PENDING, COLLECTED, REFUNDED |
| `CouponType` | PERCENT, FLAT |

---

## 4. Seed Data

The seed (`apps/api/prisma/seed.ts`) is **idempotent** (upserts on unique keys) and creates:

| Data | Details |
|---|---|
| **Users** | `9999900001` (CUSTOMER), `9999900002` (STAFF) — both password `Password@123` |
| **Address** | 1 default address for the test customer (Pune) |
| **Categories** | 6 — Fruits & Vegetables, Dairy & Eggs, Bakery & Snacks, Staples & Grains, Beverages, Household & Cleaning |
| **Products** | **100+** across categories; varied stock (some low-stock=3, some out-of-stock=0); first 2 per category featured |
| **Coupons** | `WELCOME10` (10%), `FRESH50` (₹50 flat), `SAVE15` (15%) |
| **Delivery slots** | 4 windows/day × 7 days |
| **Promotions** | 3 Home banners |
| **Delivery config** | ₹20 base + ₹8/km, capped ₹120, free over ₹999, 10 km radius (store @ Pune) |

> Images use deterministic `picsum.photos` placeholders — replace with real Cloudflare R2 URLs in Phase 2.

---

## 5. How to Apply

From `apps/api` (once the API app is scaffolded in Phase 1):

```bash
# 1. Set the connection string
echo 'DATABASE_URL="postgresql://user:pass@host:5432/quickbasket"' >> .env

# 2. Create the schema (dev)
npx prisma migrate dev --name init

# 3. Seed
npx prisma db seed     # requires "prisma": { "seed": "tsx prisma/seed.ts" } in package.json

# 4. Inspect
npx prisma studio
```

Seed dependencies: `@prisma/client`, `argon2`, and `tsx` (dev) to run the TypeScript seed.

---

## 6. Future-Scope DB Changes (not yet in schema)

| Feature | Change |
|---|---|
| Online payments | Add `Payment` model + `ONLINE` to `PaymentMethod`; link to `Order` |
| OTP login | `OtpRequest` table (or rely on provider); no change to core auth tables |
| OTP password reset | `PasswordResetToken` table |
| Admin portal | Replace `STAFF` role workflow with proper admin entities/permissions |
