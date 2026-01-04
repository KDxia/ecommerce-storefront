import { and, desc, eq } from 'drizzle-orm'

import { db } from '../../../db'
import { products, productVariants } from '../../../db/schema'
import { requireAdmin } from '../../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      status: products.status,
      taxCode: products.taxCode,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,

      variantId: productVariants.id,
      sku: productVariants.sku,
      priceCents: productVariants.priceCents,
      currency: productVariants.currency,
      inventoryQty: productVariants.inventoryQty,
    })
    .from(products)
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .orderBy(desc(products.createdAt))

  return { ok: true, products: rows }
})
