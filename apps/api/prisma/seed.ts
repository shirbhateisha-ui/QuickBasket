/**
 * QuickBasket — database seed
 *
 * Seeds: 1 customer + 1 staff user, 6 categories, 100+ products, coupons,
 * 7 days of delivery slots, and promotion banners.
 *
 * Run:  pnpm --filter @quickbasket/api prisma db seed
 *   or  npx prisma db seed   (from apps/api)
 *
 * Configure in apps/api/package.json:
 *   "prisma": { "seed": "tsx prisma/seed.ts" }
 *
 * Idempotent: uses upsert / deterministic slugs so re-running won't duplicate.
 */

import { PrismaClient, CouponType } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Stable placeholder image (swap for real R2 URLs later).
const img = (seed: string) => `https://picsum.photos/seed/${slugify(seed)}/600/600`;

// ----------------------------------------------------------------------------
// Catalog definition — categories with their products.
// price/mrp generated with a realistic discount; stock varied to exercise the
// low-stock badge ("Only 3 left").
// ----------------------------------------------------------------------------

type ProductSpec = { name: string; unit: string; basePrice: number };

const CATALOG: { category: string; products: ProductSpec[] }[] = [
  {
    category: "Fruits & Vegetables",
    products: [
      { name: "Bananas", unit: "1 dozen", basePrice: 60 },
      { name: "Apples (Shimla)", unit: "1 kg", basePrice: 180 },
      { name: "Tomatoes", unit: "1 kg", basePrice: 40 },
      { name: "Onions", unit: "1 kg", basePrice: 35 },
      { name: "Potatoes", unit: "1 kg", basePrice: 30 },
      { name: "Spinach", unit: "1 bunch", basePrice: 25 },
      { name: "Carrots", unit: "500 g", basePrice: 35 },
      { name: "Green Capsicum", unit: "500 g", basePrice: 45 },
      { name: "Cucumber", unit: "500 g", basePrice: 30 },
      { name: "Lemons", unit: "250 g", basePrice: 30 },
      { name: "Oranges", unit: "1 kg", basePrice: 90 },
      { name: "Grapes (Green)", unit: "500 g", basePrice: 70 },
      { name: "Pomegranate", unit: "1 kg", basePrice: 160 },
      { name: "Cauliflower", unit: "1 pc", basePrice: 40 },
      { name: "Green Peas", unit: "500 g", basePrice: 55 },
    ],
  },
  {
    category: "Dairy & Eggs",
    products: [
      { name: "Full Cream Milk", unit: "1 L", basePrice: 66 },
      { name: "Toned Milk", unit: "1 L", basePrice: 54 },
      { name: "Paneer", unit: "200 g", basePrice: 90 },
      { name: "Curd", unit: "500 g", basePrice: 35 },
      { name: "Butter", unit: "100 g", basePrice: 56 },
      { name: "Cheese Slices", unit: "200 g", basePrice: 130 },
      { name: "Farm Eggs", unit: "6 pcs", basePrice: 48 },
      { name: "Farm Eggs", unit: "12 pcs", basePrice: 90 },
      { name: "Fresh Cream", unit: "200 ml", basePrice: 70 },
      { name: "Ghee", unit: "500 ml", basePrice: 320 },
      { name: "Lassi", unit: "200 ml", basePrice: 25 },
      { name: "Flavoured Yogurt", unit: "100 g", basePrice: 30 },
    ],
  },
  {
    category: "Bakery & Snacks",
    products: [
      { name: "Brown Bread", unit: "400 g", basePrice: 45 },
      { name: "White Bread", unit: "400 g", basePrice: 40 },
      { name: "Multigrain Bread", unit: "400 g", basePrice: 55 },
      { name: "Butter Croissant", unit: "2 pcs", basePrice: 80 },
      { name: "Chocolate Cookies", unit: "150 g", basePrice: 60 },
      { name: "Potato Chips (Salted)", unit: "90 g", basePrice: 30 },
      { name: "Nachos", unit: "150 g", basePrice: 75 },
      { name: "Salted Peanuts", unit: "200 g", basePrice: 50 },
      { name: "Rusk Toast", unit: "300 g", basePrice: 45 },
      { name: "Digestive Biscuits", unit: "250 g", basePrice: 55 },
      { name: "Namkeen Mixture", unit: "200 g", basePrice: 60 },
      { name: "Muffins", unit: "4 pcs", basePrice: 90 },
    ],
  },
  {
    category: "Staples & Grains",
    products: [
      { name: "Basmati Rice", unit: "1 kg", basePrice: 120 },
      { name: "Sona Masoori Rice", unit: "5 kg", basePrice: 320 },
      { name: "Whole Wheat Atta", unit: "5 kg", basePrice: 250 },
      { name: "Toor Dal", unit: "1 kg", basePrice: 140 },
      { name: "Moong Dal", unit: "1 kg", basePrice: 130 },
      { name: "Chana Dal", unit: "1 kg", basePrice: 95 },
      { name: "Sugar", unit: "1 kg", basePrice: 45 },
      { name: "Salt (Iodised)", unit: "1 kg", basePrice: 25 },
      { name: "Sunflower Oil", unit: "1 L", basePrice: 140 },
      { name: "Mustard Oil", unit: "1 L", basePrice: 160 },
      { name: "Poha", unit: "500 g", basePrice: 40 },
      { name: "Semolina (Rava)", unit: "500 g", basePrice: 35 },
      { name: "Besan", unit: "500 g", basePrice: 55 },
      { name: "Rajma", unit: "500 g", basePrice: 90 },
    ],
  },
  {
    category: "Beverages",
    products: [
      { name: "Orange Juice", unit: "1 L", basePrice: 110 },
      { name: "Mango Drink", unit: "1 L", basePrice: 90 },
      { name: "Cola", unit: "750 ml", basePrice: 40 },
      { name: "Lemon Soda", unit: "750 ml", basePrice: 40 },
      { name: "Green Tea Bags", unit: "25 pcs", basePrice: 150 },
      { name: "Instant Coffee", unit: "100 g", basePrice: 290 },
      { name: "Tea Powder", unit: "500 g", basePrice: 240 },
      { name: "Mineral Water", unit: "1 L", basePrice: 20 },
      { name: "Energy Drink", unit: "250 ml", basePrice: 110 },
      { name: "Coconut Water", unit: "200 ml", basePrice: 35 },
      { name: "Cold Brew", unit: "200 ml", basePrice: 120 },
      { name: "Buttermilk", unit: "1 L", basePrice: 50 },
    ],
  },
  {
    category: "Household & Cleaning",
    products: [
      { name: "Dishwash Liquid", unit: "500 ml", basePrice: 99 },
      { name: "Detergent Powder", unit: "1 kg", basePrice: 120 },
      { name: "Floor Cleaner", unit: "1 L", basePrice: 95 },
      { name: "Toilet Cleaner", unit: "500 ml", basePrice: 85 },
      { name: "Hand Wash", unit: "200 ml", basePrice: 60 },
      { name: "Bath Soap", unit: "4 x 100 g", basePrice: 140 },
      { name: "Shampoo", unit: "340 ml", basePrice: 230 },
      { name: "Toothpaste", unit: "150 g", basePrice: 95 },
      { name: "Garbage Bags", unit: "30 pcs", basePrice: 110 },
      { name: "Tissue Roll", unit: "4 pcs", basePrice: 120 },
      { name: "Aluminium Foil", unit: "9 m", basePrice: 80 },
      { name: "Mosquito Repellent", unit: "45 ml", basePrice: 75 },
    ],
  },
];

