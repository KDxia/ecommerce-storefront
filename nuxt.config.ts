export default defineNuxtConfig({
  compatibilityDate: '2025-12-31',
  css: ['~/assets/main.css'],
  nitro: {
    preset: 'vercel',
  },
  typescript: {
    strict: true,
  },
  runtimeConfig: {

    postgresUrl: process.env.POSTGRES_URL || process.env.DATABASE_URL || '',
    adminBootstrapSecret: process.env.ADMIN_BOOTSTRAP_SECRET || '',

    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',

    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      stripeDashboardMode: process.env.STRIPE_DASHBOARD_MODE || 'test',
    },
  },
})

