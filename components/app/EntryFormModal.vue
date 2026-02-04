<script setup lang="ts">
import type { EntryType, Author } from '~/shared/types'
import { ENTRY_TYPE_LABELS } from '~/shared/types'

const props = defineProps<{
  open: boolean
  entry?: any
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  created: [entry: any]
  updated: [entry: any]
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const isEditing = computed(() => !!props.entry)

const { data: projects } = await useFetch('/api/projects')
const { data: tags } = await useFetch('/api/tags')

const form = reactive({
  entryType: 'book' as EntryType,
  title: '',
  authors: [] as Author[],
  year: undefined as number | undefined,
  metadata: {
    doi: '',
    isbn: '',
    url: '',
    abstract: '',
    publisher: '',
    journal: '',
    volume: '',
    issue: '',
    pages: '',
  },
  notes: '',
  isFavorite: false,
  projectIds: [] as string[],
  tagIds: [] as string[],
})

const newAuthor = reactive({
  firstName: '',
  lastName: '',
  middleName: '',
})

const isSubmitting = ref(false)
const errors = ref<Record<string, string>>({})

const entryTypeOptions = Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

watch(() => props.entry, (entry) => {
  if (entry) {
    Object.assign(form, {
      entryType: entry.entryType,
      title: entry.title,
      authors: entry.authors || [],
      year: entry.year,
      metadata: { ...entry.metadata },
      notes: entry.notes || '',
      isFavorite: entry.isFavorite,
      projectIds: entry.projects?.map((p: any) => p.id) || [],
      tagIds: entry.tags?.map((t: any) => t.id) || [],
    })
  }
}, { immediate: true })

function addAuthor() {
  if (newAuthor.lastName && newAuthor.firstName) {
    form.authors.push({ ...newAuthor })
    newAuthor.firstName = ''
    newAuthor.lastName = ''
    newAuthor.middleName = ''
  }
}

function removeAuthor(index: number) {
  form.authors.splice(index, 1)
}

function resetForm() {
  Object.assign(form, {
    entryType: 'book',
    title: '',
    authors: [],
    year: undefined,
    metadata: {
      doi: '',
      isbn: '',
      url: '',
      abstract: '',
      publisher: '',
      journal: '',
      volume: '',
      issue: '',
      pages: '',
    },
    notes: '',
    isFavorite: false,
    projectIds: [],
    tagIds: [],
  })
  errors.value = {}
}

async function handleSubmit() {
  errors.value = {}

  if (!form.title) {
    errors.value.title = 'Title is required'
    return
  }

  isSubmitting.value = true

  try {
    const payload = {
      ...form,
      metadata: Object.fromEntries(
        Object.entries(form.metadata).filter(([_, v]) => v),
      ),
    }

    if (isEditing.value) {
      const updated = await $fetch(`/api/entries/${props.entry.id}`, {
        method: 'PUT',
        body: payload,
      })
      emit('updated', updated)
    }
    else {
      const created = await $fetch('/api/entries', {
        method: 'POST',
        body: payload,
      })
      emit('created', created)
    }

    isOpen.value = false
    resetForm()
  }
  catch (error: any) {
    if (error.data?.data?.fieldErrors) {
      errors.value = error.data.data.fieldErrors
    }
    else {
      errors.value.general = error.data?.message || 'An error occurred'
    }
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-2xl' }">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ isEditing ? 'Edit Entry' : 'Add Entry' }}
          </h2>
          <UButton
            icon="i-heroicons-x-mark"
            variant="ghost"
            color="gray"
            @click="isOpen = false"
          />
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <UAlert
          v-if="errors.general"
          color="red"
          icon="i-heroicons-exclamation-triangle"
          :title="errors.general"
        />

        <!-- Entry Type -->
        <UFormGroup label="Type" required>
          <USelectMenu
            v-model="form.entryType"
            :options="entryTypeOptions"
            value-attribute="value"
            option-attribute="label"
          />
        </UFormGroup>

        <!-- Title -->
        <UFormGroup label="Title" required :error="errors.title">
          <UInput
            v-model="form.title"
            placeholder="Enter the title"
          />
        </UFormGroup>

        <!-- Authors -->
        <UFormGroup label="Authors">
          <div class="space-y-2">
            <div
              v-for="(author, index) in form.authors"
              :key="index"
              class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <span class="flex-1">
                {{ author.lastName }}, {{ author.firstName }}
                {{ author.middleName ? ` ${author.middleName}` : '' }}
              </span>
              <UButton
                icon="i-heroicons-x-mark"
                variant="ghost"
                color="gray"
                size="xs"
                @click="removeAuthor(index)"
              />
            </div>

            <div class="flex gap-2">
              <UInput
                v-model="newAuthor.firstName"
                placeholder="First name"
                class="flex-1"
                @keyup.enter.prevent="addAuthor"
              />
              <UInput
                v-model="newAuthor.middleName"
                placeholder="Middle"
                class="w-24"
                @keyup.enter.prevent="addAuthor"
              />
              <UInput
                v-model="newAuthor.lastName"
                placeholder="Last name"
                class="flex-1"
                @keyup.enter.prevent="addAuthor"
              />
              <UButton
                icon="i-heroicons-plus"
                variant="outline"
                color="gray"
                @click="addAuthor"
              />
            </div>
          </div>
        </UFormGroup>

        <!-- Year -->
        <UFormGroup label="Year">
          <UInput
            v-model.number="form.year"
            type="number"
            :min="1"
            :max="9999"
            placeholder="Publication year"
          />
        </UFormGroup>

        <!-- Type-specific metadata -->
        <div v-if="['book', 'thesis', 'report'].includes(form.entryType)" class="grid grid-cols-2 gap-4">
          <UFormGroup label="Publisher">
            <UInput v-model="form.metadata.publisher" placeholder="Publisher name" />
          </UFormGroup>
          <UFormGroup label="ISBN">
            <UInput v-model="form.metadata.isbn" placeholder="ISBN" />
          </UFormGroup>
        </div>

        <div v-if="form.entryType === 'journal_article'" class="grid grid-cols-2 gap-4">
          <UFormGroup label="Journal" class="col-span-2">
            <UInput v-model="form.metadata.journal" placeholder="Journal name" />
          </UFormGroup>
          <UFormGroup label="Volume">
            <UInput v-model="form.metadata.volume" placeholder="Volume" />
          </UFormGroup>
          <UFormGroup label="Issue">
            <UInput v-model="form.metadata.issue" placeholder="Issue" />
          </UFormGroup>
          <UFormGroup label="Pages">
            <UInput v-model="form.metadata.pages" placeholder="e.g., 123-145" />
          </UFormGroup>
          <UFormGroup label="DOI">
            <UInput v-model="form.metadata.doi" placeholder="DOI" />
          </UFormGroup>
        </div>

        <div v-if="form.entryType === 'website'" class="space-y-4">
          <UFormGroup label="URL">
            <UInput v-model="form.metadata.url" type="url" placeholder="https://..." />
          </UFormGroup>
        </div>

        <!-- Abstract -->
        <UFormGroup label="Abstract">
          <UTextarea
            v-model="form.metadata.abstract"
            :rows="3"
            placeholder="Enter the abstract..."
          />
        </UFormGroup>

        <!-- Projects -->
        <UFormGroup label="Projects">
          <USelectMenu
            v-model="form.projectIds"
            :options="projects || []"
            multiple
            placeholder="Select projects..."
            value-attribute="id"
            option-attribute="name"
          />
        </UFormGroup>

        <!-- Tags -->
        <UFormGroup label="Tags">
          <USelectMenu
            v-model="form.tagIds"
            :options="tags || []"
            multiple
            placeholder="Select tags..."
            value-attribute="id"
            option-attribute="name"
          >
            <template #option="{ option }">
              <span
                class="w-3 h-3 rounded-full flex-shrink-0"
                :style="{ backgroundColor: option.color }"
              />
              <span>{{ option.name }}</span>
            </template>
          </USelectMenu>
        </UFormGroup>

        <!-- Notes -->
        <UFormGroup label="Notes">
          <UTextarea
            v-model="form.notes"
            :rows="2"
            placeholder="Personal notes..."
          />
        </UFormGroup>

        <!-- Favorite -->
        <UCheckbox v-model="form.isFavorite" label="Mark as favorite" />
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="outline"
            color="gray"
            @click="isOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            color="primary"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            {{ isEditing ? 'Save Changes' : 'Add Entry' }}
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
