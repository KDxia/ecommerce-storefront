<script setup lang="ts">
const route = useRoute()
const sessionId = route.query.session_id as string | undefined
</script>

<template>
  <div style="max-width: 720px; margin: 80px auto; padding: 0 16px;">
    <h1 style="margin: 0 0 12px;">支付完成</h1>
    <p style="margin: 0; color: #666;">
      Stripe session: <span style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">{{ sessionId || '—' }}</span>
    </p>
    <p style="margin-top: 12px; color: #666;">
      订单状态会以 Stripe webhook 为准，通常几秒内后台即可看到状态变为 <b>paid</b>。
    </p>
  </div>
</template>
