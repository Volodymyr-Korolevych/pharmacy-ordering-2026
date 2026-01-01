<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <header class="border-b bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div class="flex items-center gap-3">
          <div class="h-9 w-9 rounded-xl bg-emerald-600"></div>
          <div>
            <div class="text-sm font-semibold leading-4">Мережа аптек</div>
            <div class="text-xs text-gray-500">Онлайн-замовлення (самовивіз)</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <NuxtLink v-if="isClient" to="/catalog" class="px-3 py-2 text-sm hover:underline">Каталог</NuxtLink>
          <NuxtLink v-if="isClient" to="/cart" class="px-3 py-2 text-sm hover:underline">
            Кошик
            <span v-if="cartCount > 0" class="ml-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">{{ cartCount }}</span>
          </NuxtLink>
          <NuxtLink v-if="isClient" to="/orders" class="px-3 py-2 text-sm hover:underline">Мої замовлення</NuxtLink>

          <NuxtLink v-if="isPharmacist" to="/pharmacist/orders" class="px-3 py-2 text-sm hover:underline">Замовлення аптеки</NuxtLink>

          <NuxtLink v-if="isAdmin" to="/admin/products" class="px-3 py-2 text-sm hover:underline">Товари</NuxtLink>

          <button
            v-if="isAuthed"
            class="ml-2 rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            @click="logout"
          >
            Вийти
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
const cart = useCartStore()

const { authKind, signOutAll } = useAuthFacade()

const isAdmin = computed(() => authKind.value === 'admin')
const isPharmacist = computed(() => authKind.value === 'pharmacist')
const isClient = computed(() => authKind.value === 'client')
const isAuthed = computed(() => authKind.value !== 'none')

const cartCount = computed(() => cart.totalQty)

async function logout () {
  await signOutAll()
  cart.clear()
  await navigateTo('/auth')
}
</script>
