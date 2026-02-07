export function useQuickAdd() {
  const isOpen = useState('quick-add-open', () => false)
  const route = useRoute()
  const router = useRouter()

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
    if (route.query.action === 'quick-add') {
      router.replace({ path: route.path, query: {} })
    }
  }

  watch(() => route.query.action, (action) => {
    if (action === 'quick-add') {
      isOpen.value = true
    } else {
      isOpen.value = false
    }
  }, { immediate: true })

  watch(isOpen, (open) => {
    if (!open && route.query.action === 'quick-add') {
      router.replace({ path: route.path, query: {} })
    }
  })

  return { isOpen, open, close }
}
