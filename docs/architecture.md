# QuickBasket — Architecture

**Last updated:** 2026-06-22
**Companion doc:** [requirements.md](./requirements.md)

---

## 1. System Overview

QuickBasket is a **Turborepo monorepo** containing a React Native client and a Node.js API,
sharing TypeScript types, the Redux store, and utilities. The mobile app talks to the API over
REST (RTK Query) for data and over Socket.io for live order updates.

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  Mobile / Web (Expo, RN)     │         │   API (Node.js + Fastify)    │
│  - React Navigation v7       │  REST   │  - Prisma ORM                │
│  - Redux Toolkit + RTK Query │ ──────► │  - JWT auth (phone+password) │
│  - NativeWind, FlashList     │         │  - BullMQ workers            │
│  - redux-persist, secure-    │ ◄─────► │  - Socket.io server          │
│    store                     │ Socket  │                              │
└─────────────────────────────┘         └───────────────┬──────────────┘
                                                         │
                        ┌────────────────┬───────────────┼────────────────┐
                        ▼                ▼               ▼                 ▼
                  ┌───────────┐    ┌──────────┐   ┌────────────┐   ┌────────────┐
                  │ PostgreSQL│    │  Redis    │   │ Cloudflare │   │  FCM /     │
                  │ (Prisma)  │    │ cache +   │   │ R2 (images)│   │  Expo Push │
                  │           │    │ BullMQ    │   │            │   │            │
                  └───────────┘    └──────────┘   └────────────┘   └────────────┘
```

---

## 2. Monorepo Structure

```
quickbasket/
├── apps/
│   ├── mobile/          ← React Native + Expo (iOS, Android, Web)
│   └── api/             ← Node.js + Fastify backend
├── packages/
│   ├── ui/              ← Shared NativeWind components
│   ├── store/           ← Redux Toolkit + RTK Query
│   ├── types/           ← Shared TypeScript interfaces
│   └── utils/           ← formatPrice, slugify, dateHelpers
├── turbo.json
└── package.json
```

**Mobile (`apps/mobile/src`):** `navigation/`, `screens/{auth,home,catalog,cart,checkout,orders,profile}`,
`components/`, `hooks/` (useCart, useLocation, useAuth), `constants/`.

---

## 3. Technology Stack

### Frontend
| Concern | Choice | Reason |
|---|---|---|
| Framework | React Native + Expo (Bare) | Cross-platform, OTA updates |
| Navigation | React Navigation v7 | Stack + Tab + Modal |
| State | Redux Toolkit + RTK Query | Cart state + server cache |
| Styling | NativeWind v4 | Tailwind across native + web |
| Lists | FlashList v2 | 60 fps product grids |
| Images | Expo Image | Caching + blurhash |
| Maps / Location | react-native-maps + expo-location | Delivery address picker |
| Notifications | Expo Notifications + FCM | Order status push |
| Persist | redux-persist + AsyncStorage | Cart survives restart |
| Secure storage | expo-secure-store | JWT token storage |

### Backend
| Concern | Choice | Notes |
|---|---|---|
| Runtime | Node.js + Fastify | Fast, schema-first, TS-native |
| Language | TypeScript | Shared types with frontend |
| ORM / DB | Prisma + PostgreSQL | Type-safe queries, migrations |
| Cache | Redis | Product cache, stock levels, sessions |
| Auth | JWT + refresh tokens | Phone + password (argon2 hashing) |
| File storage | Cloudflare R2 | Product images |
| Real-time | Socket.io | Live order tracking |
| Job queue | BullMQ (Redis) | Notifications, order processing |
| API style | REST | Suits single-store scope |

---

## 4. Authentication Flow

Phone + password for this release, designed so OTP can drop in later without reworking token issuance.

1. **Register** — `POST /auth/register` (phone, name, password) → password hashed with argon2 →
   User created → returns access + refresh tokens.
2. **Login** — `POST /auth/login` (phone, password) → verify hash → returns tokens.
3. **Refresh** — `POST /auth/refresh` rotates the refresh token, issues a new access token.
4. Access token kept in memory/secure-store; refresh token in secure-store. Silent refresh on launch.

> Auth lives behind a thin service interface; a future `OtpProvider` plugs into the same
> `/auth/*` contract.

---

## 5. Data Model (core entities)

```
User (id, phone unique, name, passwordHash, createdAt)
  └─ Address[]                └─ Order[]

Category (id, name, image) ─< Product (id, name, price, mrp, stock, unit, images[], categoryId)

Order (id, userId, status, total, address Json, slot Json,
       paymentMethod "COD", paymentStatus, createdAt)
  └─ OrderItem[]  (productId, qty, price)

Coupon (id, code, type, value, minOrder, startsAt, endsAt, usageLimit)
DeliverySlot (id, date, from, to, capacity)
Promotion (id, banner, startsAt, endsAt)   ← Phase 5
```

`OrderStatus = PLACED | CONFIRMED | PACKED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED`

---

## 6. State Management (mobile)

| Slice / API | Manages | Persisted |
|---|---|---|
| `authSlice` | userId, tokens, isLoggedIn | Yes (secure-store) |
| `cartSlice` | items[], qty, totals | Yes (AsyncStorage) |
| `uiSlice` | modals, toasts, loading | No |
| `productApi` (RTK Q) | products, categories, search | Cache only |
| `orderApi` (RTK Q) | place order, history | No |

---

## 7. Order Lifecycle & Real-time

1. Customer places order → `POST /orders` validates stock, recomputes totals server-side,
   applies coupon, decrements stock, creates `Order` + `OrderItem`s.
2. A **BullMQ** job is enqueued for notification dispatch.
3. Staff (interim internal endpoint) advances status through the state machine; each guarded
   transition:
   - emits a **Socket.io** `order:status` event to the user's room (live UI update), and
   - enqueues a BullMQ job that sends an **Expo/FCM** push notification.

---

## 8. Caching, Storage & Performance

- **Redis** — cache-aside for product/category reads; live stock / low-stock badges; BullMQ broker.
- **Cloudflare R2** — product images, served with blurhash placeholders via Expo Image.
- **Client** — RTK Query cache + redux-persist enable offline browsing; FlashList for 60 fps grids.

---

## 9. Deployment & Observability

| Concern | Tool |
|---|---|
| Mobile builds / submit | EAS Build + EAS Submit |
| OTA updates | EAS Update |
| Web deploy | Vercel / Cloudflare Pages |
| API deploy | Railway / Render / EC2 |
| CI | GitHub Actions (lint + test + build on PR) |
| Crash reporting | Sentry (mobile + API) |
| Logging | Pino (structured JSON) |
| Monitoring | BetterStack / Datadog |

**Testing:** Jest + RNTL (slices, hooks, components), Supertest (API routes), Detox (E2E: login, checkout).

---

## 10. Future Architecture Notes

- **OTP login** — add `OtpProvider` (MSG91) behind `/auth/*`; requires DLT registration.
- **Online payments** — add `Payment` model + gateway (Razorpay); extend order payment-status flow.
- **Admin portal** — replaces the interim internal status-transition endpoint.