async function seedUsers() {
  const passwordHash = await argon2.hash("Password@123");

  const customer = await prisma.user.upsert({
    where: { phone: "9999900001" },
    update: {},
    create: {
      phone: "9999900001",
      name: "Test Customer",
      passwordHash,
      role: "CUSTOMER",
    },
  });

  const staff = await prisma.user.upsert({
    where: { phone: "9999900002" },
    update: {},
    create: {
      phone: "9999900002",
      name: "Store Staff",
      passwordHash,
      role: "STAFF",
    },
  });

  await prisma.address.upsert({
    where: { id: "seed-addr-1" },
    update: {},
    create: {
      id: "seed-addr-1",
      userId: customer.id,
      label: "Home",
      line1: "12, MG Road",
      line2: "Near City Mall",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411001",
      lat: 18.5204,
      lng: 73.8567,
      isDefault: true,
    },
  });

  console.log(`✓ Users: customer ${customer.phone}, staff ${staff.phone} (password: Password@123)`);
}

async function seedCatalog() {
  let productCount = 0;

  for (let c = 0; c < CATALOG.length; c++) {
    const { category, products } = CATALOG[c];
    const cat = await prisma.category.upsert({
      where: { slug: slugify(category) },
      update: {},
      create: {
        name: category,
        slug: slugify(category),
        image: img(category),
        sortOrder: c,
      },
    });

    for (let p = 0; p < products.length; p++) {
      const spec = products[p];
      // Slug must be unique even when a name repeats (e.g. Farm Eggs 6/12 pcs).
      const slug = slugify(`${spec.name}-${spec.unit}`);
      const price = spec.basePrice;
      const mrp = Math.round(price * 1.18); // ~15% off display
      // Vary stock: every 7th item is low-stock, every 13th is out of stock.
      const stock = p % 13 === 0 ? 0 : p % 7 === 0 ? 3 : 25 + ((p * 7) % 60);

      await prisma.product.upsert({
        where: { slug },
        update: { price, mrp, stock },
        create: {
          name: spec.name,
          slug,
          description: `${spec.name} — ${spec.unit}. Fresh quality, sourced daily.`,
          price,
          mrp,
          stock,
          unit: spec.unit,
          images: [img(slug), img(`${slug}-2`)],
          categoryId: cat.id,
          isFeatured: p < 2, // first two per category featured on Home
        },
      });
      productCount++;
    }
  }

  console.log(`✓ Catalog: ${CATALOG.length} categories, ${productCount} products`);
}

