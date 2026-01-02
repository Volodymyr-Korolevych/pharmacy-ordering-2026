type AuthKind = 'none' | 'client' | 'admin' | 'pharmacist'

function startRouteFor(kind: AuthKind) {
  if (kind === 'admin') return '/admin/products'
  if (kind === 'pharmacist') return '/pharmacist/orders'
  if (kind === 'client') return '/catalog'
  return '/auth'
}

export async function requireRole(expected: Exclude<AuthKind, 'none'>) {
  const { authKind, ensureAuthReady } = useAuthFacade()
  await ensureAuthReady()

  if (authKind.value === expected) return

  // Якщо залогінений не тією роллю — ведемо у "свій" стартовий розділ
  return navigateTo(startRouteFor(authKind.value))
}
