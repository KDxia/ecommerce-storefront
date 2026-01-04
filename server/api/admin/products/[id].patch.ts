import { z } from 'zod'
import { eq } from 'drizzle-orm'

import { db } from '../../../db'
import { products, productVariants } from '../../../db/schema'
import { requireAdmin, requireRole } from '../../../utils/adminAuth'

const BodySchema = z
  .object({
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(['draft', 'active', 'archived']).optional(),
    taxCode: z.string().optional().nullable(),

    sku: z.string().min(1).optional(),
    priceCents: z.number().int().min(0).optional(),
    currency: z.string().min(3).max(3).optional(),
    inventoryQty: z.number().int().min(0).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'No changes' })

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  requireRole(admin, ['owner', 'admin'])

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing id' })

  const body = BodySchema.parse(await readBody(event))

  await db.transaction(async (tx) => {
    const productPatch: Record<string, any> = { updatedAt: new Date() }
    if (body.title !== undefined) productPatch.title = body.title
    if (body.slug !== undefined) productPatch.slug = body.slug
    if (body.description !== undefined) productPatch.description = body.description
    if (body.status !== undefined) productPatch.status = body.status
    if (body.taxCode !== undefined) productPatch.taxCode = body.taxCode

    await tx.update(products).set(productPatch).where(eq(products.id, id))

    const variantPatch: Record<string, any> = { updatedAt: new Date() }
    if (body.sku !== undefined) variantPatch.sku = body.sku
    if (body.priceCents !== undefined) variantPatch.priceCents = body.priceCents
    if (body.currency !== undefined) variantPatch.currency = body.currency
    if (body.inventoryQty !== undefined) variantPatch.inventoryQty = body.inventoryQty

    if (Object.keys(variantPatch).length > 1) {
      await tx.update(productVariants).set(variantPatch).where(eq(productVariants.productId, id))
    }
  })

  return { ok: true }
})
