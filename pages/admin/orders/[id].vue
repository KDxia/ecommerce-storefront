<script setup lang="ts">
definePageMeta({
  middleware: ['admin'],
})

const route = useRoute()
const id = route.params.id as string

const { data, refresh, pending } = await useFetch(`/api/admin/orders/${id}`)
</script>

<template>
  <div style="max-width: 1000px; margin: 40px auto; padding: 0 16px;">
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <h1 style="margin: 0; font-size: 22px;">订单详情</h1>
      <NuxtLink to="/admin/orders" style="text-decoration: none; color: #111;">返回订单列表</NuxtLink>
    </div>

    <p v-if="pending" style="margin-top: 12px; color: #666;">加载中…</p>

    <div v-else style="margin-top: 16px; display: grid; gap: 16px;">
      <div style="padding: 16px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="margin: 0 0 12px; font-size: 16px;">订单</h2>
        <pre style="margin:0; overflow:auto;">{{ data }}</pre>
        <p v-if="data?.stripePaymentUrl" style="margin: 12px 0 0;">
          <a :href="data.stripePaymentUrl" target="_blank" rel="noreferrer" style="color:#111;">打开 Stripe Dashboard（Payment）</a>
        </p>
      </div>

      <button @click="refresh" style="justify-self: start; padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer;">刷新</button>
    </div>
  </div>
</template>
