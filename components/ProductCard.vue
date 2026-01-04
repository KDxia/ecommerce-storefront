<script setup lang="ts">
const props = defineProps<{
  title: string
  slug: string
  priceCents: number
  currency: string
}>()

const price = computed(() => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: props.currency.toUpperCase(),
  }).format(props.priceCents / 100)
})
</script>

<template>
  <NuxtLink
    :to="`/products/${slug}`"
    style="text-decoration: none; display:block;"
  >
    <div class="card" style="overflow:hidden; transition: transform .12s ease, border-color .15s ease;">
      <div style="height: 150px; border-bottom: 1px solid rgba(255,255,255,.08); background: radial-gradient(1200px 260px at 10% 20%, rgba(124,58,237,.25), transparent 60%), radial-gradient(800px 240px at 90% 30%, rgba(34,197,94,.18), transparent 60%), rgba(255,255,255,.04);"></div>
      <div style="padding: 14px;">
        <div style="display:flex; justify-content: space-between; gap: 10px; align-items:flex-start;">
          <div style="font-weight: 750; line-height: 1.25;">
            {{ title }}
          </div>
          <div class="kbd">{{ price }}</div>
        </div>
        <div class="muted" style="margin-top: 10px; display:flex; justify-content: space-between; align-items:center;">
          <span style="font-size: 13px;">View details</span>
          <span style="opacity:.85">→</span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
