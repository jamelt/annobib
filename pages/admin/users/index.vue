<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const search = ref('')
const tierFilter = ref<string>('')
const roleFilter = ref<string>('')
const bannedFilter = ref<string>('')
const page = ref(1)
const pageSize = 20

const queryParams = computed(() => ({
  q: search.value || undefined,
  tier: tierFilter.value || undefined,
  role: roleFilter.value || undefined,
  banned: bannedFilter.value || undefined,
  page: page.value,
  pageSize,
}))

const { data: usersData, pending, refresh } = useFetch('/api/admin/users', {
  query: queryParams,
  watch: [queryParams],
})

const selectedUser = ref<any>(null)
const isDetailOpen = ref(false)
const isGrantTierOpen = ref(false)
const isBanDialogOpen = ref(false)
const banReason = ref('')
const grantTier = ref<'free' | 'light' | 'pro'>('pro')

function openUserDetail(user: any) {
  selectedUser.value = user
  isDetailOpen.value = true
}

async function handleBan() {
  if (!selectedUser.value || !banReason.value) return
  await $fetch(`/api/admin/users/${selectedUser.value.id}/ban`, {
    method: 'POST',
    body: { reason: banReason.value },
  })
  isBanDialogOpen.value = false
  banReason.value = ''
  isDetailOpen.value = false
  refresh()
}

async function handleUnban(userId: string) {
  await $fetch(`/api/admin/users/${userId}/unban`, { method: 'POST' })
  isDetailOpen.value = false
  refresh()
}

async function handleGrantTier() {
  if (!selectedUser.value) return
  await $fetch(`/api/admin/users/${selectedUser.value.id}/grant-tier`, {
    method: 'POST',
    body: { tier: grantTier.value },
  })
  isGrantTierOpen.value = false
  isDetailOpen.value = false
  refresh()
}

const tierColors: Record<string, string> = {
  free: 'neutral',
  light: 'info',
  pro: 'warning',
}

const roleColors: Record<string, string> = {
  user: 'neutral',
  admin: 'error',
  support: 'info',
}

function resetFilters() {
  search.value = ''
  tierFilter.value = ''
  roleFilter.value = ''
  bannedFilter.value = ''
  page.value = 1
}

