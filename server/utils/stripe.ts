import Stripe from 'stripe'

let cached: Stripe | null = null

export function getStripe() {
  if (cached) return cached

  const config = useRuntimeConfig()
  if (!config.stripeSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'STRIPE_SECRET_KEY is not configured',
    })
  }

  cached = new Stripe(config.stripeSecretKey, {
    // Keep this pinned for stability.
    apiVersion: '2024-06-20',
  })

  return cached
}

export function getStripeDashboardPaymentUrl(paymentIntentId: string) {
  const { stripeDashboardMode } = useRuntimeConfig().public
  const prefix = stripeDashboardMode === 'live' ? '' : '/test'
  return `https://dashboard.stripe.com${prefix}/payments/${paymentIntentId}`
}
