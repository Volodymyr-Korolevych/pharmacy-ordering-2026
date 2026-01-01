<template>
  <div class="rounded-2xl border bg-white p-4 shadow-sm">
    <div class="flex gap-4">
      <div class="h-20 w-20 overflow-hidden rounded-xl bg-gray-100">
        <img v-if="product.imageUrl" :src="product.imageUrl" class="h-full w-full object-cover" alt="" />
      </div>
      <div class="flex-1">
        <NuxtLink :to="`/product/${product.id}`" class="font-semibold hover:underline">
          {{ product.name }}
        </NuxtLink>
        <div class="mt-1 text-xs text-gray-500">
          {{ product.parentCategory }} / {{ product.childCategory }}
        </div>
        <div class="mt-2 flex items-center justify-between">
          <div class="text-sm font-semibold">{{ product.price.toFixed(2) }} грн</div>
          <UiButton variant="primary" @click="addToCart">Додати</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import { useCartStore } from '~/stores/cart'

const props = defineProps<{ product: Product }>()
const cart = useCartStore()

function addToCart () {
  if (!props.product.id) return
  cart.add({
    productId: props.product.id,
    name: props.product.name,
    price: props.product.price,
    imageUrl: props.product.imageUrl
  }, 1)
}
</script>
