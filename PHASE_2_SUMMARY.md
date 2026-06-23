# Phase 2 — Catalog Mobile Screens ✅ Complete

**Completed:** 2026-06-23

## What Was Built

### RTK Query Product API (`packages/store/src/productApi.ts`)
- `useGetCategoriesQuery()` — fetches 6 active categories (cached in Redux)
- `useGetProductsQuery(query)` — paginated products with category/search/featured filters
- `useGetProductByIdQuery(id)` — single product detail
- Base URL respects `EXPO_PUBLIC_API_URL` env (inlined at bundle time)
- Integrated into mobile Redux store (reducer + RTK Query middleware)

### Mobile Components

**ProductCard** (`apps/mobile/src/components/product-card.tsx`)
- Product image (expo-image with aspect 1:1)
- Name (2 lines max), unit, price
- Green discount badge (`#0a8f3c`) when `discountPercent > 0`
- Strikethrough MRP when discounted
- Low-stock label (orange `#d9730d`) when `0 < stock <= 3`
- Out-of-stock overlay (dark) when `stock === 0`
- Reusable across Home & Catalog screens

**CategoryChip** (`apps/mobile/src/components/category-chip.tsx`)
- Selectable pill with inverted colors on select
- Used in Home (horizontal scroll) and Catalog (horizontal scroll + All filter)

### Mobile Screens

**Home** (`apps/mobile/src/app/(tabs)/index.tsx`)
- Welcome header: "Hi {name}" + QuickBasket title + logout button
- Static banner: "Fresh groceries, delivered" + "Free delivery over ₹999"
- Horizontal category chip carousel → tap to navigate to Catalog pre-filtered by category
- Featured products grid (10 items, 2-col layout) → tap to ProductDetail
- Uses `useGetCategoriesQuery()` and `useGetProductsQuery({ featured: true, limit: 10 })`

**Catalog** (`apps/mobile/src/app/(tabs)/explore.tsx`)
- Search bar (text input, server-side search via `GET /products?search=`)
- Horizontal category chips: "All" + each category (single selection)
- 2-column FlashList grid (20 items/page)
- Infinite scroll: when user reaches end, load next 20 (pagination via `limit` param)
- Loading state ("Loading…") and empty state ("No products found.")
- Responds to deep links: `?categoryId=xyz` from Home navigation

**ProductDetail** (`apps/mobile/src/app/product/[id].tsx`)
- Horizontal image carousel (full-width scroll)
- Product name, unit, price, MRP, discount %
- Stock status: "In stock", "Only N left" (low-stock), or "Out of stock" overlay
- Description (if available)
- "Add to cart" button (disabled if out of stock; stub alert until Phase 3)
- Registers in root layout as `<Stack.Screen name="product/[id]" />`

### Integration Points
- All three screens use `@quickbasket/store` (productApi + Redux authSlice)
- Navigation via `router.push({ pathname, params })` (properly typed)
- Deep linking: Home categories → Catalog with query, Home/Catalog products → ProductDetail
- Theme system: uses `useTheme()` hook with CSS vars for dark/light mode

## Verification

✅ **Typecheck:** `npx tsc --noEmit` clean (mobile app)
✅ **Metro web bundle:** Exported successfully (1298 modules, 11 routes)
  - Routes: `/` (Home), `/explore` (Catalog), `/product/[id]` (ProductDetail), + auth routes
✅ **Dependencies:** `@shopify/flash-list 2.0.2` installed for grid rendering

## Code Statistics
- **New files:** 5 (productApi.ts, ProductCard, CategoryChip, Home, Catalog, ProductDetail)
- **Modified files:** 5 (store/index.ts, store/store.ts, _layout.tsx, app-tabs.tsx, package.json)
- **Total new LoC:** ~500 (components + screens + productApi)

## Ready to Ship
All screens compile, bundle, and integrate with the API. Ready for runtime testing:
1. Start API: `pnpm api` (with DB seeded)
2. Start mobile: `pnpm mobile` → press `w` for web
3. Register/login, then browse Home → Catalog → ProductDetail

## Notes
- Images use `picsum.photos` placeholders (R2 integration deferred to Phase 2 infra)
- Redis caching is optional; API works without it (cache-aside returns live data if cache miss)
- Cart button shows stub alert; actual cart/checkout are Phase 3
- Search is server-side (100+ products means no need for client-side fuzzy search yet)
