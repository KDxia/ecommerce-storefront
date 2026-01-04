import { z } from 'zod'
import type Stripe from 'stripe'
import { eq, inArray } from 'drizzle-orm'

import { db } from '../../db'
import { orderItems, orders, productVariants, products } from '../../db/schema'
import { getStripe } from '../../utils/stripe'


const BodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  email: z.string().email().optional(),
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = getStripe()

  const body = BodySchema.parse(await readBody(event))

  const variantIds = [...new Set(body.items.map((i) => i.variantId))]

  const variants = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productTitle: products.title,
      productTaxCode: products.taxCode,
      productStatus: products.status,
      variantTitle: productVariants.title,
      sku: productVariants.sku,
      priceCents: productVariants.priceCents,
      currency: productVariants.currency,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds))

  if (variants.length !== variantIds.length) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid variantId' })
  }

  for (const v of variants) {
    if (v.productStatus !== 'active') {
      throw createError({ statusCode: 400, statusMessage: 'Product is not available' })
    }
  }

  const variantById = new Map(variants.map((v) => [v.variantId, v]))

  let subtotalCents = 0
  let currency: string | null = null

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  const orderItemsToInsert: Array<typeof orderItems.$inferInsert> = []

  for (const item of body.items) {
    const v = variantById.get(item.variantId)!
    currency ||= v.currency

    if (v.currency !== currency) {
      throw createError({ statusCode: 400, statusMessage: 'Mixed currencies not supported' })
    }

    subtotalCents += v.priceCents * item.quantity

    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: v.currency,
        unit_amount: v.priceCents,
        product_data: {
          name: `${v.productTitle}${v.variantTitle ? ` - ${v.variantTitle}` : ''}`,
          ...(v.productTaxCode ? { tax_code: v.productTaxCode } : {}),
        },
      },
    })

    orderItemsToInsert.push({
      orderId: 'TEMP',
      productId: v.productId,
      variantId: v.variantId,
      title: `${v.productTitle}${v.variantTitle ? ` - ${v.variantTitle}` : ''}`,
      sku: v.sku,
      unitPriceCents: v.priceCents,
      quantity: item.quantity,
    })
  }

  const insertedOrder = await db.transaction(async (tx) => {
    const [o] = await tx
      .insert(orders)
      .values({
        status: 'pending_payment',
        currency: currency ?? 'usd',
        subtotalCents,
        totalCents: subtotalCents,
        email: body.email?.toLowerCase() ?? null,
      })
      .returning({ id: orders.id })

    await tx.insert(orderItems).values(
      orderItemsToInsert.map((i) => ({
        ...i,
        orderId: o.id,
      })),
    )

    return o
  })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    automatic_tax: { enabled: true },
    billing_address_collection: 'auto',
    shipping_address_collection: { allowed_countries: ['US'] },
    allow_promotion_codes: true,

    customer_email: body.email,

    client_reference_id: insertedOrder.id,
    metadata: {
      order_id: insertedOrder.id,
    },

    success_url: `${config.public.siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.public.siteUrl}/checkout/cancel?order_id=${insertedOrder.id}`,
  })

  await db
    .update(orders)
    .set({
      stripeCheckoutSessionId: session.id,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, insertedOrder.id))

  return { ok: true, orderId: insertedOrder.id, url: session.url }
})
