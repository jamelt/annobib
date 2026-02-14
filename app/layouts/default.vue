<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
  },
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <slot />
  </div>
</template>
