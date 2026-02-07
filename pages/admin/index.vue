<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const config = useRuntimeConfig()

const { data: stats, pending } = useFetch('/api/admin/stats')
const { data: health } = useFetch('/api/health', {
  default: () => null,
})

const statCards = computed(() => {
  if (!stats.value) return []
  return [
    { label: 'Total Users', value: stats.value.users.total, icon: 'i-heroicons-users', color: 'text-blue-400' },
    { label: 'New This Week', value: stats.value.users.newThisWeek, icon: 'i-heroicons-user-plus', color: 'text-green-400' },
    { label: 'New This Month', value: stats.value.users.newThisMonth, icon: 'i-heroicons-calendar', color: 'text-purple-400' },
    { label: 'Active Subscriptions', value: stats.value.subscriptions.active, icon: 'i-heroicons-credit-card', color: 'text-amber-400' },
    { label: 'Total Entries', value: stats.value.content.totalEntries, icon: 'i-heroicons-book-open', color: 'text-cyan-400' },
    { label: 'Total Projects', value: stats.value.content.totalProjects, icon: 'i-heroicons-folder', color: 'text-indigo-400' },
    { label: 'Open Feedback', value: stats.value.feedback.open, icon: 'i-heroicons-inbox', color: 'text-rose-400' },
  ]
})

const tierData = computed(() => {
  if (!stats.value) return []
  const tiers = stats.value.subscriptions.byTier as Record<string, number>
  return [
    { label: 'Free', value: tiers.free ?? 0, color: 'bg-gray-500' },
    { label: 'Light', value: tiers.light ?? 0, color: 'bg-blue-500' },
    { label: 'Pro', value: tiers.pro ?? 0, color: 'bg-amber-500' },
  ]
})

const totalTierUsers = computed(() => tierData.value.reduce((sum, t) => sum + t.value, 0) || 1)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white">Admin Dashboard</h1>
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1.5 text-sm"
          :class="health?.status === 'healthy' ? 'text-green-400' : 'text-red-400'"
        >
          <span class="w-2 h-2 rounded-full" :class="health?.status === 'healthy' ? 'bg-green-400' : 'bg-red-400'" />
          {{ health?.status === 'healthy' ? 'System Healthy' : 'System Issue' }}
        </span>
      </div>
    </div>

    <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <USkeleton v-for="i in 7" :key="i" class="h-24 rounded-lg" />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="stat in statCards" :key="stat.label" class="bg-gray-900 border-gray-800">
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-lg bg-gray-800">
            <UIcon :name="stat.icon" class="w-5 h-5" :class="stat.color" />
          </div>
          <div>
            <p class="text-sm text-gray-400">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-white">{{ stat.value?.toLocaleString() }}</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Subscription tier breakdown -->
    <UCard class="bg-gray-900 border-gray-800">
      <template #header>
        <h2 class="text-lg font-semibold text-white">Subscription Distribution</h2>
      </template>

      <div class="space-y-4">
        <div class="flex h-4 rounded-full overflow-hidden bg-gray-800">
          <div
            v-for="tier in tierData"
            :key="tier.label"
            :class="tier.color"
            :style="{ width: `${(tier.value / totalTierUsers) * 100}%` }"
            class="transition-all duration-500"
          />
        </div>
        <div class="flex gap-6">
          <div v-for="tier in tierData" :key="tier.label" class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :class="tier.color" />
            <span class="text-sm text-gray-400">{{ tier.label }}: {{ tier.value }}</span>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Quick links -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h3 class="text-base font-semibold text-white">Quick Actions</h3>
        </template>
        <div class="space-y-2">
          <UButton to="/admin/users" label="Manage Users" icon="i-heroicons-users" variant="ghost" color="neutral" block class="justify-start" />
          <UButton to="/admin/feedback" label="View Feedback" icon="i-heroicons-inbox" variant="ghost" color="neutral" block class="justify-start" />
          <UButton to="/admin/announcements" label="Post Announcement" icon="i-heroicons-megaphone" variant="ghost" color="neutral" block class="justify-start" />
        </div>
      </UCard>

      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h3 class="text-base font-semibold text-white">System Health</h3>
        </template>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Database</span>
            <UBadge
              :color="health?.checks?.database?.status === 'healthy' ? 'success' : 'error'"
              variant="subtle"
              size="sm"
            >
              {{ health?.checks?.database?.status || 'unknown' }}
            </UBadge>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">DB Latency</span>
            <span class="text-sm text-white">{{ health?.checks?.database?.latency ?? '...' }}ms</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Uptime</span>
            <span class="text-sm text-white">{{ health?.uptime ? Math.floor(health.uptime / 3600) + 'h' : '...' }}</span>
          </div>
        </div>
      </UCard>

      <UCard class="bg-gray-900 border-gray-800">
        <template #header>
          <h3 class="text-base font-semibold text-white">Stripe</h3>
        </template>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Status</span>
            <UBadge
              :color="health?.checks?.stripe?.status === 'healthy' ? 'success' : health?.checks?.stripe?.status === 'unconfigured' ? 'warning' : 'error'"
              variant="subtle"
              size="sm"
            >
              {{ health?.checks?.stripe?.status || 'unknown' }}
            </UBadge>
          </div>
          <div v-if="health?.checks?.stripe?.latency" class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Latency</span>
            <span class="text-sm text-white">{{ health.checks.stripe.latency }}ms</span>
          </div>
          <div v-if="health?.checks?.stripe?.error" class="flex items-center justify-between">
            <span class="text-sm text-gray-400">Note</span>
            <span class="text-xs text-gray-500 truncate max-w-[180px]">{{ health.checks.stripe.error }}</span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
