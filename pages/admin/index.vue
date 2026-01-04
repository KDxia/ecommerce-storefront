<script setup lang="ts">
definePageMeta({
  middleware: ['admin'],
})

const { data, refresh } = await useFetch('/api/admin/me')

async function logout() {
  await $fetch('/api/admin/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}
</script>

<template>
  <div style="max-width: 900px; margin: 40px auto; padding: 0 16px;">
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <h1 style="margin: 0; font-size: 22px;">管理后台</h1>
      <button @click="logout" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer;">
        退出登录
      </button>
    </div>

    <div style="margin-top: 16px; padding: 16px; border: 1px solid #eee; border-radius: 12px;">
      <p style="margin: 0 0 8px;">当前管理员：</p>
      <pre style="margin: 0; overflow: auto;">{{ data }}</pre>
      <button @click="refresh" style="margin-top: 12px; padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer;">
        刷新
      </button>
    </div>

    <div style="margin-top: 16px; display: flex; gap: 12px; flex-wrap: wrap;">
      <NuxtLink to="/admin/products" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; text-decoration: none; color: #111;">
        商品管理
      </NuxtLink>
      <NuxtLink to="/admin/orders" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; text-decoration: none; color: #111;">
        订单管理
      </NuxtLink>
      <NuxtLink to="/admin/admins" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; text-decoration: none; color: #111;">
        管理员管理
      </NuxtLink>
    </div>


    <p style="margin-top: 16px; color: #666;">
      下一步我们会在这里加：商品管理、订单管理、税务快照与 Stripe 跳转。
    </p>

  </div>
</template>