async function seedCoupons() {
  const now = new Date("2026-01-01T00:00:00Z");
  const end = new Date("2026-12-31T23:59:59Z");

  const coupons = [
    { code: "WELCOME10", type: CouponType.PERCENT, value: 10, minOrder: 199, maxDiscount: 100 },
    { code: "FRESH50", type: CouponType.FLAT, value: 50, minOrder: 499 },
    { code: "SAVE15", type: CouponType.PERCENT, value: 15, minOrder: 799, maxDiscount: 200 },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, startsAt: now, endsAt: end, usageLimit: 1000 },
    });
  }
  console.log(`✓ Coupons: ${coupons.map((c) => c.code).join(", ")}`);
}

async function seedDeliverySlots() {
  // 7 days of slots starting from a fixed base date (kept deterministic for idempotent seeds).
  const base = new Date("2026-06-23T00:00:00Z");
  const windows = [
    { startTime: "09:00", endTime: "11:00" },
    { startTime: "11:00", endTime: "13:00" },
    { startTime: "15:00", endTime: "17:00" },
    { startTime: "18:00", endTime: "20:00" },
  ];

  let count = 0;
  for (let d = 0; d < 7; d++) {
    const date = new Date(base);
    date.setUTCDate(base.getUTCDate() + d);
    for (const w of windows) {
      await prisma.deliverySlot.upsert({
        where: { date_startTime_endTime: { date, startTime: w.startTime, endTime: w.endTime } },
        update: {},
        create: { date, startTime: w.startTime, endTime: w.endTime, capacity: 20 },
      });
      count++;
    }
  }
  console.log(`✓ Delivery slots: ${count} across 7 days`);
}

async function seedPromotions() {
  const start = new Date("2026-01-01T00:00:00Z");
  const end = new Date("2026-12-31T23:59:59Z");
  const promos = [
    { title: "Fresh Veggies — Up to 20% Off", link: "fruits-vegetables", sortOrder: 0 },
    { title: "Dairy Specials This Week", link: "dairy-eggs", sortOrder: 1 },
    { title: "Stock Up on Staples", link: "staples-grains", sortOrder: 2 },
  ];

  for (const p of promos) {
    await prisma.promotion.upsert({
      where: { id: `seed-promo-${p.sortOrder}` },
      update: {},
      create: { id: `seed-promo-${p.sortOrder}`, image: img(p.title), startsAt: start, endsAt: end, ...p },
    });
  }
  console.log(`✓ Promotions: ${promos.length} banners`);
}

async function seedDeliveryConfig() {
  // Store origin = the seeded customer's city (Pune) so distances are realistic.
  await prisma.deliveryConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      storeLat: 18.5204,
      storeLng: 73.8567,
      baseFee: 20, // flat pickup/handling
      perKmFee: 8, // ₹8 per km
      minFee: 20, // never charge below base
      maxFee: 120, // cap the per-km fee
      freeAboveSubtotal: 999, // free delivery on big carts
      maxDistanceKm: 10, // serviceable radius
      roundUpKm: true,
    },
  });
  console.log("✓ Delivery config: ₹20 base + ₹8/km, free over ₹999, 10 km radius");
}

async function main() {
  console.log("Seeding QuickBasket database...");
  await seedUsers();
  await seedCatalog();
  await seedCoupons();
  await seedDeliverySlots();
  await seedPromotions();
  await seedDeliveryConfig();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
