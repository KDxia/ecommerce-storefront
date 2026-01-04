import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db } from '../../db'
import { admins } from '../../db/schema'
import { createAdminSession, verifyPassword } from '../../utils/adminAuth'

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = BodySchema.parse(await readBody(event))
  const email = body.email.toLowerCase()

  const rows = await db.select().from(admins).where(eq(admins.email, email)).limit(1)
  const admin = rows[0]

  if (!admin || admin.status !== 'active') {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const ok = await verifyPassword(body.password, admin.passwordHash)
  if (!ok) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  await db
    .update(admins)
    .set({ lastLoginAt: new Date() })
    .where(eq(admins.id, admin.id))

  await createAdminSession(event, admin.id)

  return { ok: true, admin: { id: admin.id, email: admin.email, role: admin.role } }
})
