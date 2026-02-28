<template>
  <div class="mx-auto max-w-md">
    <div class="rounded-3xl border bg-white p-6 shadow-sm">
      <div class="text-lg font-bold">Вхід у застосунок</div>
      <div class="mt-1 text-sm text-gray-600">
        Увійдіть або створіть акаунт клієнта.
      </div>

      <!-- Error ABOVE inputs (won't be covered by browser email suggestions) -->
      <div
        v-if="errorMessage"
        class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        role="status"
        aria-live="polite"
      >
        <div class="font-semibold">Помилка</div>
        <div class="mt-1 leading-6">{{ errorMessage }}</div>
      </div>

      <!-- Mode switch -->
      <div class="mt-5 flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-2xl px-4 py-2 text-sm font-semibold"
          v-bind:class="mode === 'login' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'"
          v-on:click="setMode('login')"
        >
          Вхід
        </button>
        <button
          type="button"
          class="flex-1 rounded-2xl px-4 py-2 text-sm font-semibold"
          v-bind:class="mode === 'register' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'"
          v-on:click="setMode('register')"
        >
          Реєстрація
        </button>
      </div>

      <!-- novalidate: so browser won't block submit for invalid email -->
      <form class="mt-5 grid gap-4" novalidate v-on:submit.prevent="submit">
        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Email</span>
          <input
            v-model="email"
            type="email"
            inputmode="email"
            autocomplete="email"
            class="rounded-2xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="name@example.com"
            v-on:input="clearError"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-gray-700">Пароль</span>
          <input
            v-model="password"
            type="password"
            v-bind:autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
            class="rounded-2xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••"
            v-on:input="clearError"
          />
        </label>

        <label v-if="mode === 'register'" class="grid gap-1">
          <span class="text-sm text-gray-700">Повторіть пароль</span>
          <input
            v-model="password2"
            type="password"
            autocomplete="new-password"
            class="rounded-2xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="••••••••"
            v-on:input="clearError"
          />
        </label>

        <button
          type="submit"
          class="mt-1 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          v-bind:disabled="busy"
        >
          {{ mode === 'login' ? 'Увійти' : 'Зареєструватися' }}
        </button>

        <div class="text-center text-sm text-gray-600">
          <template v-if="mode === 'login'">
            Ще немає акаунта?
            <button type="button" class="font-semibold text-emerald-700 hover:underline" v-on:click="setMode('register')">
              Зареєструйтесь зараз
            </button>
          </template>
          <template v-else>
            Вже є акаунт?
            <button type="button" class="font-semibold text-emerald-700 hover:underline" v-on:click="setMode('login')">
              Увійти
            </button>
          </template>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const { loginClient, registerClient, loginFixed, signOutAll } = useAuthFacade()
const route = useRoute()

const mode = ref<'login' | 'register'>('login')

const email = ref('')
const password = ref('')
const password2 = ref('')

const busy = ref(false)
const errorMessage = ref('')

function clearError () {
  if (errorMessage.value) errorMessage.value = ''
}

function setMode (m: 'login' | 'register') {
  mode.value = m
  errorMessage.value = ''
  // очищаємо поля (як ти просила)
  email.value = ''
  password.value = ''
  password2.value = ''
}

function isValidEmail(e: string) {
  // простий і достатній для навчального проєкту валідатор
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

function validate () {
  const e = email.value.trim()
  const p = password.value

  if (!e) return 'Введіть email.'
  if (!isValidEmail(e)) return 'Невірний формат email.'
  if (!p) return 'Введіть пароль.'

  if (mode.value === 'register') {
    if (p.length < 6) return 'Пароль має містити щонайменше 6 символів.'
    if (p !== password2.value) return 'Паролі не співпадають.'
  }
  return ''
}

async function submit () {
  errorMessage.value = ''
  const v = validate()
  if (v) {
    errorMessage.value = v
    return
  }

  busy.value = true
  try {
    const kind = typeof route.query.kind === 'string' ? route.query.kind : ''

    if (kind === 'admin' || kind === 'pharmacist') {
      await loginFixed(kind, email.value.trim(), password.value)
      return
    }

    if (mode.value === 'login') {
      await loginClient(email.value.trim(), password.value)
    } else {
      await registerClient(email.value.trim(), password.value)
    }
  } catch (e: any) {
    errorMessage.value = e?.message || 'Не вдалося виконати дію. Спробуйте ще раз.'
  } finally {
    busy.value = false
  }
}
</script>
