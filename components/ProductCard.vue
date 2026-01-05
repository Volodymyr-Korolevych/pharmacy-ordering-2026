<template>
  <div class="rounded-2xl border bg-white p-4 shadow-sm">
    <NuxtLink :to="`/product/${product.id}`" class="block">
      <div class="aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
        <img v-if="imgSrc" :src="imgSrc" class="h-full w-full object-cover" alt="" />
      </div>

      <div class="mt-3 text-sm text-gray-500">{{ product.parentCategory }} / {{ product.childCategory }}</div>
      <div class="mt-1 text-base font-semibold">{{ product.name }}</div>
      <div class="mt-1 text-sm text-gray-600">{{ product.manufacturer }}</div>

      <div class="mt-3 flex items-center justify-between">
        <div class="text-lg font-bold">{{ product.price.toFixed(2) }} грн</div>
        <UiButton @click.prevent="addToCart">Додати</UiButton>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import { useCartStore } from '~/stores/cart'

const props = defineProps<{ product: Product & { imagePath?: string } }>()
const cart = useCartStore()

const imgSrc = computed(() => {
  if (props.product.imageUrl) return props.product.imageUrl
  if (props.product.imagePath) return '/' + String(props.product.imagePath).replace(/\.jpg$/i, '.svg')
  return ''
})

function addToCart () {
  cart.add({
    productId: props.product.id!,
    name: props.product.name,
    price: props.product.price,
    imageUrl: imgSrc.value
  }, 1)
}
</script>
