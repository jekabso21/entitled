<script setup lang="ts">
const { threadId, allowInternal = false } = defineProps<{
  threadId: string
  allowInternal?: boolean
}>()
const emit = defineEmits<{ posted: [] }>()

const body = ref('')
const internal = ref(false)
const pending = ref(false)
const toast = useToast()
const { attachments, uploading, add, remove, clear } = useSupportAttachments()

async function addFiles(files: File[]) {
  try {
    await add(files)
  } catch (error) {
    toast.add({ title: apiErrorMessage(error, 'Upload failed'), color: 'error' })
  }
}

async function send() {
  pending.value = true
  try {
    await $fetch(`/api/support/threads/${threadId}/messages`, {
      method: 'POST',
      body: {
        body: body.value,
        internal: internal.value,
        attachmentIds: attachments.value.map((attachment) => attachment.id),
      },
    })
    body.value = ''
    internal.value = false
    clear()
    emit('posted')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error), color: 'error' })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="space-y-3" @submit.prevent="send">
    <MarkdownEditor v-model="body" :rows="5" placeholder="Write a reply…" />
    <div class="flex flex-wrap items-center justify-between gap-3">
      <SupportAttachmentPicker
        :attachments="attachments"
        :uploading="uploading"
        @add="addFiles"
        @remove="remove"
      />
      <div class="flex items-center gap-4">
        <USwitch v-if="allowInternal" v-model="internal" label="Internal note" />
        <UButton
          type="submit"
          :loading="pending"
          :disabled="!body.trim() || uploading"
          :color="internal ? 'warning' : 'primary'"
          :label="internal ? 'Add note' : 'Send reply'"
        />
      </div>
    </div>
  </form>
</template>
