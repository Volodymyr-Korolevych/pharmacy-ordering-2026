import type { AuthKind } from '~/composables/useAuthFacade'

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

  // Якщо залогінений не тією роллю — ведемо у "свій" розділ
  return navigateTo(startRouteFor(authKind.value))
}
