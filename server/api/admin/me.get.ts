import { requireAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  return { ok: true, admin: { id: admin.id, email: admin.email, role: admin.role } }
})
