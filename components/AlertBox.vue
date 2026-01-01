<template>
  <div v-if="text" class="rounded-xl border px-4 py-3 text-sm" :class="cls">
    {{ text }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ text: string; kind?: 'info' | 'error' | 'success' }>()
const cls = computed(() => {
  if (props.kind === 'error') return 'border-red-200 bg-red-50 text-red-800'
  if (props.kind === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return 'border-blue-200 bg-blue-50 text-blue-800'
})
</script>
