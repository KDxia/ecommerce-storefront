<script setup lang="ts">
definePageMeta({
  middleware: ['admin'],
})

type Row = {
  id: string
  status: string
  email: string | null
  currency: string
  subtotalCents: number
  taxCents: number
  totalCents: number
  stripePaymentIntentId: string | null
  createdAt: string
}

const { data, refresh, pending } = await useFetch<{ ok: true; orders: Row[] }>(
  '/api/admin/orders',
)

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}
</script>

<template>
  <div style="max-width: 1000px; margin: 40px auto; padding: 0 16px;">
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <h1 style="margin: 0; font-size: 22px;">订单管理</h1>
      <NuxtLink to="/admin" style="text-decoration: none; color: #111;">返回后台首页</NuxtLink>
    </div>

    <div style="margin-top: 16px; padding: 16px; border: 1px solid #eee; border-radius: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <h2 style="margin: 0; font-size: 16px;">订单列表</h2>
        <button @click="refresh" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer;">刷新</button>
      </div>

      <p v-if="pending" style="margin: 12px 0 0; color: #666;">加载中…</p>

      <div v-else style="margin-top: 12px; overflow: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">订单</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">状态</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">金额</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">税</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">总计</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in data?.orders || []" :key="o.id">
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">
                <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 12px;">{{ o.id }}</div>
                <div style="color:#666; font-size: 12px;">{{ o.email || '—' }}</div>
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ o.status }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ formatMoney(o.subtotalCents, o.currency) }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ formatMoney(o.taxCents, o.currency) }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ formatMoney(o.totalCents, o.currency) }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">
                <NuxtLink :to="`/admin/orders/${o.id}`" style="text-decoration: none; color: #111;">详情</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
