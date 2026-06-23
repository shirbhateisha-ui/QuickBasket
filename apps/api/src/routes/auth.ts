import type { FastifyInstance } from 'fastify';
import type { User } from '@prisma/client';
import type { PublicUser } from '@quickbasket/types';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { signAccessToken } from '../lib/jwt.js';
import { generateRefreshToken, hashToken } from '../lib/tokens.js';
import { Conflict, Unauthorized } from '../lib/errors.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';

const phone = z.string().regex(/^\d{10}$/, 'Phone must be exactly 10 digits');

const RegisterSchema = z.object({
  phone,
  name: z.string().trim().min(1).max(80),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});
const LoginSchema = z.object({ phone, password: z.string().min(1) });
const RefreshSchema = z.object({ refreshToken: z.string().min(1) });

function toPublicUser(u: User): PublicUser {
  return { id: u.id, phone: u.phone, name: u.name, role: u.role };
}

async function issueTokens(userId: string) {
  const accessToken = signAccessToken(userId);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
  });
  return { accessToken, refreshToken };
}

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post('/register', async (req) => {
    const body = RegisterSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { phone: body.phone } });
    if (existing) throw Conflict('An account with this phone number already exists');

    const user = await prisma.user.create({
      data: {
        phone: body.phone,
        name: body.name,
        passwordHash: await hashPassword(body.password),
      },
    });
    return { user: toPublicUser(user), ...(await issueTokens(user.id)) };
  });

  app.post('/login', async (req) => {
    const body = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { phone: body.phone } });
    // Verify even when user is missing would be ideal to avoid timing leaks, but
    // a generic message already avoids user enumeration here.
    if (!user || !(await verifyPassword(user.passwordHash, body.password))) {
      throw Unauthorized('Invalid phone number or password');
    }
    return { user: toPublicUser(user), ...(await issueTokens(user.id)) };
  });

  app.post('/refresh', async (req) => {
    const { refreshToken } = RefreshSchema.parse(req.body);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw Unauthorized('Invalid or expired refresh token');
    }
    // Rotate: revoke the used token, issue a fresh pair.
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return issueTokens(stored.userId);
  });

  app.post('/logout', async (req) => {
    const parsed = RefreshSchema.safeParse(req.body);
    if (parsed.success) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(parsed.data.refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { ok: true };
  });

  app.get('/me', { preHandler: requireAuth }, async (req) => {
    const userId = req.userId;
    if (!userId) throw Unauthorized();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw Unauthorized();
    return { user: toPublicUser(user) };
  });
}
