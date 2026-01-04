import crypto from 'node:crypto'
import { eq, and, isNull, gt } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import type { H3Event } from 'h3'
import {
  createError,
  getCookie,
  setCookie,
  deleteCookie,
  getRequestHeader,
} from 'h3'

import { db } from '../db'
import { admins, adminSessions } from '../db/schema'


const SESSION_COOKIE = 'admin_session'
const SESSION_DAYS = 14

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function hashPassword(password: string) {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function clearAdminSessionCookie(event: H3Event) {
  deleteCookie(event, SESSION_COOKIE, {
    path: '/',
  })
}

export async function createAdminSession(
  event: H3Event,
  adminId: string,
  opts?: { expiresDays?: number },
) {
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = sha256Hex(token)

  const expiresDays = opts?.expiresDays ?? SESSION_DAYS
  const expiresAt = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)

  const ip =
    getRequestHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim() || null
  const userAgent = getRequestHeader(event, 'user-agent') || null

  await db.insert(adminSessions).values({
    adminId,
    sessionTokenHash: tokenHash,
    expiresAt,
    ip,
    userAgent,
  })

  setCookie(event, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  })
}

export async function revokeCurrentAdminSession(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) {
    clearAdminSessionCookie(event)
    return
  }

  const tokenHash = sha256Hex(token)

  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessions.sessionTokenHash, tokenHash), isNull(adminSessions.revokedAt)))

  clearAdminSessionCookie(event)
}

export async function requireAdmin(event: H3Event) {
  const token = getCookie(event, SESSION_COOKIE)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const tokenHash = sha256Hex(token)
  const now = new Date()

  const rows = await db
    .select({
      id: admins.id,
      email: admins.email,
      role: admins.role,
      status: admins.status,
    })
    .from(adminSessions)
    .innerJoin(admins, eq(adminSessions.adminId, admins.id))
    .where(
      and(
        eq(adminSessions.sessionTokenHash, tokenHash),
        isNull(adminSessions.revokedAt),
        gt(adminSessions.expiresAt, now),
        eq(admins.status, 'active'),
      ),
    )
    .limit(1)

  const admin = rows[0]
  if (!admin) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid session' })
  }

  return admin
}


export function requireRole(admin: { role: string }, allowed: string[]) {
  if (!allowed.includes(admin.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
}
