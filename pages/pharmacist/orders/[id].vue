<template>
  <div v-if="!order" class="rounded-2xl border bg-white p-5 text-sm text-gray-600">
    Замовлення не знайдено або доступ заборонено.
  </div>

  <div v-else class="rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Замовлення {{ orderNumber(order) }}</h1>
    <div class="mt-1 text-sm text-gray-600">
      {{ new Date(order.createdAt).toLocaleString('uk-UA') }} • Аптека: {{ order.pharmacyCode }}
    </div>

    <div class="mt-4 grid gap-2">
      <div v-for="it in order.items" :key="it.productId" class="flex justify-between rounded-xl border p-3 text-sm">
        <div>{{ it.name }} × {{ it.qty }}</div>
        <div class="font-semibold">{{ (it.price * it.qty).toFixed(2) }} грн</div>
      </div>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <div class="text-sm">Разом: <span class="text-lg font-bold">{{ order.total.toFixed(2) }} грн</span></div>
      <div class="text-sm">Статус: <span class="font-semibold">{{ statusUa(order.status) }}</span></div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <UiButton :disabled="saving" variant="ghost" @click="set('new')">Нове</UiButton>
      <UiButton :disabled="saving" variant="primary" @click="set('issued')">Видане</UiButton>
      <UiButton :disabled="saving" variant="danger" @click="set('canceled')">Скасоване</UiButton>
    </div>

    <AlertBox class="mt-4" :text="msg" :kind="msgKind" />
  </div>
</template>

<script setup lang="ts">
import type { OrderStatus } from '~/composables/useOrders'

await requireRole('pharmacist')

const route = useRoute()
const { pharmacyCode } = useAuthFacade()
const { getById, setStatus } = useOrders()

const order = ref<any | null>(null)
const saving = ref(false)
const msg = ref('')
const msgKind = ref<'info'|'error'|'success'>('info')

function statusUa (s: string) {
  if (s === 'issued') return 'видане'
  if (s === 'canceled') return 'скасоване'
  return 'нове'
}

function orderNumber(o: any) {
  const ts = Number(o?.createdAt || 0)
  if (!ts) return '—'
  const a = String(ts).slice(-10)
  return a.slice(0, 6) + '-' + a.slice(6, 10)
}

onMounted(async () => {
  const o = await getById(String(route.params.id))
  if (!o) return
  if (!pharmacyCode.value || o.pharmacyCode !== pharmacyCode.value) return
  order.value = o
})

async function set (status: OrderStatus) {
  if (!order.value?.id) return
  saving.value = true
  msg.value = ''
  try {
    await setStatus(order.value.id, status)
    order.value.status = status
    msgKind.value = 'success'
    msg.value = 'Статус змінено.'
  } catch (e: any) {
    msgKind.value = 'error'
    msg.value = e?.message || 'Не вдалося змінити статус.'
  } finally {
    saving.value = false
  }
}
</script>
