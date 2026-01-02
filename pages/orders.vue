<template>
  <div class="rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Мої замовлення</h1>
    <p class="mt-1 text-sm text-gray-600">Статуси клієнту не відображаються.</p>

    <div v-if="loading" class="mt-4 text-sm text-gray-600">Завантаження...</div>

    <div v-else class="mt-4 grid gap-3">
      <NuxtLink
        v-for="o in orders"
        :key="o.id"
        :to="`/orders/${o.id}`"
        class="rounded-xl border p-3 hover:bg-gray-50"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm font-semibold">Замовлення {{ o.id?.slice(-6) }}</div>
          <div class="text-sm font-bold">{{ o.total.toFixed(2) }} грн</div>
        </div>
        <div class="mt-1 text-xs text-gray-500">
          {{ new Date(o.createdAt).toLocaleString('uk-UA') }} • Аптека: {{ o.pharmacyCode }}
        </div>
      </NuxtLink>

      <div v-if="orders.length === 0" class="text-sm text-gray-600">
        Замовлень поки немає.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
await requireRole('client')

const { clientUser } = useAuthFacade()
const { listForUser, loading } = useOrders()

const orders = ref<any[]>([])

onMounted(async () => {
  if (!clientUser.value) return
  orders.value = await listForUser(clientUser.value.uid)
})
</script>
