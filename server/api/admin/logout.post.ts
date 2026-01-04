import { revokeCurrentAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  await revokeCurrentAdminSession(event)
  return { ok: true }
})
