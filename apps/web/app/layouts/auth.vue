<template>
  <div class="flex min-h-dvh flex-col items-center justify-center gap-6 bg-app px-4 py-12">
    <BrandMark class="text-lg" />
    <div class="w-full max-w-sm border border-default bg-default p-6 sm:p-8">
      <slot />
    </div>
  </div>
</template>
