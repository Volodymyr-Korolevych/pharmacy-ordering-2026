<template>
  <div class="min-h-[calc(100vh-120px)] grid place-items-center">
    <div class="w-full max-w-md rounded-3xl border bg-white p-6 shadow-sm">
      <div class="mb-4">
        <div class="text-xl font-bold">
          {{ mode === 'login' ? 'Вхід у застосунок' : 'Реєстрація' }}
        </div>
        <div class="mt-1 text-sm text-gray-600">
          {{
            mode === 'login'
              ? 'Увійдіть, щоб зробити онлайн-замовлення ліків.'
              : 'Створіть акаунт, щоб зробити перше замовлення.'
          }}
        </div>
      </div>

      <!-- ВАЖЛИВО: повідомлення ПЕРЕД полями, щоб не перекривалось браузерними підказками -->
      <div class="mb-4">
        <AlertBox :text="msg" :kind="msgKind" />
      </div>

      <!-- Перемикач режимів -->
      <div class="mb-5 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-2xl px-4 py-2 text-sm font-semibold"
          :class="mode === 'login' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'"
          @click="openLogin"
        >
          Вхід
        </button>
        <button
          type="button"
          class="flex-1 rounded-2xl px-4 py-2 text-sm font-semibold"
          :class="mode === 'register' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'"
          @click="openRegister"
        >
          Реєстрація
        </button>
      </div>

      <!-- LOGIN -->
      <form
        v-if="mode === 'login'"
        class="grid gap-4"
        novalidate
        @submit.prevent="onLogin"
      >
        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Email або логін</span>
          <input
            v-model="login"
            type="text"
            autocomplete="username"
            class="rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="name@email.com або apotheke005"
            @input="resetMsg"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Пароль</span>
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="••••••••"
            @input="resetMsg"
          />
        </label>

        <UiButton type="submit" variant="primary" :disabled="submitting" class="w-full">
          Увійти
        </UiButton>

        <div class="text-center text-sm text-gray-600">
          Ще немає акаунта?
          <button type="button" class="font-semibold text-emerald-700 hover:underline" @click="openRegister">
            Зареєструйтесь зараз
          </button>
        </div>
      </form>

      <!-- REGISTER -->
      <form
        v-else
        class="grid gap-4"
        novalidate
        @submit.prevent="onRegister"
      >
        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Email</span>
          <input
            v-model="regEmail"
            type="email"
            inputmode="email"
            autocomplete="email"
            class="rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="name@email.com"
            @input="resetMsg"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Пароль</span>
          <input
            v-model="regPassword"
            type="password"
            autocomplete="new-password"
            class="rounded-2xl border px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="••••••••"
            @input="resetMsg"
          />
        </label>

        <UiButton type="submit" variant="primary" :disabled="submitting" class="w-full">
          Зареєструватися
        </UiButton>

        <div class="text-center text-sm text-gray-600">
          Вже є акаунт?
          <button type="button" class="font-semibold text-emerald-700 hover:underline" @click="openLogin">
            Увійти
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { uaAuthError, isEmailLike } from '~/utils/authUaErrors'

const {
  authKind,
  ensureAuthReady,
  clientLogin,
  clientRegister,
  fixedLoginAdmin,
  fixedLoginPharmacist
} = useAuthFacade()

const runtime = useRuntimeConfig()

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

function setError(text: string) {
  msgKind.value = 'error'
  msg.value = text
}

function clearAllFields() {
  login.value = ''
  password.value = ''
  regEmail.value = ''
  regPassword.value = ''
}

function openRegister() {
  resetMsg()
  mode.value = 'register'
  clearAllFields()
}

function openLogin() {
  resetMsg()
  mode.value = 'login'
  clearAllFields()
}

function looksLikePharmacistLogin(v: string) {
  return /^apotheke\d{3}$/i.test(String(v || '').trim())
}

async function onLogin() {
  resetMsg()
  submitting.value = true
  try {
    const l = String(login.value || '').trim()
    const p = String(password.value || '').trim()

    if (!l) {
      setError('Вкажіть email або логін.')
      return
    }
    if (!p) {
      setError('Вкажіть пароль.')
      return
    }

    // 1) Admin (fixed)
    if (l === runtime.public.adminLogin) {
      const ok = fixedLoginAdmin(l, p)
      if (!ok) {
        setError('Невірний пароль адміністратора.')
        return
      }
      msgKind.value = 'success'
      msg.value = 'Успішний вхід.'
      await navigateTo('/admin/products')
      return
    }

    // 2) Pharmacist (fixed apotheke001..010)
    if (looksLikePharmacistLogin(l)) {
      const pr = fixedLoginPharmacist(l, p)
      if (!pr.ok) {
        setError('Невірний пароль провізора.')
        return
      }
      msgKind.value = 'success'
      msg.value = 'Успішний вхід.'
      await navigateTo('/pharmacist/orders')
      return
    }

    // 3) Client login via Firebase
    if (!isEmailLike(l)) {
      setError('Для входу клієнта введіть email (наприклад name@email.com).')
      return
    }

    await clientLogin(l, p)
    msgKind.value = 'success'
    msg.value = 'Успішний вхід.'
    await navigateTo('/catalog')
  } catch (e: any) {
    setError(uaAuthError(e, 'login'))
  } finally {
    submitting.value = false
  }
}

async function onRegister() {
  resetMsg()
  submitting.value = true
  try {
    const email = String(regEmail.value || '').trim()
    const pass = String(regPassword.value || '').trim()

    if (!email) {
      setError('Вкажіть email.')
      return
    }
    if (!isEmailLike(email)) {
      setError('Некоректний email. Перевірте адресу та спробуйте ще раз.')
      return
    }
    if (!pass) {
      setError('Вкажіть пароль.')
      return
    }
    if (pass.length < 6) {
      setError('Пароль має містити щонайменше 6 символів.')
      return
    }

    await clientRegister(email, pass)
    msgKind.value = 'success'
    msg.value = 'Акаунт створено. Успішний вхід.'
    await navigateTo('/catalog')
  } catch (e: any) {
    setError(uaAuthError(e, 'register'))
  } finally {
    submitting.value = false
  }
}
</script>
