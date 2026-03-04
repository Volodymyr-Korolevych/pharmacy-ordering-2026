<template>
  <header class="border-b bg-white">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
      <!-- Brand -->
      <div class="flex items-center gap-3">
        <div class="h-9 w-9 rounded-xl bg-emerald-600"></div>
        <div>
          <div class="text-sm font-semibold leading-4">Мережа аптек</div>
          <div class="text-xs text-gray-500">Онлайн-замовлення (самовивіз)</div>
        </div>
      </div>

      <!-- Search (client only, only on /catalog) -->
      <div v-if="showSearch" class="w-full sm:w-[320px] lg:w-[380px]">
        <label class="relative block">
          <span class="sr-only">Пошук</span>
          <input
            v-model="searchText"
            type="text"
            placeholder="Пошук за назвою товару…"
            class="w-full rounded-2xl border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            v-if="searchText"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
            v-on:click="clearSearch"
            aria-label="Очистити пошук"
          >
            ✕
          </button>
        </label>

      </div>

      <!-- Nav -->
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
          v-on:click="logout"
        >
          Вийти
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()
const route = useRoute()
const router = useRouter()

const { authKind, signOutAll } = useAuthFacade()

const isAdmin = computed(() => authKind.value === 'admin')
const isPharmacist = computed(() => authKind.value === 'pharmacist')
const isClient = computed(() => authKind.value === 'client')
const isAuthed = computed(() => authKind.value !== 'none')

const cartCount = computed(() => cart.totalQty)

const isCatalogPage = computed(() => String(route.path || '') === '/catalog')
const showSearch = computed(() => isClient.value && isCatalogPage.value)

const searchText = ref<string>('')

// sync from URL -> input
watch(
  () => route.query.q,
  (q) => {
    const next = typeof q === 'string' ? q : ''
    // не робимо зайвих перезаписів, щоб не миготіло
    if (searchText.value !== next) searchText.value = next
  },
  { immediate: true }
)

// input -> URL (debounce)
let t: any = null
watch(searchText, (val) => {
  if (!showSearch.value) return

  if (t) clearTimeout(t)
  t = setTimeout(async () => {
    const q = (val || '').trim()
    const nextQuery: any = { ...route.query }
    if (q) nextQuery.q = q
    else delete nextQuery.q

    await router.replace({ path: route.path, query: nextQuery })
  }, 250)
})

function clearSearch () {
  searchText.value = ''
}

async function logout () {
  await signOutAll()
  cart.clear()
  await navigateTo('/auth')
}
</script>
