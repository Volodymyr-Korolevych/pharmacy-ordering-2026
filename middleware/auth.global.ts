export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/auth') return

  const { authKind, ensureAuthReady } = useAuthFacade()
  await ensureAuthReady()

  if (authKind.value === 'none') {
    return navigateTo('/auth')
  }
})
