<script setup lang="ts">
definePageMeta({
  middleware: ['admin'],
})

type AdminRole = 'owner' | 'admin' | 'support' | 'viewer'

type AdminRow = {
  id: string
  email: string
  role: AdminRole
  status: 'active' | 'disabled'
  createdAt: string
  lastLoginAt: string | null
}

const me = await $fetch('/api/admin/me')

const form = reactive({
  email: '',
  password: '',
  role: 'admin' as AdminRole,
})

const createErrorMsg = ref<string | null>(null)
const createLoading = ref(false)

const { data, refresh, pending, error } = await useFetch<{ ok: true; admins: AdminRow[] }>(
  '/api/admin/admins',
)

async function createAdmin() {
  createErrorMsg.value = null
  createLoading.value = true
  try {
    await $fetch('/api/admin/admins', {
      method: 'POST',
      body: { ...form },
    })
    form.email = ''
    form.password = ''
    form.role = 'admin'
    await refresh()
  } catch (err: any) {
    createErrorMsg.value = err?.data?.message || err?.message || '创建失败'
  } finally {
    createLoading.value = false
  }
}

async function toggleStatus(row: AdminRow) {
  const next = row.status === 'active' ? 'disabled' : 'active'
  await $fetch(`/api/admin/admins/${row.id}`, {
    method: 'PATCH',
    body: { status: next },
  })
  await refresh()
}

async function updateRole(row: AdminRow, role: AdminRole) {
  await $fetch(`/api/admin/admins/${row.id}`, {
    method: 'PATCH',
    body: { role },
  })
  await refresh()
}
</script>

<template>
  <div style="max-width: 900px; margin: 40px auto; padding: 0 16px;">
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <h1 style="margin: 0; font-size: 22px;">管理员管理</h1>
      <NuxtLink to="/admin" style="text-decoration: none; color: #111;">返回后台首页</NuxtLink>
    </div>

    <p style="margin: 8px 0 0; color: #666;">
      当前登录：{{ me.admin.email }}（{{ me.admin.role }}）
    </p>

    <div style="margin-top: 16px; padding: 16px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">创建新管理员</h2>
      <form @submit.prevent="createAdmin" style="display: grid; grid-template-columns: 1fr 1fr 140px; gap: 12px; align-items: end;">
        <label style="display: grid; gap: 6px;">
          <span>邮箱</span>
          <input v-model="form.email" type="email" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>初始密码（至少 12 位）</span>
          <input v-model="form.password" type="password" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>角色</span>
          <select v-model="form.role" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="support">support</option>
            <option value="viewer">viewer</option>
          </select>
        </label>

        <button :disabled="createLoading" type="submit" style="grid-column: 1 / -1; padding: 10px; border-radius: 8px; border: 0; background: #111; color: #fff; cursor: pointer;">
          {{ createLoading ? '创建中…' : '创建管理员' }}
        </button>

        <p v-if="createErrorMsg" style="grid-column: 1 / -1; margin: 0; color: #b00020;">{{ createErrorMsg }}</p>
      </form>
    </div>

    <div style="margin-top: 16px; padding: 16px; border: 1px solid #eee; border-radius: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <h2 style="margin: 0; font-size: 16px;">管理员列表</h2>
        <button @click="refresh" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer;">
          刷新
        </button>
      </div>

      <p v-if="pending" style="margin: 12px 0 0; color: #666;">加载中…</p>
      <p v-else-if="error" style="margin: 12px 0 0; color: #b00020;">加载失败</p>

      <div v-else style="margin-top: 12px; overflow: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">邮箱</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">角色</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">状态</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data?.admins || []" :key="row.id">
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ row.email }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">
                <select :value="row.role" @change="updateRole(row, ($event.target as HTMLSelectElement).value as any)" style="padding: 6px 8px; border-radius: 8px; border: 1px solid #ddd;">
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                  <option value="support">support</option>
                  <option value="viewer">viewer</option>
                </select>
              </td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ row.status }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">
                <button @click="toggleStatus(row)" style="padding: 6px 10px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer;">
                  {{ row.status === 'active' ? '禁用' : '启用' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p style="margin: 12px 0 0; color: #666; font-size: 12px;">
        注意：为避免把自己锁死，接口会阻止你禁用当前登录账号。
      </p>
    </div>
  </div>
</template>
