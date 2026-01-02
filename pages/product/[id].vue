<template>
  <div v-if="!product" class="rounded-2xl border bg-white p-5 text-sm text-gray-600">
    Товар не знайдено.
  </div>

  <div v-else class="grid gap-6 md:grid-cols-[280px_1fr]">
    <div class="overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">
      <div class="aspect-square overflow-hidden rounded-xl bg-gray-100">
        <img v-if="product.imageUrl" :src="product.imageUrl" class="h-full w-full object-cover" alt="" />
      </div>
      <div class="mt-4 text-sm text-gray-500">{{ product.parentCategory }} / {{ product.childCategory }}</div>
      <div class="mt-2 text-2xl font-bold">{{ product.price.toFixed(2) }} грн</div>
      <UiButton class="mt-4 w-full" variant="primary" @click="add">Додати в кошик</UiButton>
    </div>

    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 class="text-2xl font-bold">{{ product.name }}</h1>
      <div class="mt-2 text-sm text-gray-600">Виробник: <span class="font-medium">{{ product.manufacturer }}</span></div>
      <p class="mt-4 whitespace-pre-line text-sm leading-6 text-gray-800">
        {{ product.description }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

await requireRole('client')

const route = useRoute()
const { products, fetchAll } = useProducts()
const cart = useCartStore()

const product = computed(() => products.value.find(p => p.id === String(route.params.id)))

onMounted(async () => {
  if (products.value.length === 0) await fetchAll()
})

function add () {
  if (!product.value?.id) return
  cart.add({
    productId: product.value.id,
    name: product.value.name,
    price: product.value.price,
    imageUrl: product.value.imageUrl
  }, 1)
  navigateTo('/cart')
}
</script>
