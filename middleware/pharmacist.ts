export default defineNuxtRouteMiddleware(async () => {
  const { authKind, ensureAuthReady } = useAuthFacade()
  await ensureAuthReady()

  if (authKind.value === 'pharmacist') return

  if (authKind.value === 'admin') return navigateTo('/admin/products')
  if (authKind.value === 'client') return navigateTo('/catalog')
  return navigateTo('/auth')
})
