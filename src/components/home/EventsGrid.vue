<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MapPin, Calendar, Ticket, Loader2, CalendarX } from 'lucide-vue-next'
import { eventService } from '@/services/eventService'
import type { Event } from '@/types/eventTypes'

const props = defineProps<{ category: string }>()
const router = useRouter()

const events    = ref<Event[]>([])
const isLoading = ref(true)

const load = async () => {
  try {
    events.value = await eventService.getUserEvents()
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

const filtered = computed(() => {
  const list = events.value.filter(e => e.status === 'published')
  if (props.category === 'Tous') return list
  return list.filter(e =>
    e.category?.toLowerCase() === props.category.toLowerCase()
  )
})

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (event: Event) => {
  const d = event.dates?.[0]?.starts_at
  if (!d) return 'Date à confirmer'
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
}

const getLocation = (event: Event) => {
  if (event.location_type === 'online') return 'En ligne'
  return [event.city, event.country].filter(Boolean).join(', ') || 'Lieu non défini'
}

const getMinPrice = (event: Event): string => {
  if (event.is_free) return 'Gratuit'
  const prices = event.ticket_types
    ?.map(t => t.price)
    .filter((p): p is number => p !== undefined)
  if (!prices?.length) return 'Voir billets'
  const min = Math.min(...prices)
  return `À partir de ${min.toLocaleString('fr-FR')} ${event.currency || '€'}`
}

const categoryEmoji: Record<string, string> = {
  Concert: '🎵', Soirée: '🍸', Culture: '🎨', Formation: '🎓',
  Sport: '⚽', Festival: '⛺', Business: '💼', Religieux: '⛪', Autre: '✨',
}
const categoryBg: Record<string, string> = {
  Concert: '#EEEDFE', Soirée: '#FAECE7', Culture: '#E6F1FB',
  Formation: '#EAF3DE', Sport: '#FAEEDA', Festival: '#FBEAF0',
  Business: '#E1F5EE', Religieux: '#FAECE7', Autre: '#F1EFE8',
}

onMounted(load)
</script>

<template>
  <div>
    <!-- Header rangée -->
    <div class="flex items-end justify-between mb-6">
      <div>
        <p class="text-xs font-bold uppercase tracking-widest text-primary/40 mb-1">Cette semaine</p>
        <h2 class="text-2xl font-bold text-primary tracking-tight">Événements à la une</h2>
      </div>
      <router-link
        to="/events"
        class="text-sm font-medium px-4 py-2 rounded-xl border border-[#AFA9EC] text-[#7F77DD] hover:bg-[#EEEDFE] transition-colors"
      >
        Voir tout →
      </router-link>
    </div>

    <!-- Loader -->
    <div v-if="isLoading" class="flex items-center justify-center py-24 text-primary/40">
      <Loader2 class="animate-spin size-8" />
    </div>

    <!-- Vide -->
    <div
      v-else-if="filtered.length === 0"
      class="flex flex-col items-center justify-center py-20 rounded-3xl border-2 border-dashed border-primary/15 bg-white"
    >
      <CalendarX :size="48" class="text-primary/20 mb-4" />
      <p class="text-primary/50 text-sm">Aucun événement dans cette catégorie.</p>
    </div>

    <!-- Grille -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      <article
        v-for="event in filtered"
        :key="event.id"
        class="group bg-white rounded-2xl border border-primary/10 overflow-hidden cursor-pointer
               hover:border-primary/30 hover:-translate-y-1 transition-all duration-200"
        @click="router.push(`/events/${event.id}`)"
      >
        <!-- Thumbnail -->
        <div class="relative h-40 overflow-hidden"
          :style="{ background: categoryBg[event.category] ?? '#EEEDFE' }"
        >
          <img
            v-if="event.image_url"
            :src="event.image_url"
            :alt="event.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-5xl select-none">
            {{ categoryEmoji[event.category] ?? '🎫' }}
          </div>

          <!-- Badge catégorie -->
          <span class="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider
                       bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
            {{ event.category || 'Événement' }}
          </span>
        </div>

        <!-- Corps -->
        <div class="p-4">
          <!-- Date -->
          <div class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider
                      text-[#7F77DD] mb-2">
            <Calendar :size="12" />
            {{ formatDate(event) }}
          </div>

          <!-- Titre -->
          <h3 class="text-sm font-bold text-primary leading-snug mb-2
                     group-hover:text-[#7F77DD] transition-colors line-clamp-2">
            {{ event.title }}
          </h3>

          <!-- Lieu -->
          <div class="flex items-center gap-1 text-xs text-primary/50 mb-4">
            <MapPin :size="12" />
            <span class="truncate">{{ getLocation(event) }}</span>
          </div>

          <!-- Footer prix + CTA -->
          <div class="flex items-center justify-between pt-3 border-t border-primary/5">
            <span
              :class="[
                'text-xs font-bold',
                event.is_free ? 'text-green-700' : 'text-primary'
              ]"
            >
              {{ getMinPrice(event) }}
            </span>
            <button
              class="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg
                     text-white transition-colors"
              style="background: #7F77DD;"
              @mouseenter="($event.target as HTMLElement).style.background='#534AB7'"
              @mouseleave="($event.target as HTMLElement).style.background='#7F77DD'"
              @click.stop="router.push(`/events/${event.id}`)"
            >
              <Ticket :size="12" />
              Billets
            </button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>