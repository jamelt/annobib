export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo('/login', {
      query: {
        redirect: to.fullPath,
      },
    })
  }
})
