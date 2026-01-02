<template>
  <div v-if="!order" class="rounded-2xl border bg-white p-5 text-sm text-gray-600">
    Замовлення не знайдено або доступ заборонено.
  </div>

  <div v-else class="rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Замовлення {{ order.id?.slice(-6) }}</h1>
    <div class="mt-1 text-sm text-gray-600">
      {{ new Date(order.createdAt).toLocaleString('uk-UA') }} • Аптека: {{ order.pharmacyCode }}
    </div>

    <div class="mt-4 grid gap-2">
      <div v-for="it in order.items" :key="it.productId" class="flex justify-between rounded-xl border p-3 text-sm">
        <div>{{ it.name }} × {{ it.qty }}</div>
        <div class="font-semibold">{{ (it.price * it.qty).toFixed(2) }} грн</div>
      </div>
    </div>

    <div class="mt-4 flex justify-between text-sm">
      <span>Разом:</span>
      <span class="text-lg font-bold">{{ order.total.toFixed(2) }} грн</span>
    </div>
  </div>
</template>

<script setup lang="ts">
await requireRole('client')

const route = useRoute()
const { clientUser } = useAuthFacade()
const { getById } = useOrders()

const order = ref<any | null>(null)

onMounted(async () => {
  const o = await getById(String(route.params.id))
  if (!o) return
  if (!clientUser.value || o.userId !== clientUser.value.uid) return
  order.value = o
})
</script>
