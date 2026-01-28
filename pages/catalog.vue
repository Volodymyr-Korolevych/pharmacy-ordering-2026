<template>
  <div class="grid gap-6">
    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold">Каталог ліків</h1>
          <p class="mt-1 text-sm text-gray-600">Оберіть категорію та додайте препарати в кошик.</p>
        </div>

        <!-- Filters -->
        <div class="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
          <label class="grid gap-1">
            <span class="text-sm text-gray-700">Категорія</span>
            <select
              v-model="selectedParent"
              class="min-w-[220px] rounded-xl border px-3 py-2"
              v-on:change="onParentChanged"
            >
              <option value="">Усі категорії</option>
              <option v-for="p in parents" v-bind:key="p" v-bind:value="p">
                {{ p }}
              </option>
            </select>
          </label>

          <label class="grid gap-1">
            <span class="text-sm text-gray-700">Підкатегорія</span>
            <select
              v-model="selectedChild"
              class="min-w-[220px] rounded-xl border px-3 py-2"
              v-bind:disabled="!selectedParent"
            >
              <option value="">Усі підкатегорії</option>
              <option v-for="c in children" v-bind:key="c" v-bind:value="c">
                {{ c }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-600">Завантаження...</div>

    <div v-else class="grid gap-4">
      <div class="text-sm text-gray-600">
        Показано: <b>{{ filtered.length }}</b> товарів
        <span v-if="selectedParent"> • {{ selectedParent }}</span>
        <span v-if="selectedChild"> / {{ selectedChild }}</span>
      </div>

      <!-- 4 cards per row on large screens -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <ProductCard
          v-for="p in filtered"
          v-bind:key="p.id"
          v-bind:product="p"
        />
      </div>

      <div v-if="filtered.length === 0" class="text-sm text-gray-600">
        Нічого не знайдено для обраних фільтрів.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/data/categories'

const { products, loading, fetchAll } = useProducts() as any

const selectedParent = ref<string>('')
const selectedChild = ref<string>('')

const parents = computed(() => Object.keys(CATEGORIES))

const children = computed(() => {
  if (!selectedParent.value) return []
  return (CATEGORIES as any)[selectedParent.value] as string[]
})

const filtered = computed(() => {
  const list = Array.isArray(products.value) ? products.value : []
  const p = selectedParent.value
  const c = selectedChild.value

  return list.filter((x: any) => {
    if (p && x.parentCategory !== p) return false
    if (c && x.childCategory !== c) return false
    return true
  })
})

function onParentChanged () {
  selectedChild.value = ''
}

onMounted(async () => {
  await requireRole('client') // щоб не ловити SSR 500
  await fetchAll()
})
</script>
