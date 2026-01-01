<template>
  <div class="mx-auto max-w-xl">
    <h1 class="text-2xl font-bold">Вхід / Реєстрація</h1>
    <p class="mt-1 text-sm text-gray-600">
      Доступ до застосунку можливий лише після входу.
    </p>

    <div class="mt-6 grid gap-6">
      <section class="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 class="text-lg font-semibold">Клієнт</h2>
        <div class="mt-3 flex gap-2">
          <button class="rounded-xl border px-3 py-2 text-sm" :class="tab==='login' ? 'bg-gray-50' : 'bg-white'" @click="tab='login'">Вхід</button>
          <button class="rounded-xl border px-3 py-2 text-sm" :class="tab==='register' ? 'bg-gray-50' : 'bg-white'" @click="tab='register'">Реєстрація</button>
        </div>

        <form class="mt-4 grid gap-3" @submit.prevent="onClientSubmit">
          <label class="grid gap-1">
            <span class="text-sm text-gray-700">Email</span>
            <input v-model.trim="clientEmail" type="email" required class="rounded-xl border px-3 py-2" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm text-gray-700">Пароль</span>
            <input v-model.trim="clientPassword" type="password" required minlength="6" class="rounded-xl border px-3 py-2" />
          </label>

          <AlertBox :text="clientMsg" :kind="clientMsgKind" />

          <UiButton type="submit" variant="primary">
            {{ tab === 'login' ? 'Увійти' : 'Зареєструватися' }}
          </UiButton>

          <p class="text-xs text-gray-500">
            * Для клієнта використовується Firebase Auth (Email/Password).
          </p>
        </form>
      </section>

      <section class="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 class="text-lg font-semibold">Адмін / Провізор</h2>
        <p class="mt-1 text-sm text-gray-600">
          Фіксовані логіни (через .env). Реєстрації немає.
        </p>

        <form class="mt-4 grid gap-3" @submit.prevent="onFixedSubmit">
          <label class="grid gap-1">
            <span class="text-sm text-gray-700">Логін</span>
            <input v-model.trim="fixedLogin" type="text" required class="rounded-xl border px-3 py-2" placeholder="admin або apotheke005" />
          </label>
          <label class="grid gap-1">
            <span class="text-sm text-gray-700">Пароль</span>
            <input v-model.trim="fixedPassword" type="password" required class="rounded-xl border px-3 py-2" />
          </label>

          <AlertBox :text="fixedMsg" :kind="fixedMsgKind" />

          <UiButton type="submit" variant="primary">Увійти</UiButton>

          <p class="text-xs text-gray-500">
            Провізор: логін <code>apotheke001</code> … <code>apotheke010</code>. Пароль спільний: <code>PHARMACIST_PASSWORD</code>.
          </p>
        </form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const { authKind, ensureAuthReady, clientLogin, clientRegister, fixedLoginAdmin, fixedLoginPharmacist } = useAuthFacade()

const tab = ref<'login'|'register'>('login')
const clientEmail = ref('')
const clientPassword = ref('')
const clientMsg = ref('')
const clientMsgKind = ref<'info'|'error'|'success'>('info')

const fixedLogin = ref('')
const fixedPassword = ref('')
const fixedMsg = ref('')
const fixedMsgKind = ref<'info'|'error'|'success'>('info')

onMounted(async () => {
  await ensureAuthReady()
  if (authKind.value !== 'none') {
    await navigateTo(startRouteFor(authKind.value))
  }
})

function startRouteFor(kind: string) {
  if (kind === 'admin') return '/admin/products'
  if (kind === 'pharmacist') return '/pharmacist/orders'
  return '/catalog'
}

async function onClientSubmit () {
  clientMsg.value = ''
  try {
    if (tab.value === 'login') {
      await clientLogin(clientEmail.value, clientPassword.value)
    } else {
      await clientRegister(clientEmail.value, clientPassword.value)
    }
    clientMsgKind.value = 'success'
    clientMsg.value = 'Успішно!'
    await navigateTo('/catalog')
  } catch (e: any) {
    clientMsgKind.value = 'error'
    clientMsg.value = e?.message || 'Помилка входу/реєстрації'
  }
}

async function onFixedSubmit () {
  fixedMsg.value = ''
  // admin
  if (fixedLoginAdmin(fixedLogin.value, fixedPassword.value)) {
    fixedMsgKind.value = 'success'
    fixedMsg.value = 'Успішний вхід (адмін).'
    await navigateTo('/admin/products')
    return
  }
  // pharmacist
  const r = fixedLoginPharmacist(fixedLogin.value, fixedPassword.value)
  if (r.ok) {
    fixedMsgKind.value = 'success'
    fixedMsg.value = `Успішний вхід (провізор ${r.pharmacyCode}).`
    await navigateTo('/pharmacist/orders')
    return
  }

  fixedMsgKind.value = 'error'
  fixedMsg.value = 'Невірний логін або пароль.'
}
</script>
