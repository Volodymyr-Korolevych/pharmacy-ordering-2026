<template>
  <div class="mx-auto max-w-3xl rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Оформлення замовлення</h1>
    <p class="mt-1 text-sm text-gray-600">Самовивіз. Оплата при отриманні.</p>

    <div class="mt-5 rounded-2xl border p-4">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold">Товари у замовленні</div>
        <div class="text-xs text-gray-500">
          {{ displayItems.length }} позицій
        </div>
      </div>

      <div v-if="displayItems.length === 0" class="mt-3 text-sm text-gray-600">
        Кошик порожній.
      </div>

      <div v-else class="mt-3 grid gap-2">
        <div
          v-for="it in displayItems"
          v-bind:key="it.productId"
          class="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm"
        >
          <div class="min-w-0">
            <div class="truncate font-semibold text-gray-900">
              {{ it.name }}
            </div>
            <div class="mt-1 text-xs text-gray-600">
              {{ Number(it.price || 0).toFixed(2) }} грн × {{ it.qty }}
            </div>
          </div>

          <div class="shrink-0 font-semibold">
            {{ (Number(it.price || 0) * Number(it.qty || 0)).toFixed(2) }} грн
          </div>
        </div>

        <div class="rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
          <div class="flex justify-between">
            <span>Сума замовлення:</span>
            <span class="font-semibold">{{ Number(displayTotal || 0).toFixed(2) }} грн</span>
          </div>
          <div class="mt-1 text-xs text-gray-500">Оплата: при отриманні</div>
          <div class="mt-1 text-xs text-gray-500">Отримання: самовивіз</div>
        </div>
      </div>
    </div>

    <div class="mt-5 grid gap-3">
      <label class="grid gap-1">
        <span class="text-sm text-gray-700">Оберіть аптеку</span>
        <select
          v-model="pharmacyCode"
          class="rounded-xl border px-3 py-2"
          v-bind:disabled="state === 'done'"
          v-on:change="resetMsg"
        >
          <option value="">— Оберіть —</option>
          <option
            v-for="p in PHARMACIES"
            v-bind:key="p.code"
            v-bind:value="p.code"
          >
            {{ p.name }}
          </option>
        </select>
      </label>

    

      <UiButton
        v-if="state === 'form'"
        class="w-full"
        variant="primary"
        v-bind:disabled="submitting || displayItems.length === 0"
        v-on:click="submit"
      >
        Підтвердити замовлення
      </UiButton>

      <AlertBox
        v-else
        class="mt-4"
        v-bind:text="msg || 'Замовлення прийняте'"
        v-bind:kind="msgKind"
      />

      <UiButton
        v-if="state === 'done'"
        class="w-full"
        v-bind:disabled="!createdOrderId"
        v-on:click="goOrders"
      >
        Перейти в історію замовлень
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PHARMACIES } from '~/data/pharmacies'
import { useCartStore } from '~/stores/cart'

const cart = useCartStore()
const { clientUser } = useAuthFacade()
const { create } = useOrders()

const pharmacyCode = ref('')
const submitting = ref(false)

const msg = ref('')
const msgKind = ref<'info'|'error'|'success'>('info')

const createdOrderId = ref<string>('')

const state = ref<'form'|'done'>('form')

const submittedItems = ref<Array<{ productId: string; name: string; price: number; qty: number }>>([])

const displayItems = computed(() => {
  return state.value === 'done' ? submittedItems.value : cart.items
})

// FIX: total is calculated from items (no dependency on cart.totalPrice)
const displayTotal = computed(() => {
  const items = displayItems.value || []
  return items.reduce((sum: number, it: any) => {
    return sum + (Number(it?.price || 0) * Number(it?.qty || 0))
  }, 0)
})

onMounted(async () => {
  await requireRole('client')

  if (cart.items.length === 0) {
    navigateTo('/cart')
    return
  }
})

function resetMsg () {
  msg.value = ''
  msgKind.value = 'info'
}

async function submit () {
  msg.value = ''
  msgKind.value = 'info'

  if (displayItems.value.length === 0) {
    msgKind.value = 'error'
    msg.value = 'Кошик порожній.'
    return
  }

  if (!pharmacyCode.value) {
    msgKind.value = 'error'
    msg.value = 'Оберіть аптеку.'
    return
  }

  if (!clientUser.value) {
    msgKind.value = 'error'
    msg.value = 'Сесія закінчилась. Увійдіть ще раз.'
    return
  }

  submitting.value = true
  try {
    // snapshot before clearing cart
    submittedItems.value = displayItems.value.map(i => ({
      productId: i.productId,
      name: i.name,
      price: Number(i.price || 0),
      qty: Number(i.qty || 0)
    }))

    const id = await create({
      userId: clientUser.value.uid,
      pharmacyCode: pharmacyCode.value,
      items: submittedItems.value,
      total: Number(displayTotal.value || 0),
      status: 'new',
      createdAt: Date.now()
    })

    createdOrderId.value = id
    cart.clear()

    state.value = 'done'
    msgKind.value = 'success'
    msg.value = 'Замовлення прийняте.'
  } catch (e: any) {
    msgKind.value = 'error'
    msg.value = e?.message || 'Не вдалося створити замовлення.'
  } finally {
    submitting.value = false
  }
}

function goOrders () {
  navigateTo('/orders')
}
</script>
