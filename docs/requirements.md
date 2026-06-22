# QuickBasket — Requirements

**Project:** Single-store grocery app (customer-facing)
**Platforms:** iOS · Android · Web (one React Native codebase)

---

## 1. Overview

QuickBasket is a production-grade, branded mobile app for a **single grocery store**. Customers
browse the catalog, add items to a cart, check out with a delivery address and time slot, pay
**cash on delivery**, and track their order in real time. The backend is custom-built — no
third-party commerce platform.

**In scope:** customer app only.
**Out of scope (this release):** delivery-partner app, admin/staff portal, online payments, OTP login.

---

## 2. Business Requirements

- Single grocery store — one shop, their own branded app.
- Customer-facing app only (no delivery-partner or admin portal in scope).
- Cross-platform — iOS, Android, and Web from one codebase.
- Custom backend built from scratch — no third-party commerce platform.

---

## 3. Functional Requirements

| #     | Requirement                                                                                    |
| ----- | ---------------------------------------------------------------------------------------------- |
| FR-1  | Register and log in with **phone number + password** (passwords hashed, JWT + refresh tokens). |
| FR-2  | Browse products by category with search and filters.                                           |
| FR-3  | Product detail with images, unit info (500g, 1L, dozen), price, MRP/discount, and stock.       |
| FR-4  | Add to cart, update quantity, remove items; cart persists across app restarts (offline).       |
| FR-5  | Apply coupon codes at checkout.                                                                |
| FR-6  | Select a delivery address and time slot before placing an order.                               |
| FR-7  | Place orders with **Cash on Delivery** as the only payment method.                             |
| FR-8  | Real-time order tracking from placement to delivery.                                           |
| FR-9  | View order history and reorder with one tap.                                                   |
| FR-10 | Push notifications for each order status change.                                               |

**Order lifecycle:** `PLACED → CONFIRMED → PACKED → OUT_FOR_DELIVERY → DELIVERED` (or `CANCELLED`).
Each transition emits a real-time event and a push notification.

---

## 4. Non-Functional Requirements

- Product list renders 100+ items smoothly (60 fps).
- App cold start under 2 seconds on mid-range devices.
- Auth tokens stored securely (secure-store, **not** AsyncStorage).
- Cart state persisted across app restarts.
- API responses cached to support offline browsing.
- Crash reporting and error monitoring from day one.

---

## 5. Key Decisions

- **Authentication:** phone + password for launch. Password reset is admin/manual for now
  (no self-service reset until OTP lands).
- **Payments:** Cash on Delivery only. `Order.paymentMethod = "COD"`, `paymentStatus ∈ {PENDING, COLLECTED}`.
- **No admin app:** staff status transitions (CONFIRMED/PACKED/…) are handled by a minimal
  internal endpoint until a proper admin tool exists.

---

## 6. Future Scope (deferred)

| Feature                      | Notes                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| **OTP login**                | Via MSG91 (India) behind the existing `/auth/*` contract; needs DLT registration lead time. |
| **OTP-based password reset** | Self-service `forgot-password` / `reset` flow.                                              |
| **Online payments**          | Likely Razorpay; adds `Payment` model, gateway integration, payment-status flow.            |
| **Admin / staff portal**     | Replaces the interim internal status-transition endpoint.                                   |
| **Delivery-partner app**     | Separate app for the delivery side.                                                         |
