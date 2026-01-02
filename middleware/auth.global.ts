export default defineNuxtRouteMiddleware(async (to) => {
  // /auth завжди доступний
  if (to.path === '/auth') return

  const { authKind, ensureAuthReady } = useAuthFacade()
  await ensureAuthReady()

  // Без входу — забороняємо весь застосунок
  if (authKind.value === 'none') {
    return navigateTo('/auth')
  }
})
