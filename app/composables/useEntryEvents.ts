export function useEntryEvents() {
  const lastCreatedEntry = useState<any>('last-created-entry', () => null)
  const lastCreatedAt = useState<number>('last-created-at', () => 0)

  function notifyEntryCreated(entry: any) {
    lastCreatedEntry.value = entry
    lastCreatedAt.value = Date.now()
  }

  function onEntryCreated(callback: (entry: any) => void) {
    watch([lastCreatedEntry, lastCreatedAt], ([entry, timestamp]) => {
      if (entry && timestamp) {
        callback(entry)
      }
    })
  }

  return {
    notifyEntryCreated,
    onEntryCreated,
    lastCreatedEntry,
    lastCreatedAt,
  }
}
