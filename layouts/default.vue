<template>
  <div class="min-h-screen bg-gray-50 text-gray-900">
    <AppHeader />

    <main class="mx-auto max-w-6xl px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
// Header винесено в components/AppHeader.vue
</script>
