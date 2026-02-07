<script setup lang="ts">
const { isOpen, close } = useQuickAdd()
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UModals />
    <USlideovers />

    <AppQuickAddModal
      v-model="isOpen"
      @update:model-value="(val: boolean) => { if (!val) close() }"
    />
  </UApp>
</template>

<style>
html,
body,
#__nuxt {
  height: 100%;
}
</style>
