# Phase 4 — Orders & Tracking

**Goal:** Real-time order lifecycle, push notifications, history, and one-tap reorder.  
**Previous:** [Phase 3 — Checkout](./phase-3-checkout.md)  
**Next:** [Phase 5 — Launch](./phase-5-launch.md)  
**Companion docs:** [architecture.md](../architecture.md) · [requirements.md](../requirements.md)

---

## Prerequisites

- [ ] [Phase 3 End-Goal Checklist](./phase-3-checkout.md#end-goal-checklist) complete
- [ ] FCM + Expo push credentials configured
- [ ] Physical device available for push testing (simulators are limited for push)
- [ ] Staff test user available: `9999900002` / `Password@123`

---

## Tasks

### Accounts & infra (set up in this phase)

- [ ] `[INFRA]` **Firebase / FCM** — create project + Android app for push:
  - `console.firebase.google.com` → **Add project** `QuickBasket` (Analytics optional)
  - **Add Android app** (package e.g. `com.bizsense.quickbasket`) → download `google-services.json`
  - **Project Settings → Cloud Messaging** → ensure **FCM API (V1)** is enabled
  - **Service accounts → Generate new private key** → upload the FCM V1 JSON to Expo push credentials
  - (iOS push uses APNs via the Apple Developer account — set up in Phase 5)

### API — order state machine

- [ ] `[BE]` `OrderStatus` transitions with guards:
  ```
  PLACED → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED
  Any (except DELIVERED) → CANCELLED (with rules)
  ```
- [ ] `[BE]` `orderStatusService.transition(orderId, newStatus)` — validates + persists
- [ ] `[BE]` `PATCH /internal/orders/:id/status` — staff-only (role `STAFF` or API key)
  - Interim until admin portal exists

### API — real-time (Socket.io)

- [ ] `[BE]` Socket.io server attached to Fastify HTTP server
- [ ] `[BE]` Auth on socket connect (JWT)
- [ ] `[BE]` User joins room `user:{userId}`
- [ ] `[BE]` On status transition: emit `order:status` `{ orderId, status, updatedAt }`

### API — push notifications

- [ ] `[BE]` BullMQ worker process for notification jobs
- [ ] `[BE]` On each status transition: enqueue push job
- [ ] `[BE]` Worker sends via Expo Push API + FCM using user's `pushToken`
- [ ] `[BE]` `PUT /users/me/push-token` — save Expo push token

### Mobile — push registration

- [ ] `[MOB]` Request notification permissions
- [ ] `[MOB]` Register for Expo push token on login
- [ ] `[MOB]` Send token to `PUT /users/me/push-token`
- [ ] `[MOB]` Handle foreground/background notification taps → OrderDetail

### Mobile — orders UI

- [ ] `[MOB]` **OrdersScreen** — tabs or sections: Active | Past
- [ ] `[MOB]` Active orders: subscribe to Socket.io `order:status` for live updates
- [ ] `[MOB]` **OrderDetail screen:**
  - Status timeline (PLACED → … → DELIVERED)
  - Item breakdown, address snapshot, slot snapshot
  - Payment: COD / PENDING
- [ ] `[MOB]` `GET /orders` — paginated history
- [ ] `[MOB]` `GET /orders/:id` — single order detail
- [ ] `[MOB]` **Reorder** button — clone `OrderItem`s into `cartSlice` (map by `productId`, current price)

### Verification

- [ ] `[QA]` Place order as customer; advance status via staff endpoint
- [ ] `[QA]` Customer app updates live without refresh
- [ ] `[QA]` Push notification received on physical device per transition
- [ ] `[QA]` Order history shows past orders; detail matches DB
- [ ] `[QA]` Reorder fills cart correctly

---

## End-Goal Checklist

Mark Phase 4 complete when **all** items are checked:

- [ ] Status transition on backend updates mobile UI in real time (Socket.io)
- [ ] Push notification arrives on a **real device** for each status change
- [ ] Order history lists past orders with correct statuses
- [ ] OrderDetail shows full breakdown (items, address, slot, fees, coupon)
- [ ] Reorder repopulates cart from a previous order
- [ ] Invalid status transitions rejected by API (e.g. PLACED → DELIVERED)

---

## Order lifecycle

```
PLACED → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED
                                              ↘ CANCELLED (from earlier states)
```

Each transition emits:
1. Socket.io `order:status` event to the customer's room
2. BullMQ job → Expo/FCM push notification
