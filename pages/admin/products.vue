<template>
  <div class="grid gap-6">
    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 class="text-xl font-bold">Адмін • Товари</h1>
      <p class="mt-1 text-sm text-gray-600">
        Стартові зображення: <span class="font-semibold">/public/images/</span> (поле <code>imagePath</code>).
        Якщо адмін завантажує файл — він піде в <span class="font-semibold">Storage</span>, а у товарі запишеться <code>imageUrl</code>.
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
          <div class="min-w-[280px]">
            <div class="text-sm font-semibold">{{ p.name }}</div>
            <div class="text-xs text-gray-500">{{ p.parentCategory }} / {{ p.childCategory }}</div>
            <div class="text-xs text-gray-500">{{ formatPrice(p.price) }} • {{ p.unit }}</div>
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

    <!-- MODAL -->
    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/40 p-3 md:p-6">
      <div class="mx-auto flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div class="min-w-0">
            <h2 class="truncate text-lg font-semibold">
              {{ formMode === 'create' ? 'Додати товар' : 'Редагувати товар' }}
            </h2>
            <div class="mt-0.5 text-xs text-gray-500">
              Вкладки зручніші за скрол всієї сторінки. Скрол є тільки всередині модалки.
            </div>
          </div>

          <button class="rounded-xl border px-3 py-1 text-sm hover:bg-gray-50" @click="closeForm">✕</button>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 border-b px-5 py-3">
          <button
            class="rounded-xl px-3 py-2 text-sm"
            :class="tab==='main' ? 'bg-gray-900 text-white' : 'border hover:bg-gray-50'"
            @click="tab='main'"
            type="button"
          >
            Основне
          </button>
          <button
            class="rounded-xl px-3 py-2 text-sm"
            :class="tab==='desc' ? 'bg-gray-900 text-white' : 'border hover:bg-gray-50'"
            @click="tab='desc'"
            type="button"
          >
            Опис
          </button>
        </div>

        <!-- Body (scroll area) -->
        <form class="flex-1 overflow-y-auto px-5 py-4" @submit.prevent="save">
          <!-- MAIN TAB -->
          <div v-show="tab==='main'" class="grid gap-4">
            <div class="grid gap-3 md:grid-cols-2">
              <label class="grid gap-1">
                <span class="text-sm text-gray-700">Назва</span>
                <input v-model.trim="form.name" required class="rounded-xl border px-3 py-2" />
              </label>

              <label class="grid gap-1">
                <span class="text-sm text-gray-700">Одиниці (unit)</span>
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
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-2xl border p-4">
                <div class="text-sm font-semibold">Зображення</div>

                <div class="mt-3 grid gap-2">
                  <div class="text-xs text-gray-500">Поточне (Storage або local)</div>
                  <div class="aspect-square overflow-hidden rounded-xl bg-gray-100">
                    <img v-if="previewSrc" :src="previewSrc" class="h-full w-full object-cover" alt="" />
                  </div>

                  <div class="grid gap-1">
                    <span class="text-sm text-gray-700">Стартове локальне imagePath</span>
                    <input v-model.trim="form.imagePath" placeholder="images/002.webp" class="rounded-xl border px-3 py-2" />
                    <span class="text-xs text-gray-500">
                      Це для стартової колекції (в <code>/public/images</code>).
                    </span>
                  </div>

                  <div class="grid gap-1">
                    <span class="text-sm text-gray-700">Storage imageUrl (заповнюється після upload)</span>
                    <input v-model.trim="form.imageUrl" placeholder="https://firebasestorage.googleapis.com/..." class="rounded-xl border px-3 py-2" />
                  </div>

                  <div class="grid gap-2 pt-2">
                    <span class="text-sm text-gray-700">Завантажити нове зображення в Storage</span>
                    <input type="file" accept="image/*" class="block w-full text-sm" @change="onFileChange" />
                    <div class="text-xs text-gray-500">
                      Після вибору файлу він завантажиться в Storage при натисканні <b>Зберегти</b>.
                    </div>
                  </div>
                </div>
              </div>

              <div class="rounded-2xl border p-4">
                <div class="text-sm font-semibold">Підказка</div>
                <div class="mt-2 text-sm text-gray-700 leading-6">
                  Якщо завантажуєш файл — ми записуємо <code>imageUrl</code>.
                  <br />
                  Якщо файл не завантажуєш — картинка береться з <code>imagePath</code> (локально).
                </div>
              </div>
            </div>
          </div>

          <!-- DESC TAB -->
          <div v-show="tab==='desc'" class="grid gap-3 md:grid-cols-2">
            <Field label="Склад" v-model="form.description.composition" />
            <Field label="Лікарська форма" v-model="form.description.dosageForm" />
            <Field label="Фармакотерапевтична група" v-model="form.description.pharmacotherapeuticGroup" />
            <Field label="Фармакологічні властивості" v-model="form.description.pharmacologicalProperties" />
            <Field label="Показання" v-model="form.description.indications" />
            <Field label="Протипоказання" v-model="form.description.contraindications" />
            <Field label="Спосіб застосування та дози" v-model="form.description.dosageAndAdministration" />
            <Field label="Термін придатності" v-model="form.description.shelfLife" />
            <Field label="Умови зберігання" v-model="form.description.storageConditions" />
            <Field label="Упаковка" v-model="form.description.packaging" />
            <Field label="Виробник" v-model="form.description.manufacturerInfo" class="md:col-span-2" />
          </div>

          <AlertBox :text="msg" :kind="msgKind" />
        </form>

        <!-- Footer -->
        <div class="flex justify-end gap-2 border-t px-5 py-4">
          <UiButton @click="closeForm">Скасувати</UiButton>
          <UiButton type="button" variant="primary" :disabled="saving" @click="save">
            {{ saving ? 'Збереження...' : 'Зберегти' }}
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/data/categories'

