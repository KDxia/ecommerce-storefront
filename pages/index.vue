<script setup lang="ts">
const query = ref('')
const { data, pending } = await useFetch('/api/products')

const products = computed(() => {
  const list = (data.value as any)?.products || []
  const q = query.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((p: any) => {
    return (
      String(p.title || '').toLowerCase().includes(q) ||
      String(p.slug || '').toLowerCase().includes(q)
    )
  })
})
</script>

<template>
  <div class="container" style="padding-top: 28px;">
    <section class="card" style="padding: 22px; overflow:hidden; position: relative;">
      <div style="position:absolute; inset:-200px -200px auto auto; width: 520px; height: 520px; border-radius: 999px; background: radial-gradient(circle at 30% 30%, rgba(124,58,237,.35), transparent 60%); filter: blur(2px);"></div>
      <div style="position:absolute; inset:auto auto -220px -180px; width: 540px; height: 540px; border-radius: 999px; background: radial-gradient(circle at 30% 30%, rgba(34,197,94,.20), transparent 62%);"></div>

      <div style="position:relative; display:grid; gap: 14px;">
        <div style="display:flex; flex-wrap: wrap; gap: 10px; align-items: center;">
          <span class="kbd">US Market</span>
          <span class="kbd">Stripe Checkout</span>
          <span class="kbd">Automatic Tax</span>
          <span class="kbd">Vercel Postgres</span>
        </div>

        <h1 style="margin:0; font-size: 34px; line-height: 1.08; letter-spacing: -0.03em;">
          A modern storefront MVP — fast, SEO-friendly, and ready to scale.
        </h1>

        <p class="muted" style="margin: 0; max-width: 72ch;">
          这是一套面向美国市场的独立站骨架：商品管理、下单支付、税率自动计算、webhook 驱动订单状态，
          后台可查订单与税快照。
        </p>

        <div style="display:flex; gap: 10px; flex-wrap: wrap; margin-top: 2px;">
          <NuxtLink to="/admin/products" class="btn btn-primary" style="text-decoration:none;">去后台上架商品</NuxtLink>
          <NuxtLink to="/admin/orders" class="btn" style="text-decoration:none;">查看订单</NuxtLink>
        </div>
      </div>
    </section>

    <section style="margin-top: 14px;" class="grid">
      <div class="card" style="padding: 14px;">
        <div style="display:flex; align-items:center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-weight: 750;">商品</div>
            <div class="muted" style="margin-top: 3px; font-size: 13px;">输入关键词快速查找（本地过滤）</div>
          </div>
          <div style="min-width: 260px; width: 320px; max-width: 100%;">
            <input v-model="query" class="input" placeholder="Search by name or slug" />
          </div>
        </div>
      </div>

      <div v-if="pending" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">
        <div v-for="i in 8" :key="i" class="skeleton" style="height: 250px;"></div>
      </div>

      <div v-else-if="products.length === 0" class="card" style="padding: 18px;">
        <div style="font-weight: 750;">暂无可售商品</div>
        <p class="muted" style="margin: 8px 0 0;">去后台把商品状态设为 <b>active</b>，首页就会展示。</p>
        <div style="margin-top: 12px; display:flex; gap: 10px; flex-wrap: wrap;">
          <NuxtLink to="/admin/products" class="btn btn-primary" style="text-decoration:none;">打开商品管理</NuxtLink>
        </div>
      </div>

      <div v-else style="display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px;">
        <ProductCard
          v-for="p in products"
          :key="p.id"
          :title="p.title"
          :slug="p.slug"
          :price-cents="p.priceCents"
          :currency="p.currency"
        />
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 8px;">
        <div class="card" style="padding: 16px;">
          <div style="font-weight: 750;">Fast checkout</div>
          <p class="muted" style="margin: 8px 0 0;">使用 Stripe Checkout，减少表单输入，提升转化。</p>
        </div>
        <div class="card" style="padding: 16px;">
          <div style="font-weight: 750;">Tax built-in</div>
          <p class="muted" style="margin: 8px 0 0;">按收货地址自动计算税率并落库税快照，便于对账。</p>
        </div>
        <div class="card" style="padding: 16px;">
          <div style="font-weight: 750;">Webhook-first</div>
          <p class="muted" style="margin: 8px 0 0;">订单状态以 webhook 为准，避免“成功页假成功”。</p>
        </div>
      </div>
    </section>
  </div>
</template>

