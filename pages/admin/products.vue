<template>
  <div class="grid gap-6">
    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold">Товари</h1>
          <p class="mt-1 text-sm text-gray-600">Створюйте та редагуйте товари каталогу.</p>
        </div>

        <UiButton variant="primary" v-on:click="openCreate">
          Додати товар
        </UiButton>
      </div>

      <!-- Filters (like /catalog) -->
      <div class="mt-4 grid w-full gap-3 sm:grid-cols-2 lg:max-w-2xl">
        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Категорія</span>
          <select
            v-model="selectedParent"
            class="rounded-xl border px-3 py-2"
            v-on:change="onFilterParentChanged"
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
            class="rounded-xl border px-3 py-2"
            v-bind:disabled="!selectedParent"
          >
            <option value="">Усі підкатегорії</option>
            <option v-for="c in filterChildren" v-bind:key="c" v-bind:value="c">
              {{ c }}
            </option>
          </select>
        </label>
      </div>

      <div class="mt-3 text-sm text-gray-600">
        Показано: <b>{{ filteredProducts.length }}</b> товарів
        <span v-if="selectedParent"> • {{ selectedParent }}</span>
        <span v-if="selectedChild"> / {{ selectedChild }}</span>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-gray-600">Завантаження...</div>

    <div v-else class="grid gap-3">
      <div
        v-for="p in filteredProducts"
        v-bind:key="p.id"
        class="rounded-2xl border bg-white p-4 shadow-sm"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="h-12 w-12 overflow-hidden rounded-xl border bg-gray-50 p-1">
              <img
                v-if="imageSrc(p)"
                v-bind:src="imageSrc(p)"
                alt=""
                class="h-full w-full object-contain"
              />
            </div>

            <div>
              <div class="text-sm font-semibold">{{ p.name }}</div>
              <div class="text-xs text-gray-500">
                {{ p.parentCategory }} / {{ p.childCategory }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <UiButton v-on:click="openEdit(p)">Редагувати</UiButton>
            <UiButton variant="danger" v-on:click="remove(p)">Видалити</UiButton>
          </div>
        </div>
      </div>

      <div v-if="filteredProducts.length === 0" class="text-sm text-gray-600">
        Нічого не знайдено для обраних фільтрів.
      </div>
    </div>

    <!-- Modal -->
    <div v-if="modalOpen" class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div class="w-full max-w-4xl rounded-3xl bg-white shadow-xl">
        <div class="flex items-center justify-between border-b p-5">
          <div class="text-lg font-bold">
            {{ editingId ? 'Редагувати товар' : 'Додати товар' }}
          </div>
          <button class="rounded-xl px-3 py-2 text-sm hover:bg-gray-100" v-on:click="closeModal">✕</button>
        </div>

        <!-- Tabs -->
        <div class="border-b px-5">
          <div class="flex gap-2 py-3">
            <button
              type="button"
              class="rounded-xl px-3 py-2 text-sm font-semibold"
              v-bind:class="tab === 'main' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'"
              v-on:click="tab = 'main'"
            >
              Основне
            </button>
            <button
              type="button"
              class="rounded-xl px-3 py-2 text-sm font-semibold"
              v-bind:class="tab === 'desc' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'"
              v-on:click="tab = 'desc'"
            >
              Опис
            </button>
          </div>
        </div>

        <!-- scrollable content -->
        <div class="max-h-[70vh] overflow-auto p-5">
          <!-- TAB: MAIN -->
          <div v-if="tab === 'main'" class="grid gap-5">
            <div class="grid gap-4 lg:grid-cols-[220px_1fr]">
              <div class="text-sm font-semibold text-gray-800">Зображення</div>
              <div class="grid gap-3">
                <div class="h-44 w-44 overflow-hidden rounded-2xl border bg-gray-50 p-2">
                  <img v-if="previewUrl" v-bind:src="previewUrl" alt="" class="h-full w-full object-contain" />
                </div>

                <label class="grid gap-1">
                  <span class="text-sm text-gray-700">Завантажити нове зображення</span>
                  <input type="file" accept="image/*" v-on:change="onFilePicked" />
                </label>

                <details class="rounded-2xl border bg-gray-50 p-3">
                  <summary class="cursor-pointer text-sm font-semibold text-gray-800">
                    Додатково (службова інформація)
                  </summary>
                  <div class="mt-3 grid gap-2 text-sm">
                    <div class="grid gap-1">
                      <div class="text-xs text-gray-600">imagePath (локальне)</div>
                      <div class="rounded-xl border bg-white px-3 py-2 text-xs text-gray-800">
                        {{ form.imagePath || '—' }}
                      </div>
                    </div>

                    <div class="grid gap-1">
                      <div class="text-xs text-gray-600">imageUrl (Storage)</div>
                      <div class="rounded-xl border bg-white px-3 py-2 text-xs text-gray-800 break-all">
                        {{ form.imageUrl || '—' }}
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-1">
                <span class="text-sm text-gray-700">Назва</span>
                <input v-model="form.name" class="rounded-xl border px-3 py-2" />
              </label>

              <label class="grid gap-1">
                <span class="text-sm text-gray-700">Виробник</span>
                <input v-model="form.manufacturer" class="rounded-xl border px-3 py-2" />
              </label>

              <label class="grid gap-1">
                <span class="text-sm text-gray-700">Одиниці (unit)</span>
                <input v-model="form.unit" class="rounded-xl border px-3 py-2" />
              </label>

              <label class="grid gap-1">
                <span class="text-sm text-gray-700">Ціна</span>
                <input v-model="form.price" type="number" class="rounded-xl border px-3 py-2" />
              </label>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="grid gap-1">
                <span class="text-sm text-gray-700">Категорія</span>
                <select v-model="form.parentCategory" class="rounded-xl border px-3 py-2" v-on:change="onFormParentChanged">
                  <option value="">—</option>
                  <option v-for="p in parents" v-bind:key="p" v-bind:value="p">{{ p }}</option>
                </select>
              </label>

              <label class="grid gap-1">
                <span class="text-sm text-gray-700">Підкатегорія</span>
                <select v-model="form.childCategory" class="rounded-xl border px-3 py-2" v-bind:disabled="!form.parentCategory">
                  <option value="">—</option>
                  <option v-for="c in formChildren" v-bind:key="c" v-bind:value="c">{{ c }}</option>
                </select>
              </label>
            </div>
          </div>

          <!-- TAB: DESC -->
          <div v-else class="grid gap-4">
            <div class="rounded-2xl border p-4">
              <div class="text-sm font-semibold">Опис</div>
              <div class="mt-3 grid gap-3">
                <TextAreaField label="Склад" v-model="form.description.composition" />
                <TextAreaField label="Лікарська форма" v-model="form.description.dosageForm" />
                <TextAreaField label="Фармакотерапевтична група" v-model="form.description.pharmacotherapeuticGroup" />
                <TextAreaField label="Фармакологічні властивості" v-model="form.description.pharmacologicalProperties" />
                <TextAreaField label="Показання" v-model="form.description.indications" />
                <TextAreaField label="Протипоказання" v-model="form.description.contraindications" />
                <TextAreaField label="Спосіб застосування та дози" v-model="form.description.dosageAndAdministration" />
                <TextAreaField label="Термін придатності" v-model="form.description.shelfLife" />
                <TextAreaField label="Умови зберігання" v-model="form.description.storageConditions" />
                <TextAreaField label="Упаковка" v-model="form.description.packaging" />
                <TextAreaField label="Виробник" v-model="form.description.manufacturerInfo" />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t p-5">
          <UiButton v-on:click="closeModal">Скасувати</UiButton>
          <UiButton variant="primary" v-bind:disabled="saving" v-on:click="save">
            Зберегти
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CATEGORIES } from '~/data/categories'
import { useProductsAdmin } from '~/composables/useProductsAdmin'

