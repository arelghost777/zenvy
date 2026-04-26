<script setup lang="ts">
defineProps<{
  label: string
  value: string
}>()
</script>

<template>
  <div
    class="flex justify-between gap-4 py-1.5 border-b last:border-0 text-sm"
    style="border-color: #F3F4F6"
  >
    <span style="color: var(--color-danger); min-width: 100px">
      {{ label }}
    </span>

    <span
      class="text-right font-medium"
      style="color: var(--color-primary)"
    >
      {{ value }}
    </span>
  </div>
</template>