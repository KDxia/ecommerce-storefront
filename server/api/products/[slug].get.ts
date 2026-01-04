import { eq } from 'drizzle-orm'

import { db } from '../../db'
import { products, productVariants } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, statusMessage: 'Missing slug' })

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      description: products.description,
      taxCode: products.taxCode,
      status: products.status,

      variantId: productVariants.id,
      sku: productVariants.sku,
      priceCents: productVariants.priceCents,
      currency: productVariants.currency,
      inventoryQty: productVariants.inventoryQty,
    })
    .from(products)
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .where(eq(products.slug, slug))
    .limit(1)

  const p = rows[0]
  if (!p || p.status !== 'active') {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  return { ok: true, product: p }
})
