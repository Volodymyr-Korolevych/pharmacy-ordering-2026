<template>
  <div class="rounded-2xl border bg-white p-3 shadow-sm hover:shadow transition">
    
    <NuxtLink :to="`/product/${product.id}`" class="block">
      <div class="aspect-square flex items-center justify-center overflow-hidden">
        <img
          :src="imageSrc"
          alt=""
          class="max-h-full max-w-full object-contain"
        />
      </div>

      <div class="mt-2 text-sm font-semibold line-clamp-2">
        {{ product.name }}
      </div>

      <div class="mt-1 text-sm text-gray-700">
        {{ Number(product.price || 0).toFixed(2) }} грн
      </div>
    </NuxtLink>

    <UiButton
      class="mt-3 w-full"
      :variant="inCart ? 'ghost' : 'primary'"
      @click="add"
    >
      {{ inCart ? 'У кошику' : 'В кошик' }}
    </UiButton>

  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const props = defineProps<{
  product: any
}>()

const cart = useCartStore()

const imageSrc = computed(() => {
  if (props.product.imageUrl) return props.product.imageUrl
  if (props.product.imagePath) return '/' + props.product.imagePath.replace(/^\/+/, '')
  return ''
})

// CHECK IF PRODUCT ALREADY IN CART
const inCart = computed(() => {
  return cart.items.some(i => i.productId === props.product.id)
})

function add () {
  if (inCart.value) return

  cart.add({
    productId: props.product.id,
    name: props.product.name,
    price: Number(props.product.price || 0),
    qty: 1
  })
}
</script>
