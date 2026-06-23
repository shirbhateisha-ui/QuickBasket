import type { FastifyInstance } from 'fastify';
import type { Prisma, Product as PrismaProduct, Category as PrismaCategory } from '@prisma/client';
import type { Category, Paginated, Product } from '@quickbasket/types';
import { discountPercent } from '@quickbasket/utils';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { cacheGetOrSet } from '../lib/cache.js';
import { NotFound } from '../lib/errors.js';

const ListQuery = z.object({
  categoryId: z.string().optional(),
  search: z.string().trim().min(1).optional(),
  featured: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

type ProductWithCategory = PrismaProduct & {
  category: Pick<PrismaCategory, 'id' | 'name' | 'slug'> | null;
};

function toCategoryDto(c: PrismaCategory): Category {
  return { id: c.id, name: c.name, slug: c.slug, image: c.image, sortOrder: c.sortOrder };
}

function toProductDto(p: ProductWithCategory): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    mrp: p.mrp,
    discountPercent: discountPercent(p.price, p.mrp),
    stock: p.stock,
    unit: p.unit,
    images: p.images,
    categoryId: p.categoryId,
    isFeatured: p.isFeatured,
    category: p.category ?? undefined,
  };
}

export async function catalogRoutes(app: FastifyInstance): Promise<void> {
  app.get('/categories', async (req) => {
    return cacheGetOrSet<Category[]>(
      'categories:active',
      300,
      async () => {
        const cats = await prisma.category.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
        return cats.map(toCategoryDto);
      },
      (event, key) => req.log.debug(`[cache ${event}] ${key}`),
    );
  });

  app.get('/products', async (req) => {
    const q = ListQuery.parse(req.query);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(q.categoryId ? { categoryId: q.categoryId } : {}),
      ...(q.featured ? { isFeatured: q.featured === 'true' } : {}),
      ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
    };

    const key = `products:${JSON.stringify(q)}`;
    return cacheGetOrSet<Paginated<Product>>(
      key,
      120,
      async () => {
        const [total, rows] = await Promise.all([
          prisma.product.count({ where }),
          prisma.product.findMany({
            where,
            orderBy: [{ isFeatured: 'desc' }, { name: 'asc' }],
            skip: (q.page - 1) * q.limit,
            take: q.limit,
            include: { category: { select: { id: true, name: true, slug: true } } },
          }),
        ]);
        return {
          items: rows.map(toProductDto),
          page: q.page,
          limit: q.limit,
          total,
          hasMore: q.page * q.limit < total,
        };
      },
      (event, k) => req.log.debug(`[cache ${event}] ${k}`),
    );
  });

  app.get('/products/:id', async (req) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
    if (!product) throw NotFound('Product not found');
    return toProductDto(product);
  });
}
