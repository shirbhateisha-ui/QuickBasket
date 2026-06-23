import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Category, Paginated, Product } from '@quickbasket/types';

// Expo inlines EXPO_PUBLIC_* at bundle time (including workspace packages).
const baseUrl = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export interface ProductsQuery {
  categoryId?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}

function toParams(q: ProductsQuery = {}): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  if (q.categoryId) params.categoryId = q.categoryId;
  if (q.search) params.search = q.search;
  if (q.featured !== undefined) params.featured = q.featured ? 'true' : 'false';
  if (q.page) params.page = q.page;
  if (q.limit) params.limit = q.limit;
  return params;
}

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: fetchBaseQuery({ baseUrl }),
  tagTypes: ['Products', 'Categories'],
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => '/categories',
      providesTags: ['Categories'],
    }),
    getProducts: builder.query<Paginated<Product>, ProductsQuery | void>({
      query: (q) => ({ url: '/products', params: toParams(q ?? {}) }),
      providesTags: ['Products'],
    }),
    getProductById: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
    }),
  }),
});

export const { useGetCategoriesQuery, useGetProductsQuery, useGetProductByIdQuery } = productApi;
