<script setup lang="ts">
import { type DocPage, type DocPageSummary, MAX_DOC_PAGE_DEPTH } from '@entitled/contracts/docs'
import type { DropdownMenuItem } from '@nuxt/ui'

const { productId, pages, activeId } = defineProps<{
  productId: string
  pages: DocPageSummary[]
  activeId: string | null
}>()
const emit = defineEmits<{ changed: [] }>()

const toast = useToast()
const collapsed = ref(new Set<string>())
const dragging = ref<string | null>(null)
const dropTarget = ref<{ id: string; placement: DocDropPlacement } | null>(null)

const rows = computed(() => flattenDocTree(pages))
const visibleRows = computed(() => {
  const hidden = new Set<string>()
  for (const id of collapsed.value) for (const child of descendantIds(pages, id)) hidden.add(child)
  return rows.value.filter((row) => !hidden.has(row.page.id))
})

function toggle(id: string) {
  const next = new Set(collapsed.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsed.value = next
}

async function saveOrder(order: { id: string; parentId: string | null }[] | null) {
  if (!order) return
  try {
    await $fetch(`/api/products/${productId}/docs/order`, { method: 'PUT', body: { pages: order } })
    emit('changed')
  } catch (error) {
    toast.add({ title: apiErrorMessage(error, 'Could not move the page'), color: 'error' })
  }
}

async function addPage(parentId: string | null) {
  const page = await $fetch<DocPage>(`/api/products/${productId}/docs`, {
    method: 'POST',
    body: { title: 'Untitled page', parentId },
  })
  if (parentId && collapsed.value.has(parentId)) toggle(parentId)
  emit('changed')
  await navigateTo(`/admin/docs/${productId}/${page.id}`)
}

async function onImported(created: DocPageSummary[]) {
  emit('changed')
  const [first] = created
  if (first) await navigateTo(`/admin/docs/${productId}/${first.id}`)
}

function siblingsOf(row: DocTreeRow) {
  return rows.value.filter((other) => other.page.parentId === row.page.parentId)
}

function menuFor(row: DocTreeRow): DropdownMenuItem[][] {
  const siblings = siblingsOf(row)
  const index = siblings.findIndex((other) => other.page.id === row.page.id)
  const previous = siblings[index - 1]
  const next = siblings[index + 1]
  const parentId = row.page.parentId
  return [
    [
      {
        label: 'Add sub-page',
        icon: 'i-lucide-file-plus',
        disabled: row.depth >= MAX_DOC_PAGE_DEPTH - 1,
        onSelect: () => void addPage(row.page.id),
      },
    ],
    [
      {
        label: 'Move up',
        icon: 'i-lucide-arrow-up',
        disabled: !previous,
        onSelect: () =>
          previous && void saveOrder(moveDocPage(pages, row.page.id, previous.page.id, 'before')),
      },
      {
        label: 'Move down',
        icon: 'i-lucide-arrow-down',
        disabled: !next,
        onSelect: () =>
          next && void saveOrder(moveDocPage(pages, row.page.id, next.page.id, 'after')),
      },
      {
        label: previous ? `Move into “${previous.page.title}”` : 'Move into the page above',
        icon: 'i-lucide-indent-increase',
        disabled: !previous || !moveDocPage(pages, row.page.id, previous.page.id, 'inside'),
        onSelect: () =>
          previous && void saveOrder(moveDocPage(pages, row.page.id, previous.page.id, 'inside')),
      },
      {
        label: 'Move out one level',
        icon: 'i-lucide-indent-decrease',
        disabled: parentId === null,
        onSelect: () =>
          parentId && void saveOrder(moveDocPage(pages, row.page.id, parentId, 'after')),
      },
    ],
  ]
}

function onDragOver(event: DragEvent, row: DocTreeRow) {
  if (!dragging.value || !(event.currentTarget instanceof HTMLElement)) return
  const box = event.currentTarget.getBoundingClientRect()
  const ratio = (event.clientY - box.top) / box.height
  let placement: DocDropPlacement = ratio < 0.3 ? 'before' : ratio > 0.7 ? 'after' : 'inside'
  if (placement === 'inside' && !moveDocPage(pages, dragging.value, row.page.id, 'inside')) {
    placement = ratio < 0.5 ? 'before' : 'after'
  }
  if (!moveDocPage(pages, dragging.value, row.page.id, placement)) {
    dropTarget.value = null
    return
  }
  event.preventDefault()
  dropTarget.value = { id: row.page.id, placement }
}

function endDrag() {
  dragging.value = null
  dropTarget.value = null
}

async function onDrop() {
  const source = dragging.value
  const target = dropTarget.value
  dragging.value = null
  dropTarget.value = null
  if (source && target) await saveOrder(moveDocPage(pages, source, target.id, target.placement))
}

function dropClass(id: string) {
  if (dropTarget.value?.id !== id) return ''
  if (dropTarget.value.placement === 'before') return 'shadow-[inset_0_2px_0_var(--ui-primary)]'
  if (dropTarget.value.placement === 'after') return 'shadow-[inset_0_-2px_0_var(--ui-primary)]'
  return 'bg-primary/10 ring-1 ring-primary ring-inset'
}
</script>

<template>
  <nav aria-label="Documentation pages" class="flex min-h-0 flex-col">
    <div class="flex items-center gap-2 border-b border-default p-3">
      <UButton
        icon="i-lucide-plus"
        label="New page"
        size="sm"
        class="flex-1 justify-center"
        @click="addPage(null)"
      />
      <DocImportModal :product-id="productId" label="Import" @imported="onImported" />
    </div>
    <div class="border-b border-default p-3">
      <DocSearch
        :product-id="productId"
        :page-path="(id: string) => `/admin/docs/${productId}/${id}`"
      />
    </div>
    <ul
      v-if="rows.length"
      class="min-h-0 flex-1 overflow-y-auto p-2"
      @dragleave.self="dropTarget = null"
    >
      <li
        v-for="row in visibleRows"
        :key="row.page.id"
        class="group relative flex items-center gap-1 rounded-sm pr-1 transition-colors"
        :class="[
          row.page.id === activeId ? 'bg-elevated' : 'hover:bg-elevated/60',
          dragging === row.page.id ? 'opacity-40' : '',
          dropClass(row.page.id),
        ]"
        :style="{ paddingLeft: `${String(row.depth * 16 + 4)}px` }"
        @dragover="onDragOver($event, row)"
        @drop.prevent="onDrop"
      >
        <span
          draggable="true"
          class="flex size-6 shrink-0 cursor-grab items-center justify-center text-dimmed opacity-0 group-hover:opacity-100 active:cursor-grabbing"
          aria-hidden="true"
          @dragstart="dragging = row.page.id"
          @dragend="endDrag"
        >
          <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
        </span>
        <button
          v-if="row.hasChildren"
          type="button"
          class="flex size-5 shrink-0 items-center justify-center rounded-sm text-dimmed hover:text-highlighted"
          :aria-label="
            collapsed.has(row.page.id) ? `Expand ${row.page.title}` : `Collapse ${row.page.title}`
          "
          :aria-expanded="!collapsed.has(row.page.id)"
          @click="toggle(row.page.id)"
        >
          <UIcon
            :name="collapsed.has(row.page.id) ? 'i-lucide-chevron-right' : 'i-lucide-chevron-down'"
            class="size-3.5"
          />
        </button>
        <span v-else class="size-5 shrink-0" />
        <NuxtLink
          :to="`/admin/docs/${productId}/${row.page.id}`"
          class="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-sm"
          :class="row.page.id === activeId ? 'font-medium text-highlighted' : 'text-default'"
        >
          <span class="min-w-0 flex-1 truncate">{{ row.page.title }}</span>
          <span
            class="size-1.5 shrink-0 rounded-full"
            :class="row.page.status === 'published' ? 'bg-success' : 'border border-warning'"
            :title="row.page.status === 'published' ? 'Published' : 'Draft'"
          />
        </NuxtLink>
        <UDropdownMenu :items="menuFor(row)" :content="{ align: 'start' }">
          <UButton
            icon="i-lucide-ellipsis"
            size="xs"
            color="neutral"
            variant="ghost"
            :aria-label="`Actions for ${row.page.title}`"
            class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100"
          />
        </UDropdownMenu>
      </li>
    </ul>
    <p v-else class="p-4 text-sm text-muted">No pages yet. Create one or import a document.</p>
    <p class="border-t border-default px-4 py-2 text-xs text-dimmed">
      Drag pages to reorder them. Drop onto a page to nest it.
    </p>
  </nav>
</template>
