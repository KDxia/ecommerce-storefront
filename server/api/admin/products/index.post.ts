import { z } from 'zod'

import { db } from '../../../db'
import { products, productVariants } from '../../../db/schema'
import { requireAdmin, requireRole } from '../../../utils/adminAuth'

const BodySchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  taxCode: z.string().optional(),

  // MVP: create one default variant
  sku: z.string().min(1),
  priceCents: z.number().int().min(0),
  currency: z.string().min(3).max(3).default('usd'),
  inventoryQty: z.number().int().min(0).default(0),
})

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  requireRole(admin, ['owner', 'admin'])

  const body = BodySchema.parse(await readBody(event))

  const inserted = await db.transaction(async (tx) => {
    const [p] = await tx
      .insert(products)
      .values({
        title: body.title,
        slug: body.slug,
        description: body.description ?? null,
        status: body.status,
        taxCode: body.taxCode ?? null,
        updatedAt: new Date(),
      })
      .returning({ id: products.id })

    const [v] = await tx
      .insert(productVariants)
      .values({
        productId: p.id,
        title: 'Default',
        sku: body.sku,
        priceCents: body.priceCents,
        currency: body.currency,
        inventoryQty: body.inventoryQty,
        updatedAt: new Date(),
      })
      .returning({ id: productVariants.id })

    return { productId: p.id, variantId: v.id }
  })

  return { ok: true, ...inserted }
})
