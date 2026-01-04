<script setup lang="ts">
const email = ref('')
const password = ref('')
const errorMsg = ref<string | null>(null)
const loading = ref(false)

async function onSubmit() {
  errorMsg.value = null
  loading.value = true
  try {
    await $fetch('/api/admin/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    await navigateTo('/admin')
  } catch (err: any) {
    errorMsg.value = err?.data?.message || err?.message || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width: 420px; margin: 80px auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
    <h1 style="margin: 0 0 16px; font-size: 20px;">后台登录</h1>

    <form @submit.prevent="onSubmit" style="display: grid; gap: 12px;">
      <label style="display: grid; gap: 6px;">
        <span>邮箱</span>
        <input v-model="email" type="email" autocomplete="email" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
      </label>

      <label style="display: grid; gap: 6px;">
        <span>密码</span>
        <input v-model="password" type="password" autocomplete="current-password" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
      </label>

      <button :disabled="loading" type="submit" style="padding: 10px; border-radius: 8px; border: 0; background: #111; color: #fff; cursor: pointer;">
        {{ loading ? '登录中…' : '登录' }}
      </button>

      <p v-if="errorMsg" style="margin: 0; color: #b00020;">{{ errorMsg }}</p>
    </form>
  </div>
</template>
