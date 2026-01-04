import { z } from 'zod'
import { db } from '../../db'
import { admins } from '../../db/schema'
import { hashPassword } from '../../utils/adminAuth'

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.adminBootstrapSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ADMIN_BOOTSTRAP_SECRET is not configured',
    })
  }

  const headerSecret = getRequestHeader(event, 'x-bootstrap-secret')
  if (!headerSecret || headerSecret !== config.adminBootstrapSecret) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const existing = await db.select({ id: admins.id }).from(admins).limit(1)
  if (existing.length > 0) {
    throw createError({ statusCode: 409, statusMessage: 'Admin already exists' })
  }

  const body = BodySchema.parse(await readBody(event))

  const passwordHash = await hashPassword(body.password)

  const inserted = await db
    .insert(admins)
    .values({
      email: body.email.toLowerCase(),
      passwordHash,
      role: 'owner',
      status: 'active',
    })
    .returning({ id: admins.id, email: admins.email, role: admins.role })

  return { ok: true, admin: inserted[0] }
})
