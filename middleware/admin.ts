export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, fetch, user } = useUserSession()

  if (!loggedIn.value) {
    await fetch()
  }

  if (!loggedIn.value) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath },
    })
  }

  const sessionUser = user.value as { id?: string } | undefined
  if (!sessionUser?.id) {
    return navigateTo('/app')
  }

  try {
    const profile = await $fetch<{ role: string }>(`/api/admin/me`)
    if (profile.role !== 'admin' && profile.role !== 'support') {
      return navigateTo('/app')
    }
  }
  catch {
    return navigateTo('/app')
  }
})
