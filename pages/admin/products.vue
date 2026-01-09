<template>
  <div class="grid gap-6">
    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 class="text-xl font-bold">Адмін • Товари</h1>
      <p class="mt-1 text-sm text-gray-600">
        Стартові зображення: <span class="font-semibold">/public/images/</span> (поле <code>imagePath</code>).
        Якщо адмін завантажує нове/оновлене зображення — воно має йти в Storage (поле <code>imageUrl</code>).
      </p>

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
          <div class="min-w-[260px]">
            <div class="text-sm font-semibold">{{ p.name }}</div>
            <div class="text-xs text-gray-500">{{ p.parentCategory }} / {{ p.childCategory }}</div>
            <div class="text-xs text-gray-500">{{ p.price?.toFixed?.(2) ?? p.price }} грн • {{ p.unit }}</div>
          </div>

          <div class="flex gap-2">
            <UiButton @click="openEdit(p)">Редагувати</UiButton>
            <UiButton variant="danger" @click="onDelete(p.id)">Видалити</UiButton>
          </div>
        </div>

        <div v-if="products.length === 0" class="text-sm text-gray-600">
          Товарів поки немає.
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div class="w-full max-w-5xl rounded-2xl bg-white p-5 shadow-xl">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold">
            {{ formMode === 'create' ? 'Додати товар' : 'Редагувати товар' }}
          </h2>
          <button class="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50" @click="closeForm">✕</button>
        </div>

        <form class="mt-4 grid gap-4" @submit.prevent="save">
          <div class="grid gap-3 md:grid-cols-2">
            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Назва</span>
              <input v-model.trim="form.name" required class="rounded-xl border px-3 py-2" />
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Одиниці виміру (unit)</span>
              <input v-model.trim="form.unit" required class="rounded-xl border px-3 py-2" />
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
              <span class="text-sm text-gray-700">Виробник (manufacturer)</span>
              <input v-model.trim="form.manufacturer" required class="rounded-xl border px-3 py-2" />
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Ціна (грн)</span>
              <input v-model.number="form.price" type="number" min="0" step="0.01" required class="rounded-xl border px-3 py-2" />
            </label>

            <label class="grid gap-1 md:col-span-2">
              <span class="text-sm text-gray-700">imagePath (локально в /public/images/)</span>
              <input v-model.trim="form.imagePath" placeholder="images/002.webp" class="rounded-xl border px-3 py-2" />
              <span class="text-xs text-gray-500">Для стартової колекції використовуй лише <code>imagePath</code>.</span>
            </label>

            <label class="grid gap-1 md:col-span-2">
              <span class="text-sm text-gray-700">imageUrl (Storage download URL)</span>
              <input v-model.trim="form.imageUrl" placeholder="https://firebasestorage.googleapis.com/..." class="rounded-xl border px-3 py-2" />
              <span class="text-xs text-gray-500">Це поле буде заповнюватися, коли додамо upload в Storage (наступний TASK).</span>
            </label>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Склад</span>
              <textarea v-model.trim="form.description.composition" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Лікарська форма</span>
              <textarea v-model.trim="form.description.dosageForm" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Фармакотерапевтична група</span>
              <textarea v-model.trim="form.description.pharmacotherapeuticGroup" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Фармакологічні властивості</span>
              <textarea v-model.trim="form.description.pharmacologicalProperties" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Показання</span>
              <textarea v-model.trim="form.description.indications" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Протипоказання</span>
              <textarea v-model.trim="form.description.contraindications" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Спосіб застосування та дози</span>
              <textarea v-model.trim="form.description.dosageAndAdministration" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Термін придатності</span>
              <textarea v-model.trim="form.description.shelfLife" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Умови зберігання</span>
              <textarea v-model.trim="form.description.storageConditions" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1">
              <span class="text-sm text-gray-700">Упаковка</span>
              <textarea v-model.trim="form.description.packaging" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>

            <label class="grid gap-1 md:col-span-2">
              <span class="text-sm text-gray-700">Виробник (в описі)</span>
              <textarea v-model.trim="form.description.manufacturerInfo" rows="3" class="rounded-xl border px-3 py-2"></textarea>
            </label>
          </div>

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

onMounted(async () => {
  await requireRole('admin')
})

// We rely on existing useProducts() runtime.
// Types are kept flexible to avoid breaking builds.
const { products, loading, fetchAll, create, update, remove } = useProducts() as any

const showForm = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)

const parents = computed(() => Object.keys(CATEGORIES))
const children = computed(() => {
  const p = form.parentCategory
  if (!p) return []
  return (CATEGORIES as any)[p] as string[]
})

const form = reactive<any>({
  name: '',
  unit: '',
  imagePath: '',
  imageUrl: '',
  parentCategory: '',
  childCategory: '',
  manufacturer: '',
  price: 0,
  description: {
    composition: '',
    dosageForm: '',
    pharmacotherapeuticGroup: '',
    pharmacologicalProperties: '',
    indications: '',
    contraindications: '',
    dosageAndAdministration: '',
    shelfLife: '',
    storageConditions: '',
    packaging: '',
    manufacturerInfo: ''
  }
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
  form.unit = ''
  form.imagePath = ''
  form.imageUrl = ''
  form.parentCategory = parents.value[0] || ''
  form.childCategory = ''
  form.manufacturer = ''
  form.price = 0

  Object.assign(form.description, {
    composition: '',
    dosageForm: '',
    pharmacotherapeuticGroup: '',
    pharmacologicalProperties: '',
    indications: '',
    contraindications: '',
    dosageAndAdministration: '',
    shelfLife: '',
    storageConditions: '',
    packaging: '',
    manufacturerInfo: ''
  })

  showForm.value = true
  msg.value = ''
}

function openEdit (p: any) {
  formMode.value = 'edit'
  editingId.value = p.id || null

  form.name = p.name || ''
  form.unit = p.unit || ''
  form.imagePath = p.imagePath || ''
  form.imageUrl = p.imageUrl || ''
  form.parentCategory = p.parentCategory || parents.value[0] || ''
  form.childCategory = p.childCategory || ''
  form.manufacturer = p.manufacturer || ''
  form.price = Number(p.price || 0)

  Object.assign(form.description, {
    composition: p.description?.composition || '',
    dosageForm: p.description?.dosageForm || '',
    pharmacotherapeuticGroup: p.description?.pharmacotherapeuticGroup || '',
    pharmacologicalProperties: p.description?.pharmacologicalProperties || '',
    indications: p.description?.indications || '',
    contraindications: p.description?.contraindications || '',
    dosageAndAdministration: p.description?.dosageAndAdministration || '',
    shelfLife: p.description?.shelfLife || '',
    storageConditions: p.description?.storageConditions || '',
    packaging: p.description?.packaging || '',
    manufacturerInfo: p.description?.manufacturerInfo || ''
  })

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

  saving.value = true
  try {
    const payload = {
      name: form.name,
      unit: form.unit,
      imagePath: form.imagePath,
      imageUrl: form.imageUrl,
      parentCategory: form.parentCategory,
      childCategory: form.childCategory,
      manufacturer: form.manufacturer,
      price: Number(form.price || 0),
      description: { ...form.description }
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
