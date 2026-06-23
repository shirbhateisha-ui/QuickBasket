# Phase 3 — Cart & Checkout

**Goal:** Customer builds a cart and places a COD order with address, slot, coupon, and delivery fee.  
**Previous:** [Phase 2 — Catalog](./phase-2-catalog.md)  
**Next:** [Phase 4 — Tracking](./phase-4-tracking.md)  
**Companion docs:** [database-design.md](../database-design.md) · [requirements.md](../requirements.md)

---

## Prerequisites

- [ ] [Phase 2 End-Goal Checklist](./phase-2-catalog.md#end-goal-checklist) complete
- [ ] `DeliveryConfig` seeded (₹20 base + ₹8/km, 10 km radius, free over ₹999)
- [ ] Maps API key configured if required for `react-native-maps`
- [ ] BullMQ + Redis worker process plan decided (same API process vs separate worker)

---

## Tasks

### Mobile — cart

- [ ] `[MOB]` `cartSlice` in `packages/store`:
  - `addItem`, `removeItem`, `updateQty`, `clearCart`
  - Selectors: `selectCartItems`, `selectCartCount`, `selectSubtotal`
- [ ] `[MOB]` redux-persist cart to AsyncStorage
- [ ] `[MOB]` **CartScreen:**
  - Line items with image, name, unit, price
  - Qty steppers (+ / −)
  - Swipe-to-remove
  - Subtotal summary + **Proceed to checkout** CTA
- [ ] `[MOB]` Wire Add-to-cart on ProductCard and ProductDetail
- [ ] `[MOB]` Cart tab badge shows item count

### API — coupons

- [ ] `[BE]` `POST /coupons/validate` — body: `{ code, subtotal }`
  - Check: exists, active, date window, `usageLimit`, `minOrder`
  - Return `{ valid: true, discount, type, code }` or `{ valid: false, reason }`
- [ ] `[BE]` Increment `usedCount` on successful order (not on validate alone)

### Mobile — coupons

- [ ] `[MOB]` Coupon input on Cart or Checkout
- [ ] `[MOB]` Display applied discount and updated total
- [ ] `[MOB]` Show rejection reason for invalid/expired codes

### API — addresses

- [ ] `[BE]` `GET /addresses` — list user's addresses
- [ ] `[BE]` `POST /addresses` — create; enforce single `isDefault` if needed
- [ ] `[BE]` `PUT /addresses/:id` — update
- [ ] `[BE]` `DELETE /addresses/:id`
- [ ] `[BE]` All routes auth-protected

### Mobile — address picker

- [ ] `[MOB]` **AddressBook screen** — list saved addresses, set default, delete
- [ ] `[MOB]` **Add/Edit Address** — form + map (`react-native-maps` + `expo-location`)
  - Capture `lat`/`lng`
- [ ] `[MOB]` Checkout address selection step

### API — delivery slots

- [ ] `[BE]` `GET /delivery-slots` — query: `date` (optional, default today onward)
  - Return slots where `bookedCount < capacity` and `isActive`
- [ ] `[BE]` Slot availability logic documented in API

### Mobile — delivery slots

- [ ] `[MOB]` **Delivery slot picker** — date tabs + time windows
- [ ] `[MOB]` Disable full slots

### API — delivery fee

- [ ] `[BE]` Load `DeliveryConfig` singleton
- [ ] `[BE]` Haversine distance: store → delivery address
- [ ] `[BE]` Apply fee formula per [database-design.md](../database-design.md):
  - Out of range if `distanceKm > maxDistanceKm`
  - Free if `subtotal >= freeAboveSubtotal`
  - Else `clamp(baseFee + perKmFee * distanceKm, minFee, maxFee)`
- [ ] `[BE]` `POST /orders/preview` (optional) — return subtotal, discount, deliveryFee, total without creating order

### API — order placement (COD)

- [ ] `[BE]` `POST /orders` — body: `{ items[], addressId, slotId, couponCode? }`
  - Auth required
  - **Server-side** recompute: subtotal, coupon discount, delivery fee, total
  - Validate stock for each item; reject if insufficient
  - Snapshot address + slot as JSON on `Order`
  - Snapshot `name`, `unit`, `price` on each `OrderItem`
  - Decrement `Product.stock` in transaction
  - Increment `DeliverySlot.bookedCount`
  - Increment coupon `usedCount` if applied
  - `paymentMethod = COD`, `paymentStatus = PENDING`, `status = PLACED`
- [ ] `[BE]` BullMQ: enqueue `order:created` notification job on success
- [ ] `[BE]` Return created order with items

### Mobile — checkout flow

- [ ] `[MOB]` Multi-step or single-screen checkout:
  1. Review cart
  2. Select address
  3. Select delivery slot
  4. Apply coupon (if not on cart)
  5. Order summary (subtotal, discount, delivery fee, total)
  6. Place order (COD)
- [ ] `[MOB]` `orderApi.placeOrder` (RTK Query mutation)
- [ ] `[MOB]` On success: clear cart → navigate to order confirmation / Orders tab
- [ ] `[MOB]` Handle out-of-range address and out-of-stock errors clearly

### Verification

- [ ] `[QA]` Add 3+ items → valid coupon → address → slot → place order
- [ ] `[QA]` Verify order in DB (Prisma Studio): snapshots, totals, stock decremented
- [ ] `[QA]` Invalid coupon shows error; expired coupon rejected
- [ ] `[QA]` Kill app with items in cart → relaunch → cart restored

---

## End-Goal Checklist

Mark Phase 3 complete when **all** items are checked:

- [ ] Full happy path: cart → coupon → address → slot → COD order succeeds
- [ ] Order + items persisted; stock decremented; slot `bookedCount` incremented
- [ ] Totals computed **server-side** (client cannot trust submitted totals)
- [ ] Delivery fee computed from `DeliveryConfig` and distance
- [ ] Cart survives app restart (redux-persist)
- [ ] Invalid/expired/over-limit coupons rejected with clear UX message
- [ ] BullMQ job enqueued on order create (visible in Redis/worker logs)

---

## Test coupons (after seed)

| Code | Type | Value |
|------|------|-------|
| `WELCOME10` | 10% off | min order applies |
| `FRESH50` | ₹50 flat | |
| `SAVE15` | 15% off | |
