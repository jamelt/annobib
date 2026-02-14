<script setup lang="ts">
/**
 * Deprecated: Mobile quick add is now handled by the responsive QuickAddModal.
 * This component is kept as a thin wrapper that opens the shared Quick Add modal.
 * If mounted directly, it emits 'close' and delegates to the shared composable.
 */

const emit = defineEmits<{
  close: []
  created: [entry: any]
}>()

const { open } = useQuickAdd()

onMounted(() => {
  open()
  nextTick(() => {
    emit('close')
  })
})
</script>

<template>
  <div />
</template>
