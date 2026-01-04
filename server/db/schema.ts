import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core'

// ----------------------
// Admin
// ----------------------

export const adminRoleEnum = pgEnum('admin_role', [
  'owner',
  'admin',
  'support',
  'viewer',
])

export const adminStatusEnum = pgEnum('admin_status', ['active', 'disabled'])

export const admins = pgTable(
  'admins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: adminRoleEnum('role').notNull().default('owner'),
    status: adminStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (t) => ({
    emailIdx: index('admins_email_idx').on(t.email),
  }),
)

export const adminSessions = pgTable(
  'admin_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: uuid('admin_id')
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),

    sessionTokenHash: text('session_token_hash').notNull().unique(),

    ip: text('ip'),
    userAgent: text('user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
  },
  (t) => ({
    adminIdIdx: index('admin_sessions_admin_id_idx').on(t.adminId),
    expiresAtIdx: index('admin_sessions_expires_at_idx').on(t.expiresAt),
  }),
)

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    adminId: uuid('admin_id').references(() => admins.id, {
      onDelete: 'set null',
    }),

    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),

    metadata: jsonb('metadata'),

    ip: text('ip'),
    userAgent: text('user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    actionIdx: index('audit_logs_action_idx').on(t.action),
    createdAtIdx: index('audit_logs_created_at_idx').on(t.createdAt),
  }),
)

// ----------------------
// Catalog (Products)
// ----------------------

export const productStatusEnum = pgEnum('product_status', [
  'draft',
  'active',
  'archived',
])

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),

    // Optional Stripe Tax product tax code, e.g. "txcd_99999999"
    taxCode: text('tax_code'),

    status: productStatusEnum('status').notNull().default('draft'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    statusIdx: index('products_status_idx').on(t.status),
    slugIdx: index('products_slug_idx').on(t.slug),
  }),
)

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    title: text('title').notNull(),
    sku: text('sku').notNull().unique(),

    // Store money in cents to avoid floating errors.
    priceCents: integer('price_cents').notNull(),
    currency: text('currency').notNull().default('usd'),

    trackInventory: boolean('track_inventory').notNull().default(true),
    inventoryQty: integer('inventory_qty').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    productIdIdx: index('product_variants_product_id_idx').on(t.productId),
    skuIdx: index('product_variants_sku_idx').on(t.sku),
  }),
)

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),

    url: text('url').notNull(),
    alt: text('alt'),
    sort: integer('sort').notNull().default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    productIdIdx: index('product_images_product_id_idx').on(t.productId),
  }),
)

// ----------------------
// Orders
// ----------------------

export const orderStatusEnum = pgEnum('order_status', [
  'draft',
  'pending_payment',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded',
])

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    status: orderStatusEnum('status').notNull().default('draft'),

    currency: text('currency').notNull().default('usd'),

    subtotalCents: integer('subtotal_cents').notNull().default(0),
    taxCents: integer('tax_cents').notNull().default(0),
    shippingCents: integer('shipping_cents').notNull().default(0),
    discountCents: integer('discount_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull().default(0),

    email: text('email'),
    shippingAddress: jsonb('shipping_address'),

    stripeCheckoutSessionId: text('stripe_checkout_session_id').unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeCustomerId: text('stripe_customer_id'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    statusIdx: index('orders_status_idx').on(t.status),
    createdAtIdx: index('orders_created_at_idx').on(t.createdAt),
    stripeCheckoutSessionIdx: index('orders_stripe_checkout_session_idx').on(
      t.stripeCheckoutSessionId,
    ),
  }),
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),

    productId: uuid('product_id'),
    variantId: uuid('variant_id'),

    title: text('title').notNull(),
    sku: text('sku'),

    unitPriceCents: integer('unit_price_cents').notNull(),
    quantity: integer('quantity').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    orderIdIdx: index('order_items_order_id_idx').on(t.orderId),
  }),
)

export const orderTaxSnapshots = pgTable(
  'order_tax_snapshots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' })
      .unique(),

    provider: text('provider').notNull().default('stripe'),

    stripeTaxCalculationId: text('stripe_tax_calculation_id'),
    stripeTaxTransactionId: text('stripe_tax_transaction_id'),

    snapshot: jsonb('snapshot').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    orderIdIdx: index('order_tax_snapshots_order_id_idx').on(t.orderId),
  }),
)

// ----------------------
// Webhook idempotency + trace
// ----------------------

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    provider: text('provider').notNull(),
    eventId: text('event_id').notNull().unique(),
    type: text('type').notNull(),

    payload: jsonb('payload').notNull(),

    receivedAt: timestamp('received_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    error: text('error'),
  },
  (t) => ({
    providerIdx: index('webhook_events_provider_idx').on(t.provider),
    typeIdx: index('webhook_events_type_idx').on(t.type),
  }),
)
