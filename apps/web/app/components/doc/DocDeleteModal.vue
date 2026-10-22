<script setup lang="ts">
const { title, subPageCount } = defineProps<{ title: string; subPageCount: number }>()
const emit = defineEmits<{ confirm: [] }>()
const isOpen = defineModel<boolean>('open', { required: true })
</script>

<template>
  <UModal v-model:open="isOpen" title="Delete this page?">
    <template #body>
      <p class="text-sm text-default">
        “{{ title }}” will be removed for everyone, together with its history.
        <strong v-if="subPageCount">
          Its {{ subPageCount }} {{ subPageCount === 1 ? 'sub-page is' : 'sub-pages are' }} deleted
          too.
        </strong>
      </p>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="ghost" @click="isOpen = false" />
        <UButton
          label="Delete page"
          color="error"
          icon="i-lucide-trash-2"
          @click="emit('confirm')"
        />
      </div>
    </template>
  </UModal>
</template>
