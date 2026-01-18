type AuthAction = 'login' | 'register'

function asCode(err: any): string {
  return String(err?.code || err?.errorCode || '').trim()
}

export function isEmailLike(v: string): boolean {
  const s = String(v || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export function uaAuthError(err: any, action: AuthAction): string {
  const code = asCode(err)

  // Firebase Auth common codes
  switch (code) {
    // email / password
    case 'auth/invalid-email':
      return 'Некоректний email. Перевірте адресу та спробуйте ще раз.'
    case 'auth/missing-email':
      return 'Вкажіть email.'
    case 'auth/missing-password':
      return 'Вкажіть пароль.'
    case 'auth/weak-password':
      return 'Занадто слабкий пароль. Використайте щонайменше 6 символів.'
    case 'auth/email-already-in-use':
      return 'Такий email уже зареєстрований. Спробуйте увійти або використайте інший email.'
    case 'auth/user-not-found':
      return action === 'login'
        ? 'Користувача з таким email не знайдено. Перевірте адресу або зареєструйтесь.'
        : 'Користувача не знайдено.'
    case 'auth/wrong-password':
    case 'auth/invalid-password':
    case 'auth/invalid-credential':
      return 'Невірний email або пароль.'
    case 'auth/user-disabled':
      return 'Цей акаунт вимкнено. Зверніться до адміністратора.'
    case 'auth/too-many-requests':
      return 'Забагато спроб. Спробуйте пізніше.'
    case 'auth/network-request-failed':
      return 'Проблема з мережею. Перевірте інтернет-з’єднання та спробуйте ще раз.'
    case 'auth/operation-not-allowed':
      return action === 'register'
        ? 'Реєстрацію вимкнено в налаштуваннях Firebase. Увімкніть Email/Password у Authentication.'
        : 'Цю дію заборонено налаштуваннями Firebase.'
    default:
      break
  }

  // Fallback: якщо Firebase не дав код, але є message
  const msg = String(err?.message || '').trim()
  if (msg) return msg

  return action === 'login'
    ? 'Не вдалося увійти. Перевірте дані та спробуйте ще раз.'
    : 'Не вдалося зареєструватися. Спробуйте ще раз.'
}
