<template>
  <div class="grid gap-6">
    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 class="text-xl font-bold">Кошик</h1>

      <div v-if="cart.items.length === 0" class="mt-3 text-sm text-gray-600">
        Кошик порожній.
      </div>

      <div v-else class="mt-4 grid gap-3">
        <div v-for="it in cart.items" :key="it.productId" class="flex items-center justify-between rounded-xl border p-3">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 overflow-hidden rounded-lg bg-gray-100">
              <img v-if="it.imageUrl" :src="it.imageUrl" class="h-full w-full object-cover" alt="" />
            </div>
            <div>
              <div class="text-sm font-semibold">{{ it.name }}</div>
              <div class="text-xs text-gray-500">{{ it.price.toFixed(2) }} грн</div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input
              :value="it.qty"
              type="number"
              min="1"
              class="w-20 rounded-xl border px-3 py-2 text-sm"
              @input="onQty(it.productId, $event)"
            />
            <UiButton variant="danger" @click="cart.remove(it.productId)">Видалити</UiButton>
          </div>
        </div>

        <div class="flex items-center justify-between pt-2">
          <div class="text-sm text-gray-700">Разом:</div>
          <div class="text-lg font-bold">{{ cart.total.toFixed(2) }} грн</div>
        </div>

        <div class="flex justify-end">
          <UiButton variant="primary" @click="goCheckout">Оформити (самовивіз)</UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
definePageMeta({ middleware: ['client'] })

const cart = useCartStore()

function onQty (productId: string, e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  cart.setQty(productId, Number.isFinite(val) ? val : 1)
}

function goCheckout () {
  if (cart.items.length === 0) return
  navigateTo('/checkout')
}
</script>
