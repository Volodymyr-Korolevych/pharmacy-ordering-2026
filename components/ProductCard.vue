<template>
  <div class="rounded-2xl border bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
    <!-- clickable area -->
    <NuxtLink
      v-if="productLink"
      v-bind:to="productLink"
      class="block"
    >
      <div class="rounded-xl border bg-white p-2">
        <div class="h-28 w-full">
          <img
            v-if="imgSrc"
            v-bind:src="imgSrc"
            alt=""
            class="h-full w-full object-contain"
          />
        </div>
      </div>

      <div class="mt-3 grid gap-1">
        <div class="line-clamp-2 text-sm font-semibold text-gray-900">
          {{ product.name }}
        </div>

        <div class="text-xs text-gray-500">
          {{ product.parentCategory }} / {{ product.childCategory }}
        </div>

        <div class="mt-1 text-xs text-gray-600">
          {{ product.manufacturer }}
        </div>

        <div class="mt-1 flex items-center justify-between gap-2">
          <div class="text-sm font-bold text-gray-900">
            {{ formatPrice(product.price) }}
          </div>
          <div class="text-xs text-gray-500">
            {{ product.unit }}
          </div>
        </div>
      </div>
    </NuxtLink>

    <!-- fallback if no id -->
    <div v-else>
      <div class="rounded-xl border bg-white p-2">
        <div class="h-28 w-full">
          <img
            v-if="imgSrc"
            v-bind:src="imgSrc"
            alt=""
            class="h-full w-full object-contain"
          />
        </div>
      </div>

      <div class="mt-3 grid gap-1">
        <div class="line-clamp-2 text-sm font-semibold text-gray-900">
          {{ product.name }}
        </div>

        <div class="text-xs text-gray-500">
          {{ product.parentCategory }} / {{ product.childCategory }}
        </div>

        <div class="mt-1 text-xs text-gray-600">
          {{ product.manufacturer }}
        </div>

        <div class="mt-1 flex items-center justify-between gap-2">
          <div class="text-sm font-bold text-gray-900">
            {{ formatPrice(product.price) }}
          </div>
          <div class="text-xs text-gray-500">
            {{ product.unit }}
          </div>
        </div>
      </div>
    </div>

    <!-- button stays separate so it doesn't break navigation -->
    <UiButton class="mt-2 w-full" v-on:click="addToCart">
      Додати в кошик
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const props = defineProps<{ product: any }>()

const cart = useCartStore()

const productLink = computed(() => {
  const id = props.product?.id
  return id ? `/product/${id}` : ''
})

function normalizeLocalImagePath(imagePath: string) {
  const raw = String(imagePath || '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  const rel = raw.includes('/') ? raw.replace(/^\/+/, '') : `images/${raw}`
  return '/' + rel
}

const imgSrc = computed(() => {
  if (props.product?.imageUrl) return String(props.product.imageUrl)
  if (props.product?.imagePath) return normalizeLocalImagePath(String(props.product.imagePath))
  return ''
})

function formatPrice(v: any) {
  const n = Number(v || 0)
  return `${n.toFixed(2)} грн`
}

function addToCart () {
  cart.add({
    productId: props.product.id,
    name: props.product.name,
    price: Number(props.product.price || 0),
    qty: 1
  })
}
</script>