const { list, createOne, updateOne, removeOne, uploadImageToStorage } = useProductsAdmin()

const loading = ref(false)
const saving = ref(false)
const products = ref<any[]>([])

// Filters (page)
const selectedParent = ref<string>('')
const selectedChild = ref<string>('')

const parents = computed(() => Object.keys(CATEGORIES))
const filterChildren = computed(() => {
  if (!selectedParent.value) return []
  return (CATEGORIES as any)[selectedParent.value] || []
})

const filteredProducts = computed(() => {
  const listArr = Array.isArray(products.value) ? products.value : []
  const p = selectedParent.value
  const c = selectedChild.value
  return listArr.filter((x: any) => {
    if (p && x.parentCategory !== p) return false
    if (c && x.childCategory !== c) return false
    return true
  })
})

function onFilterParentChanged () {
  selectedChild.value = ''
}

// Modal
const modalOpen = ref(false)
const editingId = ref<string>('')
const tab = ref<'main' | 'desc'>('main')

const fileToUpload = ref<File | null>(null)
const previewUrl = ref('')

const emptyForm = () => ({
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

const form = ref<any>(emptyForm())

const formChildren = computed(() => {
  if (!form.value.parentCategory) return []
  return (CATEGORIES as any)[form.value.parentCategory] || []
})

function normalizeLocalImagePath(imagePath: string) {
  const raw = String(imagePath || '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  const rel = raw.includes('/') ? raw.replace(/^\/+/, '') : `images/${raw}`
  return '/' + rel
}

function imageSrc(p: any) {
  if (p?.imageUrl) return String(p.imageUrl)
  if (p?.imagePath) return normalizeLocalImagePath(String(p.imagePath))
  return ''
}

function openCreate () {
  editingId.value = ''
  form.value = emptyForm()
  fileToUpload.value = null
  previewUrl.value = ''
  tab.value = 'main'
  modalOpen.value = true
}

function openEdit (p: any) {
  editingId.value = p.id
  form.value = JSON.parse(JSON.stringify(p))
  fileToUpload.value = null
  previewUrl.value = imageSrc(p)
  tab.value = 'main'
  modalOpen.value = true
}

function closeModal () {
  modalOpen.value = false
  fileToUpload.value = null
}

function onFormParentChanged () {
  form.value.childCategory = ''
}

function onFilePicked (e: any) {
  const f = e?.target?.files?.[0]
  if (!f) return
  fileToUpload.value = f
  previewUrl.value = URL.createObjectURL(f)
}

async function load () {
  loading.value = true
  try {
    products.value = await list()
  } finally {
    loading.value = false
  }
}

async function save () {
  saving.value = true
  try {
    if (fileToUpload.value) {
      const res = await uploadImageToStorage(fileToUpload.value)
      form.value.imageUrl = res.downloadURL
    }

    if (editingId.value) {
      await updateOne(editingId.value, form.value)
    } else {
      await createOne(form.value)
    }

    modalOpen.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function remove (p: any) {
  await removeOne(p.id)
  await load()
}

onMounted(async () => {
  await requireRole('admin')
  await load()
})

const TextAreaField = defineComponent({
  props: {
    label: { type: String, required: true },
    modelValue: { type: String, default: '' }
  },
  emits: ['update:modelValue'],
  setup (props, { emit }) {
    return () => h('label', { class: 'grid gap-1' }, [
      h('span', { class: 'text-sm text-gray-700' }, props.label),
      h('textarea', {
        class: 'min-h-[90px] rounded-xl border px-3 py-2 text-sm leading-6',
        value: props.modelValue,
        onInput: (e: any) => emit('update:modelValue', e?.target?.value ?? '')
      })
    ])
  }
})
</script>
