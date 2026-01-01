<template>
  <div class="rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Замовлення моєї аптеки</h1>
    <p class="mt-1 text-sm text-gray-600">Ви бачите лише замовлення аптеки: <span class="font-semibold">{{ pharmacyCode }}</span></p>

    <div v-if="loading" class="mt-4 text-sm text-gray-600">Завантаження...</div>

    <div v-else class="mt-4 grid gap-3">
      <NuxtLink
        v-for="o in orders"
        :key="o.id"
        :to="`/pharmacist/orders/${o.id}`"
        class="rounded-xl border p-3 hover:bg-gray-50"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold">Замовлення {{ o.id?.slice(-6) }}</div>
          <div class="text-sm font-bold">{{ o.total.toFixed(2) }} грн</div>
        </div>
        <div class="mt-1 text-xs text-gray-500">
          {{ new Date(o.createdAt).toLocaleString('uk-UA') }} • Статус: {{ statusUa(o.status) }}
        </div>
      </NuxtLink>

      <div v-if="orders.length === 0" class="text-sm text-gray-600">
        Замовлень поки немає.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ['pharmacist'] })

const { pharmacyCode } = useAuthFacade()
const { listForPharmacy, loading } = useOrders()
const orders = ref<any[]>([])

function statusUa (s: string) {
  if (s === 'issued') return 'видане'
  if (s === 'canceled') return 'скасоване'
  return 'нове'
}

onMounted(async () => {
  if (!pharmacyCode.value) return
  orders.value = await listForPharmacy(pharmacyCode.value)
})
</script>
