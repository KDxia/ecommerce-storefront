<script setup lang="ts">
definePageMeta({
  middleware: ['admin'],
})

type Row = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'active' | 'archived'
  taxCode: string | null
  variantId: string
  sku: string
  priceCents: number
  currency: string
  inventoryQty: number
}

const me = await $fetch('/api/admin/me')

const form = reactive({
  title: '',
  slug: '',
  description: '',
  status: 'draft' as Row['status'],
  taxCode: '',
  sku: '',
  priceCents: 0,
  currency: 'usd',
  inventoryQty: 0,
})

const msg = ref<string | null>(null)
const loading = ref(false)

const { data, refresh, pending } = await useFetch<{ ok: true; products: Row[] }>(
  '/api/admin/products',
)

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

async function createProduct() {
  msg.value = null
  loading.value = true
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        ...form,
        taxCode: form.taxCode || undefined,
        description: form.description || undefined,
      },
    })
    Object.assign(form, {
      title: '',
      slug: '',
      description: '',
      status: 'draft',
      taxCode: '',
      sku: '',
      priceCents: 0,
      currency: 'usd',
      inventoryQty: 0,
    })
    await refresh()
    msg.value = '创建成功'
  } catch (err: any) {
    msg.value = err?.data?.message || err?.message || '创建失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="max-width: 1000px; margin: 40px auto; padding: 0 16px;">
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <h1 style="margin: 0; font-size: 22px;">商品管理</h1>
      <NuxtLink to="/admin" style="text-decoration: none; color: #111;">返回后台首页</NuxtLink>
    </div>

    <p style="margin: 8px 0 0; color: #666;">当前登录：{{ me.admin.email }}（{{ me.admin.role }}）</p>

    <div style="margin-top: 16px; padding: 16px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="margin: 0 0 12px; font-size: 16px;">创建商品（MVP：单变体）</h2>
      <form @submit.prevent="createProduct" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <label style="display: grid; gap: 6px;">
          <span>标题</span>
          <input v-model="form.title" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>Slug</span>
          <input v-model="form.slug" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px; grid-column: 1 / -1;">
          <span>描述</span>
          <textarea v-model="form.description" rows="3" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>状态</span>
          <select v-model="form.status" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="archived">archived</option>
          </select>
        </label>

        <label style="display: grid; gap: 6px;">
          <span>Stripe Tax Code（可选）</span>
          <input v-model="form.taxCode" placeholder="txcd_..." style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>SKU</span>
          <input v-model="form.sku" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>价格（分）</span>
          <input v-model.number="form.priceCents" type="number" min="0" required style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>币种</span>
          <input v-model="form.currency" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <label style="display: grid; gap: 6px;">
          <span>库存</span>
          <input v-model.number="form.inventoryQty" type="number" min="0" style="padding: 10px; border: 1px solid #ddd; border-radius: 8px;" />
        </label>

        <button :disabled="loading" type="submit" style="grid-column: 1 / -1; padding: 10px; border-radius: 8px; border: 0; background: #111; color: #fff; cursor: pointer;">
          {{ loading ? '创建中…' : '创建' }}
        </button>

        <p v-if="msg" style="grid-column: 1 / -1; margin: 0; color: #666;">{{ msg }}</p>
      </form>
    </div>

    <div style="margin-top: 16px; padding: 16px; border: 1px solid #eee; border-radius: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
        <h2 style="margin: 0; font-size: 16px;">商品列表</h2>
        <button @click="refresh" style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; cursor: pointer;">刷新</button>
      </div>

      <p v-if="pending" style="margin: 12px 0 0; color: #666;">加载中…</p>

      <div v-else style="margin-top: 12px; overflow: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">标题</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">状态</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">SKU</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">价格</th>
              <th style="text-align: left; padding: 8px; border-bottom: 1px solid #eee;">库存</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in data?.products || []" :key="p.id">
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ p.title }} <span style="color:#999">({{ p.slug }})</span></td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ p.status }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ p.sku }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ formatMoney(p.priceCents, p.currency) }}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f3f3f3;">{{ p.inventoryQty }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
