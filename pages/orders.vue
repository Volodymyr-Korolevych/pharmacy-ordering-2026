<template>
  <div class="rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Мої замовлення</h1>
    <p class="mt-1 text-sm text-gray-600">Статуси клієнту не відображаються.</p>

    <div v-if="loading" class="mt-4 text-sm text-gray-600">Завантаження...</div>

    <div v-else class="mt-4 grid gap-3">
      <button
        v-for="o in orders"
        v-bind:key="o.id"
        type="button"
        class="w-full rounded-2xl border p-4 text-left hover:bg-gray-50"
        v-on:click="toggle(o.id)"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-[220px]">
            <div class="text-sm font-semibold">
              Замовлення {{ shortId(o.id) }}
            </div>
            <div class="mt-1 text-xs text-gray-500">
              {{ formatDate(o.createdAt) }}
            </div>
            <div class="mt-1 text-xs text-gray-500">
              Аптека: <span class="font-semibold text-gray-700">{{ pharmacyLabel(o) }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-sm font-bold">{{ formatPrice(o.total) }}</div>
            <div class="text-xs text-gray-500">
              {{ isOpen(o.id) ? '▲' : '▼' }}
            </div>
          </div>
        </div>

        <!-- DETAILS -->
        <div v-if="isOpen(o.id)" class="mt-4 grid gap-3">
          <div class="rounded-xl border bg-white p-3">
            <div class="text-sm font-semibold">Препарати</div>

            <div v-if="!o.items || o.items.length === 0" class="mt-2 text-sm text-gray-600">
              Немає даних по позиціях.
            </div>

            <div v-else class="mt-3 grid gap-2">
              <div
                v-for="it in o.items"
                v-bind:key="it.productId || it.name"
                class="grid grid-cols-[1fr_auto] gap-3 rounded-xl border p-3"
              >
                <div class="min-w-0">
                  <div class="truncate text-sm font-semibold text-gray-900">
                    {{ it.name }}
                  </div>
                  <div class="mt-1 text-xs text-gray-600">
                    {{ formatPrice(it.price) }} × {{ it.qty }}
                  </div>
                </div>

                <div class="text-sm font-semibold text-gray-900">
                  {{ formatPrice((Number(it.price || 0)) * (Number(it.qty || 0))) }}
                </div>
              </div>

              <div class="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                <div class="flex justify-between">
                  <span>Сума замовлення:</span>
                  <span class="font-semibold">{{ formatPrice(o.total) }}</span>
                </div>
                <div class="mt-1 text-xs text-gray-500">Оплата: при отриманні</div>
                <div class="mt-1 text-xs text-gray-500">Отримання: самовивіз</div>
              </div>
            </div>
          </div>
        </div>
      </button>

      <div v-if="orders.length === 0" class="text-sm text-gray-600">
        Замовлень поки немає.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PHARMACIES } from '~/data/pharmacies'

const { clientUser } = useAuthFacade()
const { listForUser, loading } = useOrders()

const orders = ref<any[]>([])
const openedId = ref<string>('')

function toggle(id: string) {
  openedId.value = openedId.value === id ? '' : id
}
function isOpen(id: string) {
  return openedId.value === id
}

function shortId(id: string) {
  const s = String(id || '')
  return s.length > 6 ? s.slice(-6) : s
}

function formatPrice(v: any) {
  const n = Number(v || 0)
  return `${n.toFixed(2)} грн`
}

function formatDate(ts: any) {
  try {
    return new Date(Number(ts || Date.now())).toLocaleString('uk-UA')
  } catch {
    return ''
  }
}

function pharmacyLabel(o: any) {
  // Підтримуємо новий формат (pharmacyName) і старий (pharmacyCode)
  const name = String(o?.pharmacyName || '').trim()
  if (name) return name

  const code = String(o?.pharmacyCode || '').trim()
  if (!code) return '—'

  const found = PHARMACIES.find(p => p.code === code)
  return found ? found.name : code
}

onMounted(async () => {
  // щоб не ловити 500 SSR — роль перевіряємо тільки на клієнті
  await requireRole('client')

  if (!clientUser.value) return
  orders.value = await listForUser(clientUser.value.uid)
})
</script>
