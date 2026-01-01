<template>
  <div class="min-h-[calc(100vh-120px)] grid place-items-center">
    <div class="w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm">
      <div class="mb-6">
        <div class="text-xl font-bold">
          {{ mode === 'login' ? 'Вхід у застосунок' : 'Реєстрація' }}
        </div>
        <div class="mt-1 text-sm text-gray-600">
          {{ mode === 'login'
            ? 'Увійдіть, щоб зробити онлайн-замовлення ліків.'
            : 'Створіть акаунт, щоб зробити перше замовлення.' }}
        </div>
      </div>

      <form v-if="mode === 'login'" class="grid gap-4" @submit.prevent="onLogin">
        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Email / Логін</span>
          <input
            v-model.trim="login"
            type="text"
            autocomplete="username"
            required
            class="rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="name@email.com або apotheke005"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Пароль</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="••••••••"
          />
        </label>

        <AlertBox :text="msg" :kind="msgKind" />

        <UiButton type="submit" variant="primary" :disabled="submitting" class="w-full">
          Увійти
        </UiButton>

        <p class="text-center text-sm text-gray-600">
          Ще немає акаунта?
          <button type="button" class="font-semibold text-emerald-700 hover:underline" @click="openRegister">
            Зареєструйтесь зараз
          </button>
        </p>
      </form>

      <form v-else class="grid gap-4" @submit.prevent="onRegister">
        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Email</span>
          <input
            v-model.trim="regEmail"
            type="email"
            autocomplete="email"
            required
            class="rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="name@email.com"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Пароль</span>
          <input
            v-model="regPassword"
            type="password"
            autocomplete="new-password"
            minlength="6"
            required
            class="rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="мінімум 6 символів"
          />
        </label>

        <AlertBox :text="msg" :kind="msgKind" />

        <UiButton type="submit" variant="primary" :disabled="submitting" class="w-full">
          Зареєструватися
        </UiButton>

        <p class="text-center text-sm text-gray-600">
          Вже маєте акаунт?
          <button type="button" class="font-semibold text-emerald-700 hover:underline" @click="openLogin">
            Увійдіть
          </button>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const {
  authKind,
  ensureAuthReady,
  clientLogin,
  clientRegister,
  fixedLoginAdmin,
  fixedLoginPharmacist
} = useAuthFacade()

const mode = ref<'login' | 'register'>('login')

const login = ref('')
const password = ref('')

const regEmail = ref('')
const regPassword = ref('')

const submitting = ref(false)
const msg = ref('')
const msgKind = ref<'info' | 'error' | 'success'>('info')

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

function resetMsg() {
  msg.value = ''
  msgKind.value = 'info'
}

function openRegister() {
  resetMsg()
  mode.value = 'register'
  regEmail.value = ''
  regPassword.value = ''
}

function openLogin() {
  resetMsg()
  mode.value = 'login'
  login.value = ''
  password.value = ''
}

async function onLogin() {
  resetMsg()
  submitting.value = true
  try {
    // 1) Admin (fixed)
    if (fixedLoginAdmin(login.value, password.value)) {
      msgKind.value = 'success'
      msg.value = 'Успішний вхід.'
      await navigateTo('/admin/products')
      return
    }

    // 2) Pharmacist (fixed apotheke001..010)
    const pr = fixedLoginPharmacist(login.value, password.value)
    if (pr.ok) {
      msgKind.value = 'success'
      msg.value = 'Успішний вхід.'
      await navigateTo('/pharmacist/orders')
      return
    }

    // 3) Client (Firebase email/password)
    await clientLogin(login.value, password.value)
    msgKind.value = 'success'
    msg.value = 'Успішний вхід.'
    await navigateTo('/catalog')
  } catch (e: any) {
    msgKind.value = 'error'
    msg.value = e?.message || 'Не вдалося увійти. Перевірте дані.'
  } finally {
    submitting.value = false
  }
}

async function onRegister() {
  resetMsg()
  submitting.value = true
  try {
    await clientRegister(regEmail.value, regPassword.value)
    msgKind.value = 'success'
    msg.value = 'Акаунт створено. Успішний вхід.'
    await navigateTo('/catalog')
  } catch (e: any) {
    msgKind.value = 'error'
    msg.value = e?.message || 'Не вдалося зареєструватися.'
  } finally {
    submitting.value = false
  }
}
</script>