onMounted(async () => {
  await requireRole('admin')
})

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

const tab = ref<'main'|'desc'>('main')

const fileToUpload = ref<File | null>(null)

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

function formatPrice(v: any) {
  const n = Number(v || 0)
  return `${n.toFixed(2)} грн`
}

function normalizeLocalImagePath(imagePath: string) {
  const raw = String(imagePath || '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  const rel = raw.includes('/') ? raw.replace(/^\/+/, '') : `images/${raw}`
  return '/' + rel
}

const previewSrc = computed(() => {
  if (form.imageUrl) return form.imageUrl
  if (form.imagePath) return normalizeLocalImagePath(form.imagePath)
  return ''
})

function openCreate () {
  formMode.value = 'create'
  editingId.value = null
  tab.value = 'main'
  fileToUpload.value = null

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
  tab.value = 'main'
  fileToUpload.value = null

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
  fileToUpload.value = null
}

function onParentChanged () {
  form.childCategory = ''
}

function onFileChange (e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0] || null
  fileToUpload.value = f
}

async function uploadImageIfNeeded(productId: string | null) {
  if (!fileToUpload.value) return null

  const fd = new FormData()
  fd.append('file', fileToUpload.value)
  if (productId) fd.append('productId', productId)

  const res = await $fetch<any>('/api/admin/upload', {
    method: 'POST',
    body: fd
  })

  if (!res?.ok) throw new Error('Upload failed')
  return { downloadURL: res.downloadURL as string, filePath: res.filePath as string }
}

async function save () {
  msg.value = ''
  if (!form.childCategory) {
    msgKind.value = 'error'
    msg.value = 'Оберіть підкатегорію (2 рівень).'
    tab.value = 'main'
    return
  }

  saving.value = true
  try {
    // 1) build payload (without upload first)
    const payload: any = {
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

    // 2) If create: create first to get id, then upload and update imageUrl
    if (formMode.value === 'create') {
      const created = await create(payload) // expect it may return id; if not, we fallback by refetch
      const newId = typeof created === 'string' ? created : (created?.id || null)

      const up = await uploadImageIfNeeded(newId)
      if (up?.downloadURL) {
        payload.imageUrl = up.downloadURL
        // after upload, imageUrl wins. imagePath can stay as is (starter) or be cleared; we keep it.
        if (newId) await update(newId, payload)
      }
    } else if (editingId.value) {
      // edit: upload first (so we store imageUrl) then update
      const up = await uploadImageIfNeeded(editingId.value)
      if (up?.downloadURL) payload.imageUrl = up.downloadURL
      await update(editingId.value, payload)
    }

    msgKind.value = 'success'
    msg.value = 'Збережено.'
    await fetchAll()
    showForm.value = false
    fileToUpload.value = null
  } catch (e: any) {
    msgKind.value = 'error'
    msg.value = e?.data?.message || e?.message || 'Помилка збереження.'
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

const Field = defineComponent({
  props: {
    label: { type: String, required: true },
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () => h('label', { class: ['grid gap-1', (attrs as any).class || ''] }, [
      h('span', { class: 'text-sm text-gray-700' }, props.label),
      h('textarea', {
        class: 'rounded-xl border px-3 py-2',
        rows: 3,
        value: props.modelValue,
        onInput: (e: any) => emit('update:modelValue', e.target.value)
      })
    ])
  }
})
</script>
