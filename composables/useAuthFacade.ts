import type { User } from 'firebase/auth'
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth'

type AuthKind = 'none' | 'client' | 'admin' | 'pharmacist'

type AdminSession = { kind: 'admin' }
type PharmacistSession = { kind: 'pharmacist'; pharmacyCode: string }
type Session = AdminSession | PharmacistSession | null

export function useAuthFacade () {
  const { $firebase } = useNuxtApp()
  const clientUser = useState<User | null>('clientUser', () => null)
  const authReady = useState<boolean>('authReady', () => false)

  // cookies for fixed accounts
  const sessionCookie = useCookie<string | null>('fixed_session', { sameSite: 'lax' })

  const fixedSession = computed<Session>(() => {
    if (!sessionCookie.value) return null
    try { return JSON.parse(sessionCookie.value) as Session } catch { return null }
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
    if (process.server) return
    if (authReady.value) return

    // Fixed session may exist even without firebase configured
    if (fixedSession.value) {
      authReady.value = true
      return
    }

    // If firebase not configured, still mark ready so app can show /auth
    if (!$firebase?.auth) {
      authReady.value = true
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

  async function clientLogin (email: string, password: string) {
    const fb = requireFirebase()
    await signInWithEmailAndPassword(fb.auth, email, password)
    // onAuthStateChanged will set clientUser
  }

  async function clientRegister (email: string, password: string) {
    const fb = requireFirebase()
    await createUserWithEmailAndPassword(fb.auth, email, password)
  }

  function fixedLoginAdmin (login: string, password: string): boolean {
    const config = useRuntimeConfig()
    if (login === config.adminLogin && password === config.adminPassword) {
      sessionCookie.value = JSON.stringify({ kind: 'admin' } satisfies AdminSession)
      clientUser.value = null
      return true
    }
    return false
  }

  function fixedLoginPharmacist (login: string, password: string): { ok: boolean; pharmacyCode?: string } {
    const config = useRuntimeConfig()
    const m = /^apotheke(\d{3})$/.exec(login)
    if (!m) return { ok: false }
    // пароль один на всіх провізорів (простий дипломний варіант)
    if (password !== config.pharmacistPassword) return { ok: false }
    const pharmacyCode = `apotheke${m[1]}`
    sessionCookie.value = JSON.stringify({ kind: 'pharmacist', pharmacyCode } satisfies PharmacistSession)
    clientUser.value = null
    return { ok: true, pharmacyCode }
  }

  async function signOutAll () {
    sessionCookie.value = null
    if ($firebase?.auth) {
      try { await signOut($firebase.auth) } catch {}
    }
    clientUser.value = null
  }

  return {
    authKind,
    pharmacyCode,
    clientUser,
    ensureAuthReady,
    clientLogin,
    clientRegister,
    fixedLoginAdmin,
    fixedLoginPharmacist,
    signOutAll
  }
}
