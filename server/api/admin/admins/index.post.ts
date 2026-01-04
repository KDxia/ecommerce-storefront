import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db } from '../../../db'
import { admins } from '../../../db/schema'
import { hashPassword, requireAdmin, requireRole } from '../../../utils/adminAuth'

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  role: z.enum(['owner', 'admin', 'support', 'viewer']).default('admin'),
})

export default defineEventHandler(async (event) => {
  const current = await requireAdmin(event)
  requireRole(current, ['owner'])

  const body = BodySchema.parse(await readBody(event))
  const email = body.email.toLowerCase()

  const existing = await db.select({ id: admins.id }).from(admins).where(eq(admins.email, email)).limit(1)
  if (existing.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Email already exists' })
  }

  const passwordHash = await hashPassword(body.password)

  const inserted = await db
    .insert(admins)
    .values({
      email,
      passwordHash,
      role: body.role,
      status: 'active',
    })
    .returning({ id: admins.id, email: admins.email, role: admins.role, status: admins.status })

  return { ok: true, admin: inserted[0] }
})
