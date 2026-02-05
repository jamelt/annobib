export function useAuth() {
  const { loggedIn, user, session, clear } = useUserSession()

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    await navigateTo('/login')
  }

  return {
    loggedIn,
    user,
    session,
    logout,
  }
}
