export function useQuickAdd() {
  const isOpen = useState('quick-add-open', () => false)
  const route = useRoute()
  const router = useRouter()

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  watch(() => route.query.action, (action) => {
    isOpen.value = action === 'quick-add'
  }, { immediate: true })

  watch(isOpen, (open) => {
    if (!open && route.query.action === 'quick-add') {
      router.replace({ path: route.path, query: {} })
    }
  })

  return { isOpen, open, close }
}
