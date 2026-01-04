<template>
  <div class="grid gap-6">
    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 class="text-xl font-bold">Каталог ліків</h1>
      <p class="mt-1 text-sm text-gray-600">Категорії фіксовані (2 рівні). Пошуку/фільтрів немає.</p>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Категорія (1 рівень)</span>
          <select v-model="parent" class="rounded-xl border px-3 py-2">
            <option value="">— Усі —</option>
            <option v-for="p in parents" :key="p" :value="p">{{ p }}</option>
          </select>
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Підкатегорія (2 рівень)</span>
          <select v-model="child" class="rounded-xl border px-3 py-2" :disabled="!parent">
            <option value="">— Усі —</option>
            <option v-for="c in children" :key="c" :value="c">{{ c }}</option>
          </select>
        </label>
      </div>

      <div class="mt-4">
        <UiButton @click="resetFilters">Скинути</UiButton>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div v-if="loading" class="text-sm text-gray-600">Завантаження...</div>
      <ProductCard v-for="p in filtered" :key="p.id" :product="p" />
      <div v-if="!loading && filtered.length === 0" class="rounded-2xl border bg-white p-5 text-sm text-gray-600">
        Нічого не знайдено.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/data/categories'

onMounted(async () => {
  document.title = 'Каталог ліків'
  await requireRole('client')
})

const { products, loading, fetchAll } = useProducts()

const parent = ref<string>('')
const child = ref<string>('')

const parents = computed(() => Object.keys(CATEGORIES))
const children = computed(() => parent.value ? (CATEGORIES as any)[parent.value] as string[] : [])

const filtered = computed(() => {
  return products.value.filter(p => {
    if (parent.value && p.parentCategory !== parent.value) return false
    if (child.value && p.childCategory !== child.value) return false
    return true
  })
})

onMounted(async () => {
  await fetchAll()
})

function resetFilters () {
  parent.value = ''
  child.value = ''
}
</script>
