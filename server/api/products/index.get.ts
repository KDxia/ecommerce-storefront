import { desc, eq } from 'drizzle-orm'

import { db } from '../../db'
import { products, productVariants } from '../../db/schema'

export default defineEventHandler(async () => {
  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      description: products.description,
      taxCode: products.taxCode,
      status: products.status,

      variantId: productVariants.id,
      priceCents: productVariants.priceCents,
      currency: productVariants.currency,
    })
    .from(products)
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .where(eq(products.status, 'active'))
    .orderBy(desc(products.createdAt))

  return { ok: true, products: rows }
})
