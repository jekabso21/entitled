<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const { data: user } = useCurrentUser()
const { data: branding } = useBranding()
const isMenuOpen = ref(false)

const isClientAdmin = computed(
  () => user.value?.memberships.some((membership) => membership.role === 'admin') ?? false,
)

const links = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Products',
    icon: 'i-lucide-cpu',
    to: '/',
    active: route.path === '/' || route.path.startsWith('/products'),
  },
  {
    label: 'Support',
    icon: 'i-lucide-life-buoy',
    to: '/support',
    active: route.path.startsWith('/support'),
  },
  ...(isClientAdmin.value
    ? [
        {
          label: 'Team',
          icon: 'i-lucide-users',
          to: '/account/team',
          active: route.path.startsWith('/account/team'),
        },
      ]
    : []),
])

watch(
  () => route.fullPath,
  () => (isMenuOpen.value = false),
)
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-app">
    <header class="sticky top-0 z-40 border-b border-default bg-default">
      <UContainer class="flex h-14 items-center gap-6">
        <NuxtLink to="/" class="shrink-0" aria-label="Home"><BrandMark /></NuxtLink>
        <nav class="hidden h-full items-stretch md:flex" aria-label="Main">
          <NuxtLink
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="flex items-center border-b-2 px-3 pt-0.5 text-sm font-medium transition-colors"
            :class="
              link.active
                ? 'border-primary text-highlighted'
                : 'border-transparent text-muted hover:border-accented hover:text-default'
            "
            :aria-current="link.active ? 'page' : undefined"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>
        <div class="ml-auto hidden md:block">
          <UserMenu />
        </div>
        <USlideover v-model:open="isMenuOpen" side="left" title="Menu" class="ml-auto md:hidden">
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            size="lg"
            square
            aria-label="Open menu"
          />
          <template #body>
            <div class="flex h-full flex-col gap-4">
              <UNavigationMenu
                :items="links"
                orientation="vertical"
                :ui="{ link: 'min-h-11 text-base' }"
              />
              <div class="mt-auto border-t border-default pt-4">
                <UserMenu />
              </div>
            </div>
          </template>
        </USlideover>
      </UContainer>
    </header>
    <main class="flex-1">
      <UContainer class="py-6 sm:py-8">
        <slot />
      </UContainer>
    </main>
    <footer class="border-t border-default">
      <UContainer
        class="flex h-14 flex-wrap items-center justify-between gap-x-6 text-[13px] text-dimmed"
      >
        <span>{{ branding.portalName }}</span>
        <nav class="flex gap-4" aria-label="Footer">
          <NuxtLink to="/" class="hover:text-default">Products</NuxtLink>
          <NuxtLink to="/support" class="hover:text-default">Support</NuxtLink>
        </nav>
      </UContainer>
    </footer>
  </div>
</template>
