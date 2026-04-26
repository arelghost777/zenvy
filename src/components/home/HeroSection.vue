<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { eventService } from '@/services/eventService'
import { Loader2, Sparkles } from 'lucide-vue-next'
import type { Event } from '@/types/eventTypes'

const route = useRoute()
const events = ref<Event[]>([])
const isLoading = ref(true)

// Ces refs peuvent être liées à ton Header via un Store (Pinia) ou des Événements
const activeCategory = ref('Toutes')
const searchQuery = ref('')

const fetchEvents = async () => {
  isLoading.value = true
  try {
    events.value = await eventService.getPublicEvents({
      search: searchQuery.value,
      category: activeCategory.value
    })
  } catch (error) {
    console.error("Erreur de récupération:", error)
  } finally {
    isLoading.value = false
  }
}

// Relancer la recherche quand les filtres changent
watch([activeCategory, searchQuery], fetchEvents)

onMounted(() => {
  // Si on arrive avec un paramètre ?q= dans l'URL
  if (route.query.q) searchQuery.value = route.query.q as string
  fetchEvents()
})
</script>

<template>
  <main class="min-h-screen bg-[#EDF2F4]">
    <div class="max-w-7xl mx-auto px-6 py-12">
      <div class="flex items-center justify-between mb-10">
        <div>
          <h2 class="text-3xl font-black text-[#2B2D42] tracking-tighter">
            Annonces <span class="text-[#EF233C]">Récentes</span>
          </h2>
          <p class="text-[#8D99AE] font-medium text-sm mt-1">
            {{ events.length }} opportunités à ne pas manquer
          </p>
        </div>
        
        <div class="hidden md:flex items-center gap-2 text-xs font-black uppercase text-[#2B2D42]/40 tracking-widest">
          <Sparkles :size="16" class="text-[#EF233C]" />
          Trié par pertinence
        </div>
      </div>

      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24">
        <Loader2 class="animate-spin text-[#EF233C] size-12 mb-4" />
        <p class="text-[#2B2D42] font-bold animate-pulse">Recherche des meilleurs événements...</p>
      </div>

      <div v-else-if="events.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <div 
          v-for="event in events" 
          :key="event.id" 
          class="group bg-white rounded-[24px] overflow-hidden border border-[#2B2D42]/5 hover:shadow-2xl hover:shadow-[#2B2D42]/10 transition-all duration-500 cursor-pointer"
        >
          <div class="relative h-56 overflow-hidden">
            <img 
              :src="event.image_url || '/placeholder.jpg'" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-[#2B2D42]/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div class="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#2B2D42] uppercase tracking-widest shadow-sm">
              {{ event.category }}
            </div>
          </div>

          <div class="p-6">
            <div class="flex items-center gap-2 text-[#EF233C] text-[10px] font-black uppercase mb-3">
              <span>{{ new Date(event.dates[0]?.starts_at).toLocaleDateString() }}</span>
              <span class="size-1 bg-[#8D99AE]/30 rounded-full"></span>
              <span>{{ event.address || 'Online' }}</span>
            </div>

            <h3 class="text-lg font-bold text-[#2B2D42] leading-tight mb-4 group-hover:text-[#EF233C] transition-colors line-clamp-2">
              {{ event.title }}
            </h3>

            <div class="flex items-center justify-between pt-4 border-t border-[#EDF2F4]">
              <div>
                <p class="text-[9px] text-[#8D99AE] font-black uppercase tracking-tighter">À partir de</p>
                <p class="text-lg font-black text-[#2B2D42]">
                  {{ event.ticket_types?.[0]?.price || 0 }} <span class="text-xs">€</span>
                </p>
              </div>
              <button class="size-10 rounded-full bg-[#2B2D42] text-white flex items-center justify-center group-hover:bg-[#EF233C] transition-colors shadow-lg shadow-[#2B2D42]/20 group-hover:shadow-[#EF233C]/30">
                <PlusCircle :size="20" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-24 bg-white rounded-[32px] border-2 border-dashed border-[#8D99AE]/20">
        <div class="inline-flex size-16 items-center justify-center bg-[#EDF2F4] rounded-full mb-4">
          <Search :size="32" class="text-[#8D99AE]" />
        </div>
        <h3 class="text-xl font-bold text-[#2B2D42]">Aucun résultat pour cette recherche</h3>
        <p class="text-[#8D99AE] mt-2">Essayez de modifier vos filtres ou vos mots-clés.</p>
        <button @click="searchQuery = ''; activeCategory = 'Toutes'" class="mt-6 text-[#EF233C] font-black uppercase text-xs tracking-widest hover:underline">
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  </main>
</template>