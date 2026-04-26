<script setup lang="ts">
import { eventService } from '@/services/eventService'
import { computed, onMounted, ref } from 'vue'
import {
  Calendar, MapPin, Ticket, MoreVertical, Plus, Search,
  Loader2, Globe, Tag, Pencil, Trash2, X, AlertTriangle, TicketCheck,
  CalendarCheck
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Badge }  from '@/components/ui/badge'
import type { EventType } from '@/types/eventTypes'

// ── Données ───────────────────────────────────────────────────────────────
const events      = ref<EventType[]>([])
const isLoading   = ref(true)
const searchQuery = ref('')

const loadEvents = async () => {
  try {
    events.value = await eventService.getUserEvents()
  } catch (error) {
    console.error('Erreur lors du chargement :', error)
  } finally {
    isLoading.value = false
  }
}

const filteredEvents = computed(() => {
  if (!searchQuery.value.trim()) return events.value
  const q = searchQuery.value.toLowerCase()
  return events.value.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.city?.toLowerCase().includes(q) ||
    e.category?.toLowerCase().includes(q)
  )
})

// ── Menu contextuel ───────────────────────────────────────────────────────
const openMenuId = ref<number | null>(null)
const toggleMenu = (id: number) => {
  openMenuId.value = openMenuId.value === id ? null : id
}
const closeAllMenus = () => { openMenuId.value = null }

// ── Modale de confirmation de suppression ─────────────────────────────────
const eventToDelete  = ref<EventType | null>(null)
const isDeleting     = ref(false)
const deleteError    = ref<string | null>(null)

const confirmDelete = (event: EventType) => {
  eventToDelete.value = event
  deleteError.value   = null
  closeAllMenus()
}

const cancelDelete = () => {
  eventToDelete.value = null
  deleteError.value   = null
}

