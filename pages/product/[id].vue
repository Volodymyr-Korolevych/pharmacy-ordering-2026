<template>
  <div v-if="!product" class="rounded-2xl border bg-white p-5 text-sm text-gray-600">
    Товар не знайдено.
  </div>

  <div v-else class="grid gap-6 md:grid-cols-[320px_1fr]">
    <div class="overflow-hidden rounded-2xl border bg-white p-4 shadow-sm">
      <div class="aspect-square overflow-hidden rounded-xl bg-gray-100">
        <img v-if="imgSrc" :src="imgSrc" class="h-full w-full object-cover" alt="" />
      </div>

      <div class="mt-4 text-sm text-gray-500">{{ product.parentCategory }} / {{ product.childCategory }}</div>
      <div class="mt-1 text-sm text-gray-600">{{ product.manufacturer }}</div>
      <div class="mt-2 text-2xl font-bold">{{ priceText }}</div>
      <div class="mt-1 text-sm text-gray-600">{{ product.unit }}</div>

      <UiButton class="mt-4 w-full" variant="primary" @click="add">Додати в кошик</UiButton>
    </div>

    <div class="rounded-2xl border bg-white p-5 shadow-sm">
      <h1 class="text-2xl font-bold">{{ product.name }}</h1>

      <div class="mt-5 grid gap-4">
        <Section title="Склад" :text="product.description?.composition" />
        <Section title="Лікарська форма" :text="product.description?.dosageForm" />
        <Section title="Фармакотерапевтична група" :text="product.description?.pharmacotherapeuticGroup" />
        <Section title="Фармакологічні властивості" :text="product.description?.pharmacologicalProperties" />
        <Section title="Показання" :text="product.description?.indications" />
        <Section title="Протипоказання" :text="product.description?.contraindications" />
        <Section title="Спосіб застосування та дози" :text="product.description?.dosageAndAdministration" />
        <Section title="Термін придатності" :text="product.description?.shelfLife" />
        <Section title="Умови зберігання" :text="product.description?.storageConditions" />
        <Section title="Упаковка" :text="product.description?.packaging" />
        <Section title="Виробник" :text="product.description?.manufacturerInfo" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from '~/stores/cart'

const route = useRoute()
const cart = useCartStore()
const { products, fetchAll } = useProducts() as any

const product = computed(() => products.value.find((p: any) => p.id === String(route.params.id)))

function normalizeLocalImagePath(p: any) {
  const raw = String(p?.imagePath || '').trim().replace(/\\/g, '/')
  if (!raw) return ''
  const rel = raw.includes('/') ? raw.replace(/^\/+/, '') : `images/${raw}`
  return '/' + rel
}

const imgSrc = computed(() => {
  if (!product.value) return ''
  if (product.value.imageUrl) return product.value.imageUrl // Storage
  return normalizeLocalImagePath(product.value)            // /public/images/...
})

const priceText = computed(() => {
  const n = Number(product.value?.price || 0)
  return `${n.toFixed(2)} грн`
})

onMounted(async () => {
  await requireRole('client') // client-only
  if (products.value.length === 0) await fetchAll()
})

function add () {
  if (!product.value?.id) return
  cart.add({
    productId: product.value.id,
    name: product.value.name,
    price: Number(product.value.price || 0),
    imageUrl: imgSrc.value
  }, 1)
  navigateTo('/cart')
}

const Section = defineComponent({
  props: { title: { type: String, required: true }, text: { type: String, default: '' } },
  setup (props) {
    return () => h('div', { class: 'rounded-xl border p-4' }, [
      h('div', { class: 'text-sm font-semibold text-gray-900' }, props.title),
      h('div', { class: 'mt-2 whitespace-pre-line text-sm leading-6 text-gray-700' }, props.text || '—')
    ])
  }
})
</script>
