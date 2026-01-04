<script setup lang="ts">
const route = useRoute()
const orderId = route.query.order_id as string | undefined
</script>

<template>
  <div style="max-width: 720px; margin: 80px auto; padding: 0 16px;">
    <h1 style="margin: 0 0 12px;">已取消支付</h1>
    <p style="margin: 0; color: #666;">
      订单：<span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">{{ orderId || '—' }}</span>
    </p>
  </div>
</template>
