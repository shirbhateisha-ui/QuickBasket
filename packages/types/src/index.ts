// Shared TypeScript contracts used by both the API and the mobile app.

export type UserRole = 'CUSTOMER' | 'STAFF';

export interface PublicUser {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  isDefault: boolean;
}

// ---- Catalog ---------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  sortOrder: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  mrp: number;
  discountPercent: number;
  stock: number;
  unit: string;
  images: string[];
  categoryId: string;
  isFeatured: boolean;
  category?: Pick<Category, 'id' | 'name' | 'slug'>;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

// Consistent error envelope returned by the API.
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ---- Request DTOs ----------------------------------------------------------

export interface RegisterDto {
  phone: string;
  name: string;
  password: string;
}

export interface LoginDto {
  phone: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}
