# QuickBasket — Database Setup & Seed Guide

A step-by-step runbook to stand up the PostgreSQL database, apply the schema, and load seed data.

**Schema:** [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma)
**Seed:** [`apps/api/prisma/seed.ts`](../apps/api/prisma/seed.ts)
**Design reference:** [database-design.md](./database-design.md)
**Last updated:** 2026-06-22

---

## 1. Prerequisites

- **Node.js 24 LTS** + **pnpm** installed.
- A **PostgreSQL 14+** database — either:
  - **Local:** Postgres installed, or via Docker (see §2), or
  - **Hosted:** Railway / Supabase / Render — copy the connection string.
- Working directory for all commands below: **`apps/api`**.

> The API app is scaffolded in Phase 1. If `apps/api` has no `package.json` yet, do the
> minimal setup in §3 first.

---

## 2. (Option A) Run PostgreSQL locally with Docker

```bash
docker run --name quickbasket-db \
  -e POSTGRES_USER=quickbasket \
  -e POSTGRES_PASSWORD=quickbasket \
  -e POSTGRES_DB=quickbasket \
  -p 5432:5432 \
  -d postgres:16
```

Connection string for this container:
```
postgresql://quickbasket:quickbasket@localhost:5432/quickbasket
```

To stop / start / remove later:
```bash
docker stop quickbasket-db
docker start quickbasket-db
docker rm -f quickbasket-db        # deletes the container (data lost)
```

**(Option B) Hosted DB:** create a Postgres instance on your provider and copy its connection
string — skip Docker entirely.

---

## 3. Install dependencies

From `apps/api`:

```bash
pnpm add @prisma/client argon2
pnpm add -D prisma tsx
```

| Package | Why |
|---|---|
| `@prisma/client` | generated DB client |
| `argon2` | password hashing used by the seed |
| `prisma` | CLI (migrate, generate, studio) |
| `tsx` | runs the TypeScript seed file |

Register the seed command in **`apps/api/package.json`**:

```jsonc
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  },
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate"
  }
}
```

---

## 4. Configure the connection string

Create **`apps/api/.env`** (never commit this — it's git-ignored):

```bash
DATABASE_URL="postgresql://quickbasket:quickbasket@localhost:5432/quickbasket"
```

Replace with your hosted connection string if using Option B.

---

## 5. Apply the schema (migrate)

Creates all tables from the Prisma schema and generates the client:

```bash
pnpm db:migrate --name init
# (equivalent to: prisma migrate dev --name init)
```

This produces a migration under `apps/api/prisma/migrations/` and updates the database.
Run `pnpm db:generate` separately if you only changed the client, not the schema.

---

## 6. Seed the data

```bash
pnpm db:seed
```

Expected output:

```
Seeding QuickBasket database...
✓ Users: customer 9999900001, staff 9999900002 (password: Password@123)
✓ Catalog: 6 categories, 107 products
✓ Coupons: WELCOME10, FRESH50, SAVE15
✓ Delivery slots: 28 across 7 days
✓ Promotions: 3 banners
✓ Delivery config: ₹20 base + ₹8/km, free over ₹999, 10 km radius
Done.
```

The seed is **idempotent** — it upserts on unique keys, so re-running it won't create duplicates.

---

## 7. What gets seeded

| Data | Details |
|---|---|
| **Users** | `9999900001` (CUSTOMER) · `9999900002` (STAFF) — password **`Password@123`** |
| **Address** | 1 default address for the customer (Pune) |
| **Categories** | 6 (Fruits & Veg, Dairy & Eggs, Bakery & Snacks, Staples & Grains, Beverages, Household) |
| **Products** | 100+, varied stock (some low-stock = 3, some out-of-stock = 0); first 2 per category featured |
| **Coupons** | `WELCOME10` (10%), `FRESH50` (₹50), `SAVE15` (15%) |
| **Delivery slots** | 4 windows/day × 7 days |
| **Promotions** | 3 Home banners |
| **Delivery config** | ₹20 base + ₹8/km, capped ₹120, free over ₹999, 10 km radius |

---

## 8. Verify

Open Prisma Studio to browse the data visually:

```bash
pnpm db:studio        # opens http://localhost:5555
```

Or a quick SQL check:

```bash
psql "$DATABASE_URL" -c "SELECT name, COUNT(*) FROM products p JOIN categories c ON c.id=p.\"categoryId\" GROUP BY name;"
```

---

## 9. Resetting the database

Drops, recreates, re-migrates, and re-runs the seed (destructive — dev only):

```bash
pnpm db:reset
```

`prisma migrate reset` automatically runs the seed afterward.

---

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| `Can't reach database server` | DB not running / wrong host:port. Check Docker container or hosted status. |
| `Environment variable not found: DATABASE_URL` | `.env` missing or not in `apps/api`. |
| `argon2` install/build error | Needs build tools; on Windows ensure VS Build Tools, or use `@node-rs/argon2` as a drop-in. |
| Seed runs but no rows | Confirm `"prisma": { "seed": ... }` is in `apps/api/package.json`. |
| `P3009` failed migration | `prisma migrate reset` (dev) to clear and re-apply. |
| Unique constraint on re-seed | Shouldn't happen (idempotent); if it does, reset and re-seed. |

---

## 11. Production notes

- Use **`prisma migrate deploy`** (not `migrate dev`) in CI/CD — it applies committed migrations without prompting.
- **Do not** run the seed against production with the test users/credentials. Gate seeding to non-prod, or maintain a separate production seed (real store data, no `Password@123` accounts).
- Set `DATABASE_URL` via the host's secret manager, never in a committed file.
