import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db } from '../../../db'
import { admins } from '../../../db/schema'
import { hashPassword, requireAdmin, requireRole } from '../../../utils/adminAuth'

const BodySchema = z
  .object({
    role: z.enum(['owner', 'admin', 'support', 'viewer']).optional(),
    status: z.enum(['active', 'disabled']).optional(),
    password: z.string().min(12).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No changes' })

export default defineEventHandler(async (event) => {
  const current = await requireAdmin(event)
  requireRole(current, ['owner'])

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing id' })
  }

  const body = BodySchema.parse(await readBody(event))

  // Prevent locking yourself out too easily
  if (id === current.id && body.status === 'disabled') {
    throw createError({ statusCode: 400, statusMessage: 'Cannot disable yourself' })
  }


  const patch: Record<string, any> = {}
  if (body.role) patch.role = body.role
  if (body.status) patch.status = body.status
  if (body.password) patch.passwordHash = await hashPassword(body.password)

  const updated = await db
    .update(admins)
    .set(patch)
    .where(eq(admins.id, id))
    .returning({ id: admins.id, email: admins.email, role: admins.role, status: admins.status })

  if (updated.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return { ok: true, admin: updated[0] }
})
