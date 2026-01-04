import { desc } from 'drizzle-orm'

import { db } from '../../../db'
import { admins } from '../../../db/schema'
import { requireAdmin, requireRole } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  requireRole(admin, ['owner'])

  const rows = await db
    .select({
      id: admins.id,
      email: admins.email,
      role: admins.role,
      status: admins.status,
      createdAt: admins.createdAt,
      lastLoginAt: admins.lastLoginAt,
    })
    .from(admins)
    .orderBy(desc(admins.createdAt))

  return { ok: true, admins: rows }
})
