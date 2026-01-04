import type { User } from 'firebase/auth'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth'

export type AuthKind = 'none' | 'client' | 'admin' | 'pharmacist'

export type AdminSession = { kind: 'admin' }
export type PharmacistSession = { kind: 'pharmacist'; pharmacyCode: string }
export type Session = AdminSession | PharmacistSession | null

export function useAuthFacade () {
  const { $firebase } = useNuxtApp()

  const clientUser = useState<User | null>('clientUser', () => null)
  const authReady = useState<boolean>('authReady', () => false)

  // ✅ Зберігаємо cookie як ОБ'ЄКТ, без JSON.stringify/parse
  // ✅ path:'/' — щоб читалась на всіх сторінках
  const fixedSession = useCookie<Session>('fixed_session', {
    default: () => null,
    sameSite: 'lax',
    path: '/'
  })

  const authKind = computed<AuthKind>(() => {
    if (fixedSession.value?.kind === 'admin') return 'admin'
    if (fixedSession.value?.kind === 'pharmacist') return 'pharmacist'
    if (clientUser.value) return 'client'
    return 'none'
  })

  const pharmacyCode = computed<string | null>(() => {
    if (fixedSession.value?.kind === 'pharmacist') return fixedSession.value.pharmacyCode
    return null
  })

  function requireFirebase () {
    if (!$firebase?.auth) {
      throw new Error('Firebase is not configured. Please set NUXT_PUBLIC_FIREBASE_* env vars.')
    }
    return $firebase
  }

  async function ensureAuthReady (): Promise<void> {
    // На сервері Firebase state не потрібен.
    // fixedSession з cookie доступний і на SSR.
    if (process.server) return

    // Якщо є fixedSession — ми вже "готові"
    if (fixedSession.value) {
      authReady.value = true
      return
    }

    // Якщо Firebase не налаштований — теж ready (щоб /auth працював)
    if (!$firebase?.auth) {
      authReady.value = true
      return
    }

    // Якщо вже ready — підстрахуємось currentUser
    if (authReady.value) {
      if (!clientUser.value && $firebase.auth.currentUser) {
        clientUser.value = $firebase.auth.currentUser
      }
      return
    }

    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged($firebase.auth, (u) => {
        clientUser.value = u
        authReady.value = true
        unsub()
        resolve()
      })
    })
  }

  // ✅ Фікс редіректа: виставляємо clientUser одразу
  async function clientLogin (email: string, password: string) {
    const fb = requireFirebase()
    const cred = await signInWithEmailAndPassword(fb.auth, email, password)
    clientUser.value = cred.user
    authReady.value = true
  }

  async function clientRegister (email: string, password: string) {
    const fb = requireFirebase()
    const cred = await createUserWithEmailAndPassword(fb.auth, email, password)
    clientUser.value = cred.user
    authReady.value = true
  }

  function fixedLoginAdmin (login: string, password: string): boolean {
    const config = useRuntimeConfig().public
    if (login === config.adminLogin && password === config.adminPassword) {
      fixedSession.value = { kind: 'admin' }
      clientUser.value = null
      authReady.value = true
      return true
    }
    return false
  }

  function fixedLoginPharmacist (login: string, password: string): { ok: boolean; pharmacyCode?: string } {
    const config = useRuntimeConfig().public
    const m = /^apotheke(\d{3})$/.exec(login)
    if (!m) return { ok: false }
    if (password !== config.pharmacistPassword) return { ok: false }

    const pharmacyCode = `apotheke${m[1]}`
    fixedSession.value = { kind: 'pharmacist', pharmacyCode }
    clientUser.value = null
    authReady.value = true
    return { ok: true, pharmacyCode }
  }

  async function signOutAll () {
    fixedSession.value = null
    if ($firebase?.auth) {
      try { await signOut($firebase.auth) } catch {}
    }
    clientUser.value = null
    authReady.value = true
  }

  return {
    authKind,
    pharmacyCode,
    clientUser,
    fixedSession,
    ensureAuthReady,
    clientLogin,
    clientRegister,
    fixedLoginAdmin,
    fixedLoginPharmacist,
    signOutAll
  }
}
