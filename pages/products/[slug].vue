<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data, pending } = await useFetch(`/api/products/${slug}`)

const qty = ref(1)
const email = ref('')
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const price = computed(() => {
  const p: any = (data.value as any)?.product
  if (!p) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: String(p.currency).toUpperCase(),
  }).format(Number(p.priceCents) / 100)
})

async function buyNow() {
  const p: any = (data.value as any)?.product
  if (!p?.variantId) return

  errorMsg.value = null
  loading.value = true
  try {
    const res: any = await $fetch('/api/checkout/create', {
      method: 'POST',
      body: {
        items: [{ variantId: p.variantId, quantity: qty.value }],
        email: email.value || undefined,
      },
    })

    if (res?.url) {
      window.location.href = res.url
      return
    }

    errorMsg.value = '未获取到 Stripe 跳转链接'
  } catch (err: any) {
    errorMsg.value = err?.data?.message || err?.message || '下单失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="container" style="padding-top: 26px;">
    <NuxtLink to="/" style="text-decoration:none; display:inline-flex; align-items:center; gap: 8px; opacity: .9;">← Back</NuxtLink>

    <p v-if="pending" class="muted" style="margin-top: 16px;">Loading…</p>

    <div v-else-if="data?.product" style="margin-top: 16px; display:grid; grid-template-columns: 1.2fr .8fr; gap: 16px; align-items:start;">
      <div class="card" style="overflow:hidden;">
        <div style="height: 320px; border-bottom: 1px solid rgba(255,255,255,.08); background: radial-gradient(800px 320px at 10% 20%, rgba(124,58,237,.28), transparent 60%), radial-gradient(700px 280px at 90% 30%, rgba(34,197,94,.18), transparent 60%), rgba(255,255,255,.04);"></div>
        <div style="padding: 18px;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.02em;">{{ data.product.title }}</h1>
          <p class="muted" style="margin: 10px 0 0; line-height: 1.6;">{{ data.product.description || 'No description yet.' }}</p>

          <div style="margin-top: 14px; display:flex; gap: 10px; flex-wrap: wrap;">
            <span class="kbd">US Shipping</span>
            <span class="kbd">Stripe Checkout</span>
            <span class="kbd">Automatic Tax</span>
          </div>
        </div>
      </div>

      <div class="card" style="padding: 16px; position: sticky; top: 84px;">
        <div style="display:flex; justify-content: space-between; align-items: baseline; gap: 12px;">
          <div style="font-weight: 800; font-size: 16px;">Buy</div>
          <div v-if="price" class="kbd">{{ price }}</div>
        </div>

        <div style="margin-top: 12px; display:grid; gap: 10px;">
          <label style="display:grid; gap: 6px;">
            <span class="muted" style="font-size: 13px;">Quantity</span>
            <input v-model.number="qty" class="input" type="number" min="1" max="20" />
          </label>

          <label style="display:grid; gap: 6px;">
            <span class="muted" style="font-size: 13px;">Email (optional)</span>
            <input v-model="email" class="input" type="email" autocomplete="email" placeholder="you@example.com" />
          </label>

          <button :disabled="loading" class="btn btn-primary" @click="buyNow" style="width:100%;">
            {{ loading ? 'Redirecting…' : 'Checkout' }}
          </button>

          <p v-if="errorMsg" style="margin: 0; color: var(--danger);">{{ errorMsg }}</p>

          <p class="faint" style="margin: 0; font-size: 12px; line-height: 1.5;">
            Taxes are calculated at checkout based on shipping address. Order status is confirmed via Stripe webhook.
          </p>
        </div>
      </div>

      <div class="card" style="padding: 16px; grid-column: 1 / -1;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px;">
          <div>
            <div style="font-weight: 750;">Secure payments</div>
            <p class="muted" style="margin: 8px 0 0;">Card + wallets through Stripe Checkout.</p>
          </div>
          <div>
            <div style="font-weight: 750;">Tax snapshot</div>
            <p class="muted" style="margin: 8px 0 0;">We persist tax/total details for reconciliation.</p>
          </div>
          <div>
            <div style="font-weight: 750;">Webhook-first</div>
            <p class="muted" style="margin: 8px 0 0;">Avoids false positives from client redirects.</p>
          </div>
        </div>
      </div>
    </div>

    <p v-else style="margin-top: 16px; color: var(--danger);">商品不存在或未上架</p>

    <style>
    @media (max-width: 900px){
      .container > div[style*="grid-template-columns"]{ grid-template-columns: 1fr !important; }
      .card[style*="position: sticky"]{ position: static !important; top: auto !important; }
    }
    </style>
  </div>
</template>

