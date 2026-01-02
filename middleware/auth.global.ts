export default defineNuxtRouteMiddleware(async (to) => {
  // /auth завжди доступний
  if (to.path === '/auth') return

  const { authKind, ensureAuthReady } = useAuthFacade()
  await ensureAuthReady()

  if (authKind.value === 'none') {
    return navigateTo('/auth')
  }
  
})
