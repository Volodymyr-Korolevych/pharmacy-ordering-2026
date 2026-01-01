import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
  }

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    // Не кидаємо помилку, щоб README-налаштування можна було зробити спокійно
    console.warn('[firebase] Missing firebase config env vars. Set NUXT_PUBLIC_FIREBASE_* in .env')
    return
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)

  return {
    provide: { firebase: { app, auth, db } }
  }
})
