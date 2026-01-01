export default defineNuxtRouteMiddleware(async () => {
  const { authKind, ensureAuthReady } = useAuthFacade()
  await ensureAuthReady()

  if (authKind.value === 'client') return

  if (authKind.value === 'admin') return navigateTo('/admin/products')
  if (authKind.value === 'pharmacist') return navigateTo('/pharmacist/orders')
  return navigateTo('/auth')
})
