<template>
  <div class="mx-auto max-w-2xl rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Оформлення замовлення</h1>
    <p class="mt-1 text-sm text-gray-600">Самовивіз. Оплата при отриманні.</p>

    <AlertBox class="mt-4" :text="msg" :kind="msgKind" />

    <div class="mt-4 grid gap-3">
      <label class="grid gap-1">
        <span class="text-sm text-gray-700">Оберіть аптеку</span>
        <select v-model="pharmacyCode" class="rounded-xl border px-3 py-2">
          <option value="">— Оберіть —</option>
          <option v-for="p in PHARMACIES" :key="p.code" :value="p.code">
            {{ p.code }} — {{ p.name }}, {{ p.address }}
          </option>
        </select>
      </label>

      <div class="rounded-xl border bg-gray-50 p-3 text-sm text-gray-700">
        <div class="flex justify-between">
          <span>Сума:</span>
          <span class="font-semibold">{{ cart.total.toFixed(2) }} грн</span>
        </div>
        <div class="mt-1 text-xs text-gray-500">Оплата: при отриманні</div>
      </div>

      <UiButton variant="primary" :disabled="submitting" @click="submit">
        Підтвердити замовлення
      </UiButton>

      <UiButton v-if="createdOrderId" @click="goOrders">Перейти в історію замовлень</UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PHARMACIES } from '~/data/pharmacies'
import { useCartStore } from '~/stores/cart'
definePageMeta({ middleware: ['client'] })

const cart = useCartStore()
const { clientUser } = useAuthFacade()
const { create } = useOrders()

const pharmacyCode = ref('')
const submitting = ref(false)
const msg = ref('')
const msgKind = ref<'info'|'error'|'success'>('info')
const createdOrderId = ref<string>('')

onMounted(() => {
  if (cart.items.length === 0) navigateTo('/cart')
})

async function submit () {
  msg.value = ''
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
    const id = await create({
      userId: clientUser.value.uid,
      pharmacyCode: pharmacyCode.value,
      items: cart.items.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
      total: cart.total,
      status: 'new',
      createdAt: Date.now()
    })
    createdOrderId.value = id
    cart.clear()
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
