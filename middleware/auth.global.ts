export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/auth') return

  const { authKind, ensureAuthReady } = useAuthFacade()
  await ensureAuthReady()
  console.log('Auth middleware: redirecting to /auth if needed', authKind.value)
  if (authKind.value === 'none') {
    return navigateTo('/auth')
  }
  
})
