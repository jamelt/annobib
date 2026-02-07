<script setup lang="ts">
const { user, logout } = useAuth()

const colorMode = useColorMode()
const isDark = computed({
  get: () => colorMode.value === 'dark',
  set: (value) => {
    colorMode.preference = value ? 'dark' : 'light'
  },
})

const isSidebarOpen = ref(true)

const navigation = [
  { name: 'Dashboard', to: '/admin', icon: 'i-heroicons-chart-bar-square', exact: true },
  { name: 'Users', to: '/admin/users', icon: 'i-heroicons-users' },
  { name: 'Feedback', to: '/admin/feedback', icon: 'i-heroicons-inbox' },
  { name: 'Announcements', to: '/admin/announcements', icon: 'i-heroicons-megaphone' },
  { name: 'Audit Log', to: '/admin/audit-log', icon: 'i-heroicons-clipboard-document-list' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-950 text-gray-100">
    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-800 bg-gray-900 transition-all duration-300"
      :class="isSidebarOpen ? 'w-64' : 'w-20'"
    >
      <div class="flex h-16 items-center justify-between px-4 border-b border-gray-800">
        <NuxtLink v-if="isSidebarOpen" to="/admin" class="flex items-center gap-2">
          <UIcon name="i-heroicons-shield-check" class="w-7 h-7 text-amber-500" />
          <span class="text-lg font-bold text-white">Admin</span>
        </NuxtLink>
        <UIcon v-else name="i-heroicons-shield-check" class="w-7 h-7 text-amber-500 mx-auto" />
      </div>

      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <UTooltip
          v-for="item in navigation"
          :key="item.name"
          :text="item.name"
          :content="{ side: 'right' }"
        >
          <NuxtLink
            :to="item.to"
            :exact="item.exact"
            class="group flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            active-class="bg-amber-500/10 text-amber-400"
          >
            <UIcon :name="item.icon" class="w-5 h-5 shrink-0" />
            <span v-if="isSidebarOpen" class="truncate">{{ item.name }}</span>
          </NuxtLink>
        </UTooltip>
      </nav>

      <div class="p-4 border-t border-gray-800 space-y-2">
        <NuxtLink
          to="/app"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 shrink-0" />
          <span v-if="isSidebarOpen" class="truncate">Back to App</span>
        </NuxtLink>

        <button
          class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-left"
          @click="logout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-5 h-5 shrink-0" />
          <span v-if="isSidebarOpen" class="truncate">Sign out</span>
        </button>

        <UButton
          :icon="isSidebarOpen ? 'i-heroicons-chevron-double-left' : 'i-heroicons-chevron-double-right'"
          variant="ghost"
          color="neutral"
          :class="isSidebarOpen ? '' : 'mx-auto'"
          block
          @click="isSidebarOpen = !isSidebarOpen"
        />
      </div>
    </aside>

    <!-- Main content -->
    <div
      class="transition-all duration-300"
      :class="isSidebarOpen ? 'pl-64' : 'pl-20'"
    >
      <header class="sticky top-0 z-30 h-16 flex items-center justify-between gap-4 px-6 border-b border-gray-800 bg-gray-950/80 backdrop-blur">
        <div class="flex items-center gap-2">
          <UBadge color="amber" variant="subtle" size="sm">
            ADMIN
          </UBadge>
        </div>

        <div class="flex items-center gap-4">
          <UButton
            :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
            variant="ghost"
            color="neutral"
            @click="isDark = !isDark"
          />
          <UDropdown
            :items="[
              [{ label: 'Back to App', icon: 'i-heroicons-arrow-left', to: '/app' }],
              [{ label: 'Sign out', icon: 'i-heroicons-arrow-right-on-rectangle', onClick: () => logout() }]
            ]"
            :popper="{ placement: 'bottom-end' }"
          >
            <UAvatar
              :text="(user as { email?: string })?.email?.slice(0, 2).toUpperCase() || 'A'"
              size="sm"
              class="cursor-pointer"
            />
          </UDropdown>
        </div>
      </header>

      <main class="p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
