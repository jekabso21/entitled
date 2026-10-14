<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-8 bg-muted px-4 py-12">
    <BrandMark class="text-xl" />
    <UCard class="w-full max-w-sm">
      <slot />
    </UCard>
  </div>
</template>
