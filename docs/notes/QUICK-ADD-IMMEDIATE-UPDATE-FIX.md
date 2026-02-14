# Quick Add Immediate Update Fix

## Problem

When users add entries using the Quick Add modal from the library page, the new entries don't appear immediately. Users have to manually refresh the page to see the newly added entries.

## Root Cause

The `QuickAddModal` component is defined at the layout level (`layouts/app.vue`) and emits a `created` event when an entry is successfully added. However, the library page (`pages/app/library/index.vue`) doesn't listen to this event, so it doesn't know to refresh its data when entries are created via Quick Add.

## Solution

### 1. Created Entry Events Composable (`composables/useEntryEvents.ts`)

Created a new composable to handle global entry creation events:

```typescript
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
```

This composable uses Nuxt's `useState` to create reactive global state that persists across components and can be watched for changes.

### 2. Updated App Layout (`layouts/app.vue`)

Modified the layout to:

- Import the `useEntryEvents` composable
- Listen to the Quick Add modal's `created` event
- Call `notifyEntryCreated` when entries are created

```vue
<script setup lang="ts">
const { notifyEntryCreated } = useEntryEvents()
// ...
</script>

<template>
  <AppQuickAddModal v-model:open="isQuickAddOpen" @created="notifyEntryCreated" />
</template>
```

### 3. Updated Library Page (`pages/app/library/index.vue`)

Modified the library page to:

- Import the `useEntryEvents` composable
- Listen for entry creation events
- Refresh the entries list when events occur

```typescript
const { onEntryCreated } = useEntryEvents()
onEntryCreated(() => {
  refresh()
})
```

## Benefits

1. **Immediate Feedback**: Users see new entries instantly without manual refresh
2. **Better UX**: Follows the principle of immediate UI updates
3. **Extensible**: Other pages can easily listen to entry creation events using the same composable
4. **Clean Architecture**: Uses Nuxt's built-in state management without external dependencies

## Testing

Created E2E tests in `tests/e2e/library-quick-add-immediate-update.spec.ts` to verify:

1. Entries added via Quick Add appear immediately on the library page
2. Multiple entries can be added in sequence without refresh
3. Entries added from the dashboard via Quick Add appear when navigating to library
4. Keyboard shortcut (Cmd/Ctrl+K) Quick Add works correctly

## Files Changed

- `composables/useEntryEvents.ts` (new file)
- `layouts/app.vue` (modified)
- `pages/app/library/index.vue` (modified)
- `tests/e2e/library-quick-add-immediate-update.spec.ts` (new file)

## Future Enhancements

The same pattern can be applied to:

- Dashboard page to update recent entries when new ones are created
- Project pages to refresh entry lists
- Any other page that displays entry information
