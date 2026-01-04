import { eq } from 'drizzle-orm'

import { db } from '../../../db'
import { orderItems, orders, orderTaxSnapshots } from '../../../db/schema'
import { requireAdmin } from '../../../utils/adminAuth'
import { getStripeDashboardPaymentUrl } from '../../../utils/stripe'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const o = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1)

  if (o.length === 0) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id))
  const tax = await db
    .select()
    .from(orderTaxSnapshots)
    .where(eq(orderTaxSnapshots.orderId, id))
    .limit(1)

  const paymentUrl = o[0].stripePaymentIntentId
    ? getStripeDashboardPaymentUrl(o[0].stripePaymentIntentId)
    : null

  return { ok: true, order: o[0], items, tax: tax[0] ?? null, stripePaymentUrl: paymentUrl }
})
