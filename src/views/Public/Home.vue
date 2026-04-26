<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import {
  Search, SlidersHorizontal, Users, Bell, Heart,
  Menu, User, MapPin, Globe, Facebook, Instagram, Linkedin,
  Music, Theater, GraduationCap, Wine, Mountain, Dumbbell,
  Tent, Atom, ChevronRight, Church, Briefcase, Tag, Utensils,
  Sparkles, Loader2, PlusCircle,
  LogIn, UserPlus, LogOut, LayoutDashboard,
  Ticket
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { eventService } from '@/services/eventService'
import { supabase } from '@/lib/clientSupabase'
import { useRoute, useRouter } from 'vue-router'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { EventType } from '@/types/eventTypes'

const route  = useRoute()
const router = useRouter()

// ── Auth ─────────────────────────────────────────────────────────────────────
const currentUser = ref<SupabaseUser | null>(null)
const menuOpen    = ref(false)
const menuRef     = ref<HTMLElement | null>(null)

supabase.auth.getUser().then(({ data }) => {
  currentUser.value = data.user
})
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser.value = session?.user ?? null
})

const logout = async () => {
  await supabase.auth.signOut()
  menuOpen.value = false
  router.push('/')
}

// Fermer le menu au clic extérieur
const handleOutsideClick = (e: MouseEvent) => {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', handleOutsideClick))

// ── Catégories ────────────────────────────────────────────────────────────────
const activeTab      = ref('events')
const activeCategory = ref('Toutes')

const categories = [
  { name: 'Toutes',      icon: Menu,          value: 'Toutes'      },
  { name: 'Concert',     icon: Music,         value: 'concert'     },
  { name: 'Culture',     icon: Theater,       value: 'culture'     },
  { name: 'Formation',   icon: GraduationCap, value: 'formation'   },
  { name: 'Soirée',      icon: Wine,          value: 'soiree'      },
  { name: 'Tourisme',    icon: Mountain,      value: 'tourisme'    },
  { name: 'Sport',       icon: Dumbbell,      value: 'sport'       },
  { name: 'Festival',    icon: Tent,          value: 'festival'    },
  { name: 'Science',     icon: Atom,          value: 'science'     },
  { name: 'Religieux',   icon: Church,        value: 'religieux'   },
  { name: 'Gastronomie', icon: Utensils,      value: 'gastronomie' },
  { name: 'Business',    icon: Briefcase,     value: 'business'    },
  { name: 'Autre',       icon: Tag,           value: 'autre'       },
]

// ── Événements ────────────────────────────────────────────────────────────────
const events      = ref<EventType[]>([])
const isLoading   = ref(true)
const searchQuery = ref('')

const fetchEvents = async () => {
  isLoading.value = true
  try {
    events.value = await eventService.getPublicEvents({
      search:   searchQuery.value,
      category: activeCategory.value,
    })
  } catch (error) {
    console.error('Erreur de récupération:', error)
  } finally {
    isLoading.value = false
  }
}

watch([activeCategory, searchQuery], fetchEvents)

onMounted(() => {
  if (route.query.q) searchQuery.value = route.query.q as string
  fetchEvents()
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (event: EventType): string => {
  const d = event.dates?.[0]?.starts_at
  if (!d) return 'Date à confirmer'
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
}

const getLocation = (event: EventType): string => {
  if (event.location_type === 'online') return 'En ligne'
  return [event.city, event.country].filter(Boolean).join(', ') || 'Lieu non défini'
}

const getMinPrice = (event: EventType): string => {
  if (event.is_free) return 'Gratuit'
  const prices = event.ticket_types
    ?.map(t => t.price)
    .filter((p): p is number => p !== undefined)
  if (!prices?.length) return '—'
  return `${Math.min(...prices).toLocaleString('fr-FR')} ${event.currency || '€'}`
}
</script>

<template>
  <!-- ══ HEADER ══════════════════════════════════════════════════════════════ -->
  <header class="w-full bg-[#EDF2F4] border-b border-[#2B2D42]/10">

    <!-- Barre supérieure -->
    <div class="hidden md:flex items-center justify-between px-6 py-2 border-b border-[#2B2D42]/5 text-[11px] font-bold text-[#8D99AE]">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-1 cursor-pointer hover:text-[#2B2D42] transition-colors">
          <MapPin :size="14" class="text-[#EF233C]" /> Bénin <span class="ml-0.5 opacity-50">▼</span>
        </div>
        <div class="flex items-center gap-1 cursor-pointer hover:text-[#2B2D42] transition-colors">
          <Globe :size="14" /> FR <span class="ml-0.5 opacity-50">▼</span>
        </div>
      </div>
      <div class="flex items-center gap-3 border-r border-[#2B2D42]/10 pr-6">
        <Facebook  :size="14" class="hover:text-[#EF233C] cursor-pointer transition-colors" />
        <Instagram :size="14" class="hover:text-[#EF233C] cursor-pointer transition-colors" />
        <Linkedin  :size="14" class="hover:text-[#EF233C] cursor-pointer transition-colors" />
      </div>
    </div>

    <!-- Barre principale -->
    <div class="flex items-center justify-between px-4 md:px-8 py-5 gap-4">

      <!-- Logo -->
      <div class="flex-shrink-0">
        <img src="/logo.png" alt="" width="100">
      </div>

      <!-- Recherche desktop -->
      <div class="flex flex-1 max-w-2xl relative">
        <Input
          v-model="searchQuery"
          placeholder="Rechercher un concert, une formation, un festival..."
          class="w-full bg-white border-[#2B2D42]/10 pr-12 py-6 rounded-full focus-visible:ring-[#EF233C]/20 shadow-sm placeholder:text-[#8D99AE]/60 text-[#2B2D42]"
          @keydown.enter="fetchEvents"
        />
        <button
          @click="fetchEvents"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#EF233C] hover:bg-[#D90429] rounded-full transition-all shadow-md active:scale-95"
        >
          <Search :size="18" class="text-white" />
        </button>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 md:gap-4">
        <Button
          as-child
          class="bg-[#EF233C] hover:bg-[#D90429] text-white rounded-full px-6 font-bold hidden sm:flex shadow-lg shadow-[#EF233C]/20 border-none transition-transform active:scale-95"
        >
          <router-link to="/dashboard/create-event">Publier un événement</router-link>
        </Button>

        <!-- <div class="flex items-center gap-1 md:gap-2 px-2">
          <button class="p-2.5 hover:bg-white rounded-full relative text-[#2B2D42] transition-colors">
            <Users :size="20" />
          </button>
          <button class="p-2.5 hover:bg-white rounded-full relative text-[#2B2D42] transition-colors">
            <Bell :size="20" />
            <span class="absolute top-1.5 right-1.5 size-4 bg-[#D90429] text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-[#EDF2F4]">4</span>
          </button>
          <button class="p-2.5 hover:bg-white rounded-full text-[#2B2D42] transition-colors">
            <Heart :size="20" />
          </button>
        </div> -->

        <!-- ── Menu utilisateur ─────────────────────────────────────────────── -->
        <div ref="menuRef" class="relative">
          <button
            @click.stop="menuOpen = !menuOpen"
            class="flex items-center gap-2 p-1.5 pl-3 bg-white border border-[#2B2D42]/10 rounded-full hover:shadow-md transition-all"
          >
            <Menu :size="18" class="text-[#2B2D42]" />
            <div class="size-8 bg-[#2B2D42] rounded-full flex items-center justify-center text-white overflow-hidden">
              <img
                v-if="currentUser?.user_metadata?.avatar_url"
                :src="currentUser.user_metadata.avatar_url"
                class="w-full h-full object-cover"
              />
              <User v-else :size="16" />
            </div>
          </button>

          <transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-1"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-1"
          >
            <div
              v-if="menuOpen"
              class="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl border border-[#2B2D42]/10 shadow-xl overflow-hidden z-50"
            >
              <!-- Connecté -->
              <template v-if="currentUser">
                <div class="px-4 py-3 border-b border-[#2B2D42]/5">
                  <p class="text-xs font-black text-[#2B2D42] truncate">
                    {{ currentUser.user_metadata?.full_name || 'Mon compte' }}
                  </p>
                  <p class="text-[11px] text-[#8D99AE] truncate">{{ currentUser.email }}</p>
                </div>
                <button
                  @click="router.push('/dashboard'); menuOpen = false"
                  class="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#2B2D42] hover:bg-[#EDF2F4] transition-colors font-medium"
                >
                  <LayoutDashboard :size="16" class="text-[#8D99AE]" />
                  Tableau de bord
                </button>
                <button
                  @click="logout"
                  class="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#EF233C] hover:bg-[#EF233C]/5 transition-colors font-medium border-t border-[#2B2D42]/5"
                >
                  <LogOut :size="16" />
                  Se déconnecter
                </button>
              </template>

              <!-- Non connecté -->
              <template v-else>
                <div class="px-4 py-3 border-b border-[#2B2D42]/5">
                  <p class="text-xs font-black text-[#2B2D42]">Bienvenue !</p>
                  <p class="text-[11px] text-[#8D99AE]">Connectez-vous pour continuer</p>
                </div>
                <button
                  @click="router.push('/login'); menuOpen = false"
                  class="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#2B2D42] hover:bg-[#EDF2F4] transition-colors font-medium"
                >
                  <LogIn :size="16" class="text-[#8D99AE]" />
                  Se connecter
                </button>
                <button
                  @click="router.push('/signUp'); menuOpen = false"
                  class="w-full flex items-center gap-3 px-4 py-3 text-sm text-white bg-[#EF233C] hover:bg-[#D90429] transition-colors font-bold"
                >
                  <UserPlus :size="16" />
                  S'inscrire
                </button>
              </template>
            </div>
          </transition>
        </div>
        <!-- ── fin menu utilisateur ── -->

      </div>
    </div>

    <!-- Onglets + Catégories -->
    <div class="flex flex-col items-center pb-8 space-y-8 mt-2">

      <!-- Onglets -->
      <div class="inline-flex p-1.5 bg-[#2B2D42]/5 rounded-full border border-[#2B2D42]/5">
        <button
          @click="activeTab = 'events'"
          :class="activeTab === 'events' ? 'bg-white text-[#2B2D42] shadow-sm' : 'text-[#8D99AE] hover:text-[#2B2D42]'"
          class="px-7 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all"
        >
          Événements
        </button>
        <button
          @click="activeTab = 'cotisations'"
          :class="activeTab === 'cotisations' ? 'bg-white text-[#2B2D42] shadow-sm' : 'text-[#8D99AE] hover:text-[#2B2D42]'"
          class="px-7 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
        >
          Cotisations
          <Badge class="bg-[#EF233C] text-white text-[8px] px-1.5 h-3.5 border-none font-bold">NEW</Badge>
        </button>
      </div>

      <!-- Filtres catégories -->
      <div class="w-full max-w-7xl px-6 relative">
        <div class="flex items-center gap-4 overflow-x-auto no-scrollbar p-4 justify-around w-full">
          <button
            v-for="cat in categories"
            :key="cat.value"
            @click="activeCategory = cat.value"
            :class="activeCategory === cat.value
              ? 'border-[#EF233C] bg-white text-[#EF233C] shadow-md scale-105'
              : 'border-transparent bg-white text-[#8D99AE] hover:border-[#2B2D42]/20 hover:text-[#2B2D42] shadow-sm'"
            class="flex flex-col items-center justify-center min-w-[110px] py-2 border-2 transition-all duration-300 space-y-3 group"
          >
            <component
              :is="cat.icon"
              :size="24"
              :class="activeCategory === cat.value ? 'text-[#EF233C]' : 'text-[#8D99AE] group-hover:text-[#EF233C]'"
            />
            <span class="text-[11px] font-black uppercase tracking-tighter">{{ cat.name }}</span>
          </button>
        </div>

        <button class="absolute -right-2 top-1/2 -translate-y-1/2 size-12 bg-white rounded-full flex items-center justify-center border border-[#2B2D42]/10 hover:bg-[#EDF2F4] transition-all shadow-xl z-10">
          <ChevronRight :size="20" class="text-[#2B2D42]" />
        </button>
      </div>
    </div>
  </header>

  <!-- ══ MAIN ════════════════════════════════════════════════════════════════ -->
  <main class="min-h-screen bg-[#EDF2F4]">
    <div class="max-w-7xl mx-auto px-6 py-12">

      <!-- Titre section -->
      <div class="flex items-center justify-between mb-10">
        <div>
          <h2 class="text-3xl font-black text-[#2B2D42] tracking-tighter">
            <template v-if="searchQuery">
              Résultats pour "<span class="text-[#EF233C]">{{ searchQuery }}</span>"
            </template>
            <template v-else-if="activeCategory !== 'Toutes'">
              Catégorie : <span class="text-[#EF233C]">{{ categories.find(c => c.value === activeCategory)?.name }}</span>
            </template>
            <template v-else>
              Annonces <span class="text-[#EF233C]">Récentes</span>
            </template>
          </h2>
          <p class="text-[#8D99AE] font-medium text-sm mt-1">
            {{ isLoading
              ? 'Recherche en cours...'
              : `${events.length} événement${events.length !== 1 ? 's' : ''} trouvé${events.length !== 1 ? 's' : ''}` }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-2 text-xs font-black uppercase text-[#2B2D42]/40 tracking-widest">
          <Sparkles :size="16" class="text-[#EF233C]" />
          Trié par pertinence
        </div>
      </div>

      <!-- Loader -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24">
        <Loader2 class="animate-spin text-[#EF233C] size-12 mb-4" />
        <p class="text-[#2B2D42] font-bold animate-pulse">Recherche des meilleurs événements...</p>
      </div>

      <!-- Grille -->
      <div
        v-else-if="events.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
      >
        <router-link
        v-for="event in events"
        :key="event.id"
        :to="`/events/${event.id}`"
        class="group bg-white rounde overflow-hidden border border-[#2B2D42]/5 hover:border-[#EF233C]/20 hover:shadow-[0_20px_50px_rgba(43,45,66,0.1)] transition-all duration-500 cursor-pointer flex flex-col hover:-translate-y-2"
      >
        <div class="relative h-52 overflow-hidden bg-[#EDF2F4]">
          <img
            v-if="event.image_url"
            :src="event.image_url"
            :alt="event.title"
            class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />
          <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#EDF2F4] to-[#8D99AE]/10">
            <Ticket class="text-[#8D99AE]/30" :size="48" stroke-width="1" />
          </div>

          <div class="absolute inset-0 bg-gradient-to-t from-[#2B2D42]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div class="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-[#2B2D42] uppercase tracking-[0.15em] shadow-sm border border-white/20">
            {{ event.category || 'Événement' }}
          </div>
        </div>

        <div class="p-6 flex flex-col flex-1">
          <div class="flex items-center gap-2 text-[#EF233C] text-[10px] font-black uppercase mb-3">
            <span class="tracking-wider">{{ formatDate(event) }}</span>
            <span class="size-1 bg-[#8D99AE]/30 rounded-full shrink-0" />
            <span class="truncate tracking-wider opacity-80">{{ getLocation(event) }}</span>
          </div>

          <h3 class="text-lg font-bold text-[#2B2D42] leading-tight mb-1 group-hover:text-[#EF233C] transition-colors line-clamp-2">
            {{ event.title }}
          </h3>

          <p class="text-[11px] text-[#8D99AE] font-medium mb-6">
            Par <span class="text-[#2B2D42] font-bold">{{ event.owner_name || "Inconnue" }}</span>
          </p>

          <div class="mt-auto pt-4 border-t border-[#EDF2F4] flex items-center justify-between">
            <div>
              <p class="text-[9px] text-[#8D99AE] font-black uppercase tracking-[0.1em] mb-0.5">Tarif</p>
              <p class="text-base font-black tracking-tight" :class="event.is_free ? 'text-green-600' : 'text-[#2B2D42]'">
                {{ event.is_free ? 'GRATUIT' : getMinPrice(event) }}
              </p>
            </div>

            <div class="size-10 rounded-xl bg-[#EDF2F4] text-[#2B2D42] flex items-center justify-center group-hover:bg-[#EF233C] group-hover:text-white group-hover:rotate-90 transition-all duration-500 shadow-sm">
              <PlusCircle :size="20" stroke-width="2.5" />
            </div>
          </div>
        </div>
        </router-link>
      </div>

      <!-- État vide -->
      <div v-else class="text-center py-24 bg-white rounded-[32px] border-2 border-dashed border-[#8D99AE]/20">
        <div class="inline-flex size-16 items-center justify-center bg-[#EDF2F4] rounded-full mb-4">
          <Search :size="32" class="text-[#8D99AE]" />
        </div>
        <h3 class="text-xl font-bold text-[#2B2D42]">Aucun résultat</h3>
        <p class="text-[#8D99AE] mt-2">
          {{ searchQuery
            ? `Aucun événement ne correspond à "${searchQuery}".`
            : `Aucun événement dans cette catégorie.` }}
        </p>
        <button
          @click="searchQuery = ''; activeCategory = 'Toutes'"
          class="mt-6 text-[#EF233C] font-black uppercase text-xs tracking-widest hover:underline"
        >
          Réinitialiser les filtres
        </button>
      </div>

    </div>
  </main>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
button { -webkit-tap-highlight-color: transparent; }
</style>