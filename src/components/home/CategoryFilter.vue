<script setup lang="ts">
defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const categories = [
  { label: 'Tous',       emoji: '🎫', bg: '#EEEDFE' },
  { label: 'Concert',    emoji: '🎵', bg: '#EEEDFE' },
  { label: 'Soirée',     emoji: '🍸', bg: '#FAECE7' },
  { label: 'Culture',    emoji: '🎨', bg: '#E6F1FB' },
  { label: 'Formation',  emoji: '🎓', bg: '#EAF3DE' },
  { label: 'Sport',      emoji: '⚽', bg: '#FAEEDA' },
  { label: 'Festival',   emoji: '⛺', bg: '#FBEAF0' },
  { label: 'Business',   emoji: '💼', bg: '#E1F5EE' },
  { label: 'Religieux',  emoji: '⛪', bg: '#FAECE7' },
  { label: 'Autre',      emoji: '✨', bg: '#F1EFE8' },
]
</script>

<template>
  <div>
    <p class="text-xs font-bold uppercase tracking-widest text-primary/40 mb-3">
      Explorer par catégorie
    </p>
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="cat in categories"
        :key="cat.label"
        @click="emit('update:modelValue', cat.label)"
        :class="[
          'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200',
          modelValue === cat.label
            ? 'border-[#AFA9EC] text-[#3C3489] bg-[#EEEDFE]'
            : 'border-primary/15 text-primary/70 bg-white hover:border-primary/30 hover:bg-primary/5'
        ]"
      >
        <span
          class="w-7 h-7 flex items-center justify-center rounded-full text-sm"
          :style="{ background: cat.bg }"
        >{{ cat.emoji }}</span>
        {{ cat.label }}
      </button>
    </div>
  </div>
</template>