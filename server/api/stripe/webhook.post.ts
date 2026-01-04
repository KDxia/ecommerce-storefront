import { eq } from 'drizzle-orm'

import { db } from '../../db'
import { orders, orderTaxSnapshots, webhookEvents } from '../../db/schema'
import { getStripe } from '../../utils/stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = getStripe()

  if (!config.stripeWebhookSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'STRIPE_WEBHOOK_SECRET is not configured',
    })
  }

  const sig = getRequestHeader(event, 'stripe-signature')
  if (!sig) {
    throw createError({ statusCode: 400, statusMessage: 'Missing stripe-signature' })
  }

  const rawBody = await readRawBody(event, false)
  if (!rawBody) {
    throw createError({ statusCode: 400, statusMessage: 'Missing body' })
  }


  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, config.stripeWebhookSecret)
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: `Webhook signature error: ${err?.message || 'invalid'}` })
  }

  // Idempotency: store event and skip if already processed
  try {
    await db.insert(webhookEvents).values({
      provider: 'stripe',
      eventId: stripeEvent.id,
      type: stripeEvent.type,
      payload: stripeEvent as any,
    })
  } catch {
    // likely unique violation: already received
  }

  const existing = await db
    .select({ id: webhookEvents.id, processedAt: webhookEvents.processedAt })
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, stripeEvent.id))
    .limit(1)

  if (existing[0]?.processedAt) {
    return { ok: true }
  }

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as any
      const orderId = session?.metadata?.order_id || session?.client_reference_id
      if (!orderId) {
        throw new Error('Missing order_id in metadata')
      }

      const amountSubtotal = session.amount_subtotal ?? 0
      const amountTotal = session.amount_total ?? 0
      const totalDetails = session.total_details ?? {}

      const taxCents = totalDetails.amount_tax ?? 0
      const shippingCents = totalDetails.amount_shipping ?? 0
      const discountCents = totalDetails.amount_discount ?? 0

      const customerDetails = session.customer_details || null

      await db.transaction(async (tx) => {
        await tx
          .update(orders)
          .set({
            status: 'paid',
            email: (customerDetails?.email || session.customer_email || null) as any,
            shippingAddress: (customerDetails?.address || null) as any,
            subtotalCents: amountSubtotal,
            taxCents,
            shippingCents,
            discountCents,
            totalCents: amountTotal,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || null,
            stripeCustomerId: session.customer || null,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId))

        await tx
          .insert(orderTaxSnapshots)
          .values({
            orderId,
            provider: 'stripe',
            snapshot: {
              session_id: session.id,
              payment_intent: session.payment_intent,
              automatic_tax: session.automatic_tax,
              total_details: session.total_details,
              currency: session.currency,
              created: session.created,
            },
          })
          .onConflictDoUpdate({
            target: orderTaxSnapshots.orderId,
            set: {
              snapshot: {
                session_id: session.id,
                payment_intent: session.payment_intent,
                automatic_tax: session.automatic_tax,
                total_details: session.total_details,
                currency: session.currency,
                created: session.created,
              },
            },
          })
      })
    }

    if (stripeEvent.type === 'checkout.session.expired') {
      const session = stripeEvent.data.object as any
      const orderId = session?.metadata?.order_id || session?.client_reference_id
      if (orderId) {
        await db
          .update(orders)
          .set({ status: 'cancelled', updatedAt: new Date() })
          .where(eq(orders.id, orderId))
      }
    }

    if (stripeEvent.type === 'charge.refunded') {
      const charge = stripeEvent.data.object as any
      const paymentIntentId = charge.payment_intent
      if (paymentIntentId) {
        await db
          .update(orders)
          .set({ status: 'refunded', updatedAt: new Date() })
          .where(eq(orders.stripePaymentIntentId, paymentIntentId))
      }
    }


    await db
      .update(webhookEvents)
      .set({ processedAt: new Date(), error: null })
      .where(eq(webhookEvents.eventId, stripeEvent.id))

    return { ok: true }
  } catch (err: any) {
    await db
      .update(webhookEvents)
      .set({ processedAt: new Date(), error: err?.message || 'unknown' })
      .where(eq(webhookEvents.eventId, stripeEvent.id))

    throw err
  }
})
