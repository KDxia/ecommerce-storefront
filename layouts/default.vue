<script setup lang="ts">
const route = useRoute()

const links = [
  { to: '/', label: 'Shop' },
  { to: '/admin', label: 'Admin' },
]
</script>

<template>
  <div>
    <header style="position: sticky; top: 0; z-index: 50; backdrop-filter: blur(10px); background: rgba(11,12,16,.55); border-bottom: 1px solid rgba(255,255,255,.08);">
      <div class="container" style="display:flex; align-items:center; justify-content: space-between; gap: 12px; padding: 14px 16px;">
        <NuxtLink to="/" style="text-decoration:none; display:flex; align-items:center; gap: 10px;">
          <span style="width: 10px; height: 10px; border-radius: 999px; background: linear-gradient(135deg, var(--brand), #60a5fa);"></span>
          <span style="font-weight: 800; letter-spacing: -0.02em;">Storefront</span>
          <span class="kbd">MVP</span>
        </NuxtLink>

        <nav style="display:flex; gap: 10px; align-items:center;">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            style="text-decoration:none; padding: 8px 10px; border-radius: 10px; border: 1px solid transparent;"
            :style="route.path === l.to ? 'background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12);' : 'opacity:.9;'"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main>
      <NuxtPage />
    </main>

    <footer class="container footer">
      <div style="display:flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
        <div>
          <div style="font-weight: 700; color: rgba(255,255,255,.8);">Storefront</div>
          <div style="margin-top: 4px;">Nuxt + Vercel + Postgres + Stripe</div>
        </div>
        <div class="faint">© {{ new Date().getFullYear() }}</div>
      </div>
    </footer>
  </div>
</template>
