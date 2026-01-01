export default defineNuxtRouteMiddleware(async () => {
  const { authKind, ensureAuthReady } = useAuthFacade()
  await ensureAuthReady()

  if (authKind.value === 'admin') return

  if (authKind.value === 'pharmacist') return navigateTo('/pharmacist/orders')
  if (authKind.value === 'client') return navigateTo('/catalog')
  return navigateTo('/auth')
})
