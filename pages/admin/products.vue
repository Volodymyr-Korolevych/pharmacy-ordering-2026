<template>
  <div class="grid gap-6">
    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 class="text-xl font-bold">Адмін • Товари (ліки)</h1>
      <p class="mt-1 text-sm text-gray-600">CRUD товарів. Категорії фіксовані (2 рівні).</p>

      <div class="mt-4">
        <UiButton variant="primary" @click="openCreate">Додати товар</UiButton>
      </div>
    </div>

    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <div v-if="loading" class="text-sm text-gray-600">Завантаження...</div>

      <div v-else class="grid gap-3">
        <div
          v-for="p in products"
          :key="p.id"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
        >
          <div class="min-w-[220px]">
            <div class="text-sm font-semibold">{{ p.name }}</div>
            <div class="text-xs text-gray-500">{{ p.parentCategory }} / {{ p.childCategory }}</div>
            <div class="text-xs text-gray-500">{{ p.price.toFixed(2) }} грн</div>
          </div>

          <div class="flex gap-2">
            <UiButton @click="openEdit(p)">Редагувати</UiButton>
            <UiButton variant="danger" @click="onDelete(p.id!)">Видалити</UiButton>
          </div>
        </div>

        <div v-if="products.length === 0" class="text-sm text-gray-600">
          Товарів поки немає.
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div class="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">{{ formMode === 'create' ? 'Додати товар' : 'Редагувати товар' }}</h2>
          <button class="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50" @click="closeForm">✕</button>
        </div>

        <form class="mt-4 grid gap-3" @submit.prevent="save">
          <div class="grid gap-3 md:grid-cols-2">
            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Назва</span>
              <input v-model.trim="form.name" required class="rounded-xl border px-3 py-2" />
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Ціна (грн)</span>
              <input v-model.number="form.price" type="number" min="0.01" step="0.01" required class="rounded-xl border px-3 py-2" />
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Категорія (1 рівень)</span>
              <select v-model="form.parentCategory" required class="rounded-xl border px-3 py-2" @change="onParentChanged">
                <option value="" disabled>— Оберіть —</option>
                <option v-for="p in parents" :key="p" :value="p">{{ p }}</option>
              </select>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Підкатегорія (2 рівень)</span>
              <select v-model="form.childCategory" required class="rounded-xl border px-3 py-2" :disabled="!form.parentCategory">
                <option value="" disabled>— Оберіть —</option>
                <option v-for="c in children" :key="c" :value="c">{{ c }}</option>
              </select>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Виробник</span>
              <input v-model.trim="form.manufacturer" required class="rounded-xl border px-3 py-2" />
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Зображення (URL)</span>
              <input v-model.trim="form.imageUrl" class="rounded-xl border px-3 py-2" />
            </label>
          </div>

          <label class="grid gap-1">
            <span class="text-sm text-gray-700">Опис</span>
            <textarea v-model.trim="form.description" rows="5" required class="rounded-xl border px-3 py-2"></textarea>
          </label>

          <AlertBox :text="msg" :kind="msgKind" />

          <div class="flex justify-end gap-2">
            <UiButton @click="closeForm">Скасувати</UiButton>
            <UiButton type="submit" variant="primary" :disabled="saving">Зберегти</UiButton>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/data/categories'
import type { Product } from '~/composables/useProducts'
definePageMeta({ middleware: ['admin'] })

const { products, loading, fetchAll, create, update, remove } = useProducts()

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)

const parents = computed(() => Object.keys(CATEGORIES))
const children = computed(() => {
  const p = form.parentCategory
  if (!p) return []
  return (CATEGORIES as any)[p] as string[]
})

const form = reactive<Product>({
  name: '',
  parentCategory: parents.value[0] || '',
  childCategory: '',
  manufacturer: '',
  description: '',
  price: 0,
  imageUrl: ''
})

const saving = ref(false)
const msg = ref('')
const msgKind = ref<'info'|'error'|'success'>('info')

onMounted(async () => {
  await fetchAll()
})

function openCreate () {
  formMode.value = 'create'
  editingId.value = null
  form.name = ''
  form.price = 0
  form.parentCategory = parents.value[0] || ''
  form.childCategory = ''
  form.manufacturer = ''
  form.description = ''
  form.imageUrl = ''
  showForm.value = true
  msg.value = ''
}

function openEdit (p: Product) {
  formMode.value = 'edit'
  editingId.value = p.id || null
  form.name = p.name
  form.price = p.price
  form.parentCategory = p.parentCategory
  form.childCategory = p.childCategory
  form.manufacturer = p.manufacturer
  form.description = p.description
  form.imageUrl = p.imageUrl
  showForm.value = true
  msg.value = ''
}

function closeForm () {
  showForm.value = false
}

function onParentChanged () {
  form.childCategory = ''
}

async function save () {
  msg.value = ''
  if (!form.childCategory) {
    msgKind.value = 'error'
    msg.value = 'Оберіть підкатегорію (2 рівень).'
    return
  }
  if (!Number.isFinite(form.price) || form.price <= 0) {
    msgKind.value = 'error'
    msg.value = 'Ціна має бути > 0.'
    return
  }

  saving.value = true
  try {
    const payload: Product = {
      name: form.name,
      parentCategory: form.parentCategory,
      childCategory: form.childCategory,
      manufacturer: form.manufacturer,
      description: form.description,
      price: Number(form.price),
      imageUrl: form.imageUrl
    }

    if (formMode.value === 'create') {
      await create(payload)
    } else if (editingId.value) {
      await update(editingId.value, payload)
    }

    msgKind.value = 'success'
    msg.value = 'Збережено.'
    await fetchAll()
    showForm.value = false
  } catch (e: any) {
    msgKind.value = 'error'
    msg.value = e?.message || 'Помилка збереження.'
  } finally {
    saving.value = false
  }
}

async function onDelete (id: string) {
  const ok = confirm('Видалити товар?')
  if (!ok) return
  try {
    await remove(id)
    await fetchAll()
  } catch (e: any) {
    alert(e?.message || 'Помилка видалення.')
  }
}
</script>
