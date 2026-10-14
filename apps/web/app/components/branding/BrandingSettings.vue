<script setup lang="ts">
import {
  brandColors,
  type Branding,
  logoContentTypes,
  MAX_LOGO_BYTES,
} from '@entitled/contracts/settings'

const { data: branding, refresh } = useBranding()
const toast = useToast()

const portalName = ref(branding.value.portalName)
const primaryColor = ref(branding.value.primaryColor)
const saving = ref(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

const colorItems = brandColors.map((color) => ({
  label: color.charAt(0).toUpperCase() + color.slice(1),
  value: color,
}))

async function save() {
  saving.value = true
  try {
    await $fetch<Branding>('/api/branding', {
      method: 'PATCH',
      body: { portalName: portalName.value, primaryColor: primaryColor.value },
    })
    await refresh()
    toast.add({ title: 'Branding saved', color: 'success' })
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    saving.value = false
  }
}

async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > MAX_LOGO_BYTES) {
    toast.add({ title: 'The logo must be at most 512 KB', color: 'error' })
    return
  }
  try {
    await $fetch('/api/branding/logo', {
      method: 'PUT',
      body: file,
      headers: { 'content-type': file.type },
    })
    await refresh()
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  }
}

async function removeLogo() {
  await $fetch('/api/branding/logo', { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">Branding</h2>
      <p class="text-sm text-muted">How the portal looks to your clients.</p>
    </template>
    <form class="space-y-4" @submit.prevent="save">
      <UFormField label="Portal name">
        <UInput v-model="portalName" class="w-full" />
      </UFormField>
      <UFormField label="Primary colour">
        <USelect v-model="primaryColor" :items="colorItems" class="w-full" />
      </UFormField>
      <UFormField label="Logo" help="PNG, JPEG or WebP, up to 512 KB">
        <div class="flex items-center gap-3">
          <img
            v-if="branding.logoUrl"
            :src="branding.logoUrl"
            alt="Current logo"
            class="h-10 w-auto rounded border border-default bg-white p-1"
          />
          <input
            ref="fileInput"
            type="file"
            :accept="logoContentTypes.join(',')"
            class="hidden"
            @change="uploadLogo"
          />
          <UButton
            variant="soft"
            icon="i-lucide-image-up"
            :label="branding.logoUrl ? 'Replace' : 'Upload'"
            @click="fileInput?.click()"
          />
          <UButton
            v-if="branding.logoUrl"
            variant="ghost"
            color="error"
            label="Remove"
            @click="removeLogo"
          />
        </div>
      </UFormField>
      <div class="flex justify-end">
        <UButton type="submit" :loading="saving" label="Save branding" />
      </div>
    </form>
  </UCard>
</template>
