<template>
  <div class="rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Мої замовлення</h1>

    <div v-if="loading" class="mt-4 text-sm text-gray-600">
      Завантаження...
    </div>

    <div v-else class="mt-4 grid gap-3">
      <button
        v-for="o in orders"
        v-bind:key="o.id"
        type="button"
        class="w-full rounded-2xl border p-4 text-left hover:bg-gray-50"
        v-on:click="toggle(o.id)"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="min-w-[240px]">
            <div class="text-sm font-semibold">
              Замовлення № {{ orderNumber(o) }}
            </div>
            <div class="mt-1 text-xs text-gray-500">
              {{ formatDate(o.createdAt) }}
            </div>
            <div class="mt-1 text-xs text-gray-500">
              Аптека:
              <span class="font-semibold text-gray-700">
                {{ pharmacyLabel(o) }}
              </span>
            </div>
            <div class="mt-1 text-xs">
              Статус:
              <span
                class="font-semibold"
                v-bind:class="statusClass(o.status)"
              >
                {{ statusLabel(o.status) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <div class="text-sm font-bold">
              {{ formatPrice(o.total) }}
            </div>
            <div class="text-xs text-gray-500">
              {{ isOpen(o.id) ? '▲' : '▼' }}
            </div>
          </div>
        </div>

        <!-- DETAILS -->
        <div v-if="isOpen(o.id)" class="mt-4 grid gap-3">
          <div class="rounded-xl border p-3">
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
                  {{ formatPrice(Number(it.price) * Number(it.qty)) }}
                </div>
              </div>

              <div class="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                <div class="flex justify-between">
                  <span>Сума замовлення:</span>
                  <span class="font-semibold">
                    {{ formatPrice(o.total) }}
                  </span>
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  Оплата: при отриманні
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  Отримання: самовивіз
                </div>
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
  if (o?.pharmacyName) return o.pharmacyName
  const found = PHARMACIES.find(p => p.code === o?.pharmacyCode)
  return found ? found.name : '—'
}

function statusLabel(status: string) {
  switch (status) {
    case 'new': return 'Нове'
    case 'issued': return 'Видане'
    case 'cancelled': return 'Скасоване'
    default: return '—'
  }
}

function statusClass(status: string) {
  if (status === 'new') return 'text-blue-700'
  if (status === 'issued') return 'text-emerald-700'
  if (status === 'cancelled') return 'text-red-700'
  return 'text-gray-600'
}

function orderNumber(o: any) {
  const ts = Number(o?.createdAt || 0)
  if (!ts) return '—'
  const a = String(ts).slice(-10)
  return a.slice(0, 6) + '-' + a.slice(6, 10)
}

onMounted(async () => {
  await requireRole('client')
  if (!clientUser.value) return
  orders.value = await listForUser(clientUser.value.uid)
})
</script>
