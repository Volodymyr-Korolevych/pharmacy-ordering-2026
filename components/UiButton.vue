<template>
  <button
    :type="type"
    :disabled="disabled"
    class="rounded-xl px-4 py-2 text-sm font-medium transition
           disabled:cursor-not-allowed disabled:opacity-50
           border bg-white hover:bg-gray-50"
    :class="variantClass"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  type?: 'button' | 'submit'
  disabled?: boolean
  variant?: 'primary' | 'ghost' | 'danger'
}>()
defineEmits<{ (e: 'click'): void }>()

const variantClass = computed(() => {
  if (props.variant === 'primary') return 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700'
  if (props.variant === 'danger') return 'border-red-600 bg-red-600 text-white hover:bg-red-700 hover:border-red-700'
  return ''
})
</script>
