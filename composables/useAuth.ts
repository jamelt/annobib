export function useAuth() {
  const { loggedIn, user, session, clear } = useUserSession()

  const logout = async () => {
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