const executeDelete = async () => {
  if (!eventToDelete.value) return
  isDeleting.value  = true
  deleteError.value = null
  try {
    await eventService.deleteEvent(eventToDelete.value.id)
    // Retirer l'événement de la liste localement (pas besoin de refetch)
    events.value      = events.value.filter(e => e.id !== eventToDelete.value!.id)
    eventToDelete.value = null
  } catch (err: any) {
    deleteError.value = err.message ?? 'Erreur lors de la suppression.'
  } finally {
    isDeleting.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const formatDate = (event: EventType): string => {
  const firstDate = event.dates?.find(d => d.starts_at)
  if (!firstDate?.starts_at) return 'Date non définie'
  return new Date(firstDate.starts_at).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
}

const getMinPrice = (event: EventType): string => {
  const prices = event.ticket_types
    ?.map(t => t.price)
    .filter((p): p is number => p !== undefined && p !== null)
  if (event.is_free || !prices || prices.length === 0) return 'Gratuit'
  return `${Math.min(...prices).toLocaleString('fr-FR')} ${event.currency || '€'}`
}

const statusConfig = (status: EventType['status']) => {
  switch (status) {
    case 'published': return { label: 'Publié',    class: 'bg-green-100 text-green-800'  }
    case 'draft':     return { label: 'Brouillon', class: 'bg-yellow-100 text-yellow-800' }
    case 'archived':  return { label: 'Archivé',   class: 'bg-gray-100 text-gray-600'    }
    default:          return { label: status,      class: 'bg-gray-100 text-gray-600'    }
  }
}

const getLocation = (event: EventType): string => {
  if (event.location_type === 'online') return 'Événement en ligne'
  return [event.address, event.city, event.country].filter(Boolean).join(', ') || 'Lieu non défini'
}

onMounted(loadEvents)
</script>

<template>
  <div class="space-y-8" @click="closeAllMenus">

    <!-- ── Header ── -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-primary/10 pb-6">
      <div>
        <h1 class="text-3xl font-bold text-primary tracking-tight">Mes événements</h1>
        <p class="text-primary mt-1">
          Vous gérez actuellement
          <span class="font-bold">{{ events.length }}</span>
          événement{{ events.length !== 1 ? 's' : '' }}.
        </p>
      </div>
      <Button as-child class="bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/20">
        <router-link to="/dashboard/create-event" class="flex items-center gap-2">
          <Plus :size="18" /> Créer un événement
        </router-link>
      </Button>
    </div>

    <!-- ── Recherche ── -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-primary size-4" />
        <Input
          v-model="searchQuery"
          placeholder="Rechercher un événement..."
          class="pl-10 border-primary/20 focus:border-danger"
        />
      </div>
    </div>

    <!-- ── Loader ── -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-20 text-primary">
      <Loader2 class="animate-spin size-10 mb-4 text-danger" />
      <p>Chargement de vos événements...</p>
    </div>

    <!-- ── Vide ── -->
    <div
      v-else-if="filteredEvents.length === 0"
      class="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-primary/20"
    >
      <div class="bg-background p-6 rounded-full mb-4 text-primary/40">
        <Calendar :size="48" />
      </div>
      <h3 class="text-xl font-bold text-primary">Aucun événement trouvé</h3>
      <p class="text-primary mb-6 text-center">
        {{ searchQuery ? 'Aucun résultat pour votre recherche.' : 'Commencez par créer votre premier événement.' }}
      </p>
      <Button v-if="!searchQuery" as-child variant="outline" class="border-danger text-danger hover:bg-danger/5 mt-3">
        <router-link to="/dashboard/create-event">Créer maintenant</router-link>
      </Button>
    </div>

    <!-- ── Grille ── -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="event in filteredEvents"
        :key="event.id"
        class="group bg-white rounded-2xl border border-primary/10 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      >
        <!-- Image -->
        <div class="relative h-48 bg-primary/5 overflow-hidden">
          <img
            v-if="event.image_url"
            :src="event.image_url"
            :alt="event.title"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-primary/10">
            <Calendar :size="64" />
          </div>

          <Badge class="absolute top-4 left-4 text-xs border-none" :class="statusConfig(event.status).class">
            {{ statusConfig(event.status).label }}
          </Badge>

          <!-- ── Menu contextuel ── -->
          <div class="absolute top-4 right-4" @click.stop>
            <button
              @click="toggleMenu(event.id)"
              class="p-2 bg-white/90 backdrop-blur rounded-full text-primary hover:text-danger transition-colors"
            >
              <MoreVertical :size="18" />
            </button>

            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 scale-95 -translate-y-1"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 -translate-y-1"
            >
              <div
                v-if="openMenuId === event.id"
                class="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-primary/10 shadow-xl overflow-hidden z-20"
              >
                <router-link
                  :to="`/dashboard/events/${event.id}/edit`"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors"
                  @click="closeAllMenus"
                >
                  <Pencil :size="14" class="text-primary/50" /> Modifier
                </router-link>
                <router-link
                  :to="`/events/${event.id}`"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-primary/5 transition-colors"
                  @click="closeAllMenus"
                >
                  <CalendarCheck :size="14" class="text-primary/50" /> Voir l'évenement
                </router-link>
                <button
                  @click="confirmDelete(event)"
                  class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/5 transition-colors border-t border-primary/5"
                >
                  <Trash2 :size="14" /> Supprimer
                </button>
              </div>
            </transition>
          </div>
        </div>

        <!-- Contenu -->
        <div class="p-5">
          <div class="flex items-center gap-2 text-xs font-bold text-danger uppercase tracking-wider mb-2">
            <Calendar :size="14" />
            {{ formatDate(event) }}
          </div>

          <h3 class="text-lg font-bold text-primary truncate group-hover:text-danger transition-colors">
            {{ event.title }}
          </h3>

          <div class="flex items-center gap-1 text-primary text-sm mt-1 mb-1">
            <Globe v-if="event.location_type === 'online'" :size="14" />
            <MapPin v-else :size="14" />
            <span class="truncate">{{ getLocation(event) }}</span>
          </div>

          <div v-if="event.category" class="flex items-center gap-1 text-primary/60 text-xs mb-4">
            <Tag :size="12" />
            <span>{{ event.category }}</span>
          </div>

          <!-- Tickets & Prix -->
          <div class="pt-4 border-t border-primary/5 flex items-start justify-between gap-2">
            <div class="flex flex-col min-w-0">
              <span class="text-[10px] uppercase text-primary font-bold tracking-tighter mb-1">Tickets</span>
              <div class="flex flex-wrap gap-1">
                <span
                  v-if="event.ticket_types?.length"
                  v-for="ticket in event.ticket_types"
                  :key="ticket.id"
                  class="flex items-center gap-1 text-xs text-primary bg-primary/5 rounded-full px-2 py-0.5"
                >
                  <Ticket :size="11" class="text-danger shrink-0" />
                  {{ ticket.name }}
                  <span v-if="ticket.quantity !== undefined" class="text-primary/50">({{ ticket.quantity }})</span>
                </span>
                <span v-else class="text-xs text-primary/40 italic">Aucun ticket</span>
              </div>
            </div>
            <div class="flex flex-col items-end shrink-0">
              <span class="text-[10px] uppercase text-primary font-bold tracking-tighter">Prix mini</span>
              <span class="font-bold text-primary text-sm">{{ getMinPrice(event) }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="grid grid-cols-2 gap-2 mt-5">
            <router-link :to="`/dashboard/events/${event.id}/edit`" class="w-full">
              <Button variant="outline" size="sm" class="w-full text-xs border-primary/20 hover:bg-background">
                <Pencil :size="13" class="mr-1" /> Modifier
              </Button>
            </router-link>
            <router-link :to="`/dashboard/events/${event.id}/impression-billets`" class="w-full">
              <Button size="sm" class="w-full text-xs bg-primary text-white">
                <TicketCheck :size="13" class="mr-1" /> Billets
              </Button>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- ══ Modale de confirmation ══════════════════════════════════════════ -->
    <teleport to="body">
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="eventToDelete"
          class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          @click.self="cancelDelete"
        >
          <transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
          >
            <div
              v-if="eventToDelete"
              class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5"
            >
              <!-- Icône + titre -->
              <div class="flex items-start gap-4">
                <div class="shrink-0 w-12 h-12 bg-danger/10 rounded-full flex items-center justify-center">
                  <Trash2 :size="22" class="text-danger" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-primary">Supprimer l'événement</h2>
                  <p class="text-sm text-primary/60 mt-1">
                    Cette action est <strong>irréversible</strong>. Les dates et billets associés seront également supprimés.
                  </p>
                </div>
              </div>

              <!-- Aperçu de l'événement ciblé -->
              <div class="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                <div class="w-12 h-12 rounded-lg overflow-hidden bg-primary/10 shrink-0">
                  <img
                    v-if="eventToDelete.image_url"
                    :src="eventToDelete.image_url"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <Calendar :size="20" class="text-primary/30" />
                  </div>
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-bold text-primary truncate">{{ eventToDelete.title }}</p>
                  <p class="text-xs text-primary/50">{{ formatDate(eventToDelete) }}</p>
                </div>
              </div>

              <!-- Avertissement -->
              <div class="flex items-center gap-2 p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-yellow-800 text-xs">
                <AlertTriangle :size="14" class="shrink-0" />
                Toutes les ventes et inscriptions liées à cet événement seront perdues.
              </div>

              <!-- Erreur éventuelle -->
              <p v-if="deleteError" class="text-xs text-danger bg-danger/5 px-3 py-2 rounded-lg border border-danger/20">
                {{ deleteError }}
              </p>

              <!-- Boutons -->
              <div class="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  class="flex-1 border-primary/20"
                  :disabled="isDeleting"
                  @click="cancelDelete"
                >
                  <X :size="15" class="mr-1" /> Annuler
                </Button>
                <Button
                  class="flex-1 bg-danger hover:bg-danger/90 text-white"
                  :disabled="isDeleting"
                  @click="executeDelete"
                >
                  <Loader2 v-if="isDeleting" :size="15" class="animate-spin mr-1" />
                  <Trash2 v-else :size="15" class="mr-1" />
                  {{ isDeleting ? 'Suppression...' : 'Supprimer' }}
                </Button>
              </div>
            </div>
          </transition>
        </div>
      </transition>
    </teleport>

  </div>
</template>

<style scoped>
.grid > div {
  animation: slideUp 0.4s ease-out forwards;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
}
</style>