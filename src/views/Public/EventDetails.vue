<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { eventService } from '@/services/eventService'
import type { EventType } from '@/types/eventTypes'
import { 
  Calendar, MapPin, Share2, Info, CheckCircle, 
  Minus, Plus, Ticket, ChevronLeft, Loader2 
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const route = useRoute()
const event = ref<EventType | null>(null)
const isLoading = ref(true)
const selectedTickets = ref<Record<string, number>>({})

const fetchEvent = async () => {
  try {
    event.value = await eventService.getEventById(route.params.eventId as string)
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

// Calcul du total
const totalPrice = computed(() => {
  if (!event.value) return 0
  return event.value.ticket_types.reduce((acc, ticket) => {
    const qty = selectedTickets.value[ticket.id] || 0
    return acc + (ticket.price || 0 * qty)
  }, 0)
})

const updateQty = (id: string, delta: number) => {
  const current = selectedTickets.value[id] || 0
  const next = Math.max(0, current + delta)
  selectedTickets.value[id] = next
}

onMounted(fetchEvent)
</script>

<template>
  <div class="min-h-screen bg-[#EDF2F4] pb-20">
    <div v-if="isLoading" class="flex h-screen items-center justify-center">
      <Loader2 class="animate-spin text-[#EF233C] size-12" />
    </div>

    <div v-else-if="event" class="max-w-7xl mx-auto px-4 pt-8">
      <router-link to="/events" class="inline-flex items-center gap-2 text-[#8D99AE] hover:text-[#2B2D42] font-bold text-xs uppercase tracking-widest mb-6 transition-colors">
        <ChevronLeft :size="16" /> Retour aux événements
      </router-link>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div class="lg:col-span-8 space-y-8">
          <div class="relative h-[300px] md:h-[450px] rounded overflow-hidden shadow-2xl">
            <img :src="event.image_url || '/placeholder.jpg'" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-[#2B2D42]/80 via-transparent to-transparent"></div>
            <div class="absolute bottom-8 left-8 right-8 text-white">
              <Badge class="bg-[#EF233C] mb-4 border-none px-4 py-1">{{ event.category }}</Badge>
              <h1 class="text-3xl md:text-5xl font-black tracking-tighter">{{ event.title }}</h1>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-6 rounded border border-[#2B2D42]/5 flex items-start gap-4">
              <div class="p-3 bg-[#EF233C]/10 rounded text-[#EF233C]"><Calendar :size="24" /></div>
                <div>
                <p class="text-[10px] font-black uppercase text-[#8D99AE] mb-2">Dates & Horaires</p>
                
                <div class="space-y-3">
                    <div 
                    v-for="date in event.dates" 
                    :key="date.id" 
                    class="flex flex-col border-l-2 border-[#EF233C]/20 pl-3 py-0.5"
                    >
                    <p class="text-sm font-bold text-[#2B2D42] capitalize">
                        {{ new Date(date.starts_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) }}
                    </p>
                    
                    <p class="text-[11px] font-black text-[#EF233C] uppercase tracking-wider">
                        {{ new Date(date.starts_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}
                        <span v-if="date.ends_at" class="text-[#8D99AE] font-medium"> 
                        — {{ new Date(date.ends_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }} 
                        </span>
                    </p>
                    </div>
                </div>
                </div>
            </div>
            <div class="bg-white p-6 rounded border border-[#2B2D42]/5 flex items-start gap-4">
              <div class="p-3 bg-[#EF233C]/10 rounded text-[#EF233C]"><MapPin :size="24" /></div>
              <div>
                <p class="text-[10px] font-black uppercase text-[#8D99AE]">Lieu</p>
                <p class="text-sm font-bold text-[#2B2D42]">{{ event.address || 'Lieu à confirmer' }}</p>
              </div>
            </div>
            <div class="bg-white p-6 rounded border border-[#2B2D42]/5 flex items-start gap-4">
              <div class="p-3 bg-[#EF233C]/10 rounded text-[#EF233C]"><Share2 :size="24" /></div>
              <div>
                <p class="text-[10px] font-black uppercase text-[#8D99AE]">Partager</p>
                <p class="text-sm font-bold text-[#2B2D42]">Invitez vos amis</p>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded border border-[#2B2D42]/5">
            <h2 class="text-xl font-black text-[#2B2D42] mb-6 flex items-center gap-2">
              <Info :size="20" class="text-[#EF233C]" /> À propos de l'événement
            </h2>
            <div class="prose prose-slate max-w-none text-[#8D99AE] leading-relaxed font-medium" v-html="event.description"></div>
          </div>
        </div>

        <div class="lg:col-span-4">
          <div class="sticky top-8 space-y-6">
            <div class="bg-[#2B2D42] rounded p-8 text-white shadow-2xl relative overflow-hidden">
              <div class="absolute -top-10 -right-10 size-32 bg-[#EF233C]/20 blur-3xl rounded-full"></div>
              
              <h2 class="text-xl font-black mb-6 relative">Sélectionnez vos billets</h2>

              <div class="space-y-4 mb-8 relative">
                <div v-for="ticket in event.ticket_types" :key="ticket.id" 
                  class="bg-white/5 border border-white/10 rounded p-4 flex flex-col gap-3">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="font-bold text-sm">{{ ticket.name }}</h4>
                      <p class="text-[#EF233C] font-black text-lg">{{ ticket.price }} €</p>
                    </div>
                    <div class="flex items-center gap-3 bg-white/10 rounded-full p-1">
                      <button @click="updateQty(ticket.id.toString(), -1)" class="size-8 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                        <Minus :size="14" />
                      </button>
                      <span class="w-4 text-center font-bold">{{ selectedTickets[ticket.id] || 0 }}</span>
                      <button @click="updateQty(ticket.id.toString(), 1)" class="size-8 rounded-full flex items-center justify-center bg-[#EF233C] transition-colors">
                        <Plus :size="14" />
                      </button>
                    </div>
                  </div>
                  <p v-if="ticket.description" class="text-[10px] text-white/40 italic">{{ ticket.description }}</p>
                </div>
              </div>

              <div class="pt-6 border-t border-white/10 space-y-4">
                <div class="flex justify-between items-end">
                  <span class="text-xs font-bold uppercase text-white/40 tracking-widest">Total à payer</span>
                  <span class="text-3xl font-bold slashed-zero">{{ totalPrice }} {{ event.currency }}</span>
                </div>
                <Button :disabled="totalPrice === 0" 
                  class="w-full bg-[#EF233C] hover:bg-[#D90429] text-white py-8 rounded font-black text-lg shadow-lg shadow-[#EF233C]/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale">
                  Réserver maintenant
                </Button>
                <p class="text-[10px] text-center text-white/30 font-medium">Paiement sécurisé par EventTick</p>
              </div>
            </div>

            <div class="bg-white rounded p-6 border border-[#2B2D42]/5 flex items-center gap-4">
              <div class="size-12 bg-[#EDF2F4] rounded-full flex items-center justify-center text-[#2B2D42] font-black">
                {{ event.owner_id.substring(0, 2).toUpperCase() }}
              </div>
              <div class="flex-1">
                <p class="text-[10px] font-black uppercase text-[#8D99AE]">Organisé par</p>
                <h4 class="font-bold text-[#2B2D42]">{{ event.owner_name || "Inconue"}}</h4>
              </div>
              <CheckCircle :size="18" class="text-[#EF233C]" />
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.prose :deep(p) {
  margin-bottom: 1rem;
}
</style>