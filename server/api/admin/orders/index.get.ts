import { desc } from 'drizzle-orm'

import { db } from '../../../db'
import { orders } from '../../../db/schema'
import { requireAdmin } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db
    .select({
      id: orders.id,
      status: orders.status,
      email: orders.email,
      currency: orders.currency,
      subtotalCents: orders.subtotalCents,
      taxCents: orders.taxCents,
      totalCents: orders.totalCents,
      stripePaymentIntentId: orders.stripePaymentIntentId,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))

  return { ok: true, orders: rows }
})