watch(search, () => { page.value = 1 })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-white">User Management</h1>
      <span class="text-sm text-gray-400">{{ usersData?.total ?? 0 }} users total</span>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 items-end">
      <UInput
        v-model="search"
        icon="i-heroicons-magnifying-glass"
        placeholder="Search by email or name..."
        class="w-64"
      />
      <USelect
        v-model="tierFilter"
        :items="[
          { label: 'All Tiers', value: '' },
          { label: 'Free', value: 'free' },
          { label: 'Light', value: 'light' },
          { label: 'Pro', value: 'pro' },
        ]"
        class="w-36"
      />
      <USelect
        v-model="roleFilter"
        :items="[
          { label: 'All Roles', value: '' },
          { label: 'User', value: 'user' },
          { label: 'Admin', value: 'admin' },
          { label: 'Support', value: 'support' },
        ]"
        class="w-36"
      />
      <USelect
        v-model="bannedFilter"
        :items="[
          { label: 'All Status', value: '' },
          { label: 'Active', value: 'false' },
          { label: 'Banned', value: 'true' },
        ]"
        class="w-36"
      />
      <UButton
        icon="i-heroicons-x-mark"
        variant="ghost"
        color="neutral"
        size="sm"
        @click="resetFilters"
      />
    </div>

    <!-- Users Table -->
    <UCard class="bg-gray-900 border-gray-800">
      <div v-if="pending" class="space-y-3">
        <USkeleton v-for="i in 5" :key="i" class="h-12 rounded" />
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-400 border-b border-gray-800">
              <th class="pb-3 font-medium">User</th>
              <th class="pb-3 font-medium">Tier</th>
              <th class="pb-3 font-medium">Role</th>
              <th class="pb-3 font-medium">Status</th>
              <th class="pb-3 font-medium">Joined</th>
              <th class="pb-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in usersData?.data"
              :key="u.id"
              class="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer transition-colors"
              @click="openUserDetail(u)"
            >
              <td class="py-3">
                <div class="flex items-center gap-3">
                  <UAvatar :text="u.email?.slice(0, 2).toUpperCase()" size="sm" />
                  <div>
                    <p class="font-medium text-white">{{ u.name || 'No name' }}</p>
                    <p class="text-xs text-gray-500">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-3">
                <UBadge :color="(tierColors[u.subscriptionTier] as any)" variant="subtle" size="sm">
                  {{ u.subscriptionTier }}
                </UBadge>
              </td>
              <td class="py-3">
                <UBadge :color="(roleColors[u.role] as any)" variant="subtle" size="sm">
                  {{ u.role }}
                </UBadge>
              </td>
              <td class="py-3">
                <UBadge v-if="u.isBanned" color="error" variant="subtle" size="sm">Banned</UBadge>
                <UBadge v-else color="success" variant="subtle" size="sm">Active</UBadge>
              </td>
              <td class="py-3 text-gray-400">
                {{ new Date(u.createdAt).toLocaleDateString() }}
              </td>
              <td class="py-3 text-right">
                <UButton
                  icon="i-heroicons-eye"
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  @click.stop="openUserDetail(u)"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="!usersData?.data?.length" class="text-center py-8 text-gray-500">
          No users found matching your filters.
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="usersData && usersData.totalPages > 1" class="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
        <span class="text-sm text-gray-400">
          Page {{ usersData.page }} of {{ usersData.totalPages }}
        </span>
        <div class="flex gap-2">
          <UButton
            icon="i-heroicons-chevron-left"
            variant="ghost"
            color="neutral"
            size="sm"
            :disabled="page <= 1"
            @click="page--"
          />
          <UButton
            icon="i-heroicons-chevron-right"
            variant="ghost"
            color="neutral"
            size="sm"
            :disabled="page >= usersData.totalPages"
            @click="page++"
          />
        </div>
      </div>
    </UCard>

    <!-- User Detail Slideover -->
    <USlideover v-model="isDetailOpen" :title="selectedUser?.name || selectedUser?.email || 'User Detail'">
      <div v-if="selectedUser" class="p-6 space-y-6">
        <div class="flex items-center gap-4">
          <UAvatar :text="selectedUser.email?.slice(0, 2).toUpperCase()" size="lg" />
          <div>
            <h3 class="text-lg font-semibold text-white">{{ selectedUser.name || 'No name' }}</h3>
            <p class="text-sm text-gray-400">{{ selectedUser.email }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-500 mb-1">Subscription Tier</p>
            <UBadge :color="(tierColors[selectedUser.subscriptionTier] as any)" variant="subtle">
              {{ selectedUser.subscriptionTier }}
            </UBadge>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Role</p>
            <UBadge :color="(roleColors[selectedUser.role] as any)" variant="subtle">
              {{ selectedUser.role }}
            </UBadge>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Status</p>
            <UBadge :color="selectedUser.isBanned ? 'error' : 'success'" variant="subtle">
              {{ selectedUser.isBanned ? 'Banned' : 'Active' }}
            </UBadge>
          </div>
          <div>
            <p class="text-xs text-gray-500 mb-1">Joined</p>
            <p class="text-sm text-white">{{ new Date(selectedUser.createdAt).toLocaleDateString() }}</p>
          </div>
        </div>

        <div>
          <p class="text-xs text-gray-500 mb-1">User ID</p>
          <code class="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">{{ selectedUser.id }}</code>
        </div>

        <hr class="border-gray-800">

        <div class="space-y-2">
          <h4 class="text-sm font-medium text-gray-300">Actions</h4>

          <UButton
            icon="i-heroicons-arrow-path"
            label="Change Tier"
            variant="outline"
            color="neutral"
            block
            class="justify-start"
            @click="isGrantTierOpen = true"
          />

          <UButton
            v-if="!selectedUser.isBanned"
            icon="i-heroicons-no-symbol"
            label="Ban User"
            variant="outline"
            color="error"
            block
            class="justify-start"
            @click="isBanDialogOpen = true"
          />
          <UButton
            v-else
            icon="i-heroicons-check-circle"
            label="Unban User"
            variant="outline"
            color="success"
            block
            class="justify-start"
            @click="handleUnban(selectedUser.id)"
          />
        </div>
      </div>
    </USlideover>

    <!-- Grant Tier Dialog -->
    <UModal v-model:open="isGrantTierOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold">Change Subscription Tier</h3>
          <p class="text-sm text-gray-400">
            Override the subscription tier for <strong>{{ selectedUser?.email }}</strong>.
            This bypasses Stripe and takes effect immediately.
          </p>
          <USelect
            v-model="grantTier"
            :items="[
              { label: 'Free', value: 'free' },
              { label: 'Light', value: 'light' },
              { label: 'Pro', value: 'pro' },
            ]"
          />
          <div class="flex gap-2 justify-end">
            <UButton label="Cancel" variant="ghost" color="neutral" @click="isGrantTierOpen = false" />
            <UButton label="Apply Change" color="primary" @click="handleGrantTier" />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Ban Dialog -->
    <UModal v-model:open="isBanDialogOpen">
      <template #content>
        <div class="p-6 space-y-4">
          <h3 class="text-lg font-semibold text-red-400">Ban User</h3>
          <p class="text-sm text-gray-400">
            This will immediately prevent <strong>{{ selectedUser?.email }}</strong> from accessing the application.
          </p>
          <UTextarea
            v-model="banReason"
            placeholder="Reason for banning this user..."
            :rows="3"
          />
          <div class="flex gap-2 justify-end">
            <UButton label="Cancel" variant="ghost" color="neutral" @click="isBanDialogOpen = false" />
            <UButton label="Ban User" color="error" :disabled="!banReason" @click="handleBan" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
