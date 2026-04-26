<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus, TrendingUp, Ticket, CalendarDays, ArrowUpRight,
  ArrowRight, Eye, Users, BarChart3, Zap, Clock,
  CheckCircle2, AlertCircle, Archive, Globe, MapPin,
  ChevronRight, LayoutDashboard
} from 'lucide-vue-next'
import { eventService } from '@/services/eventService'
import { supabase } from '@/lib/clientSupabase'
import type { EventType } from '@/types/eventTypes'
import type { User } from '@supabase/supabase-js'

const router      = useRouter()
const events      = ref<EventType[]>([])
const isLoading   = ref(true)
const currentUser = ref<User | null>(null)

// ── Chargement ────────────────────────────────────────────────────────────
onMounted(async () => {
  const [{ data }, evts] = await Promise.all([
    supabase.auth.getUser(),
    eventService.getUserEvents().catch(() => [] as EventType[]),
  ])
  currentUser.value = data.user
  events.value      = evts
  isLoading.value   = false
})

// ── Stats calculées depuis les vrais événements ───────────────────────────
const totalEvents     = computed(() => events.value.length)
const publishedEvents = computed(() => events.value.filter(e => e.status === 'published').length)
const draftEvents     = computed(() => events.value.filter(e => e.status === 'draft').length)
const archivedEvents  = computed(() => events.value.filter(e => e.status === 'archived').length)

const totalTickets = computed(() =>
  events.value.reduce((sum, e) =>
    sum + (e.ticket_types?.reduce((s, t) => s + (t.quantity ?? 0), 0) ?? 0), 0)
)

const totalRevenuePotential = computed(() => {
  return events.value.reduce((sum, e) => {
    if (e.is_free) return sum
    return sum + (e.ticket_types?.reduce((s, t) =>
      s + ((t.price ?? 0) * (t.quantity ?? 0)), 0) ?? 0)
  }, 0)
})

const recentEvents = computed(() =>
  [...events.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
)

// Répartition par catégorie
const categoryStats = computed(() => {
  const map: Record<string, number> = {}
  events.value.forEach(e => {
    if (e.category) map[e.category] = (map[e.category] ?? 0) + 1
  })
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count, pct: Math.round((count / totalEvents.value) * 100) }))
})

// ── Helpers ───────────────────────────────────────────────────────────────
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
})

const firstName = computed(() => {
  const name = currentUser.value?.user_metadata?.full_name ?? currentUser.value?.email ?? ''
  return name.split(/[ @]/)[0]
})

const today = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
})

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const formatCurrency = (n: number) =>
  n.toLocaleString('fr-FR') + ' XOF'

const statusMeta = (s: EventType['status']) => ({
  published: { label: 'Publié',    dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50'   },
  draft:     { label: 'Brouillon', dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50'     },
  archived:  { label: 'Archivé',   dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-100'    },
}[s] ?? { label: s, dot: 'bg-slate-300', text: 'text-slate-500', bg: 'bg-slate-50' })

const getFirstDate = (e: EventType) => {
  const d = e.dates?.[0]?.starts_at
  return d ? formatDate(d) : '—'
}

const getMinPrice = (e: EventType) => {
  if (e.is_free) return 'Gratuit'
  const ps = e.ticket_types?.map(t => t.price).filter((p): p is number => p != null)
  if (!ps?.length) return '—'
  return formatCurrency(Math.min(...ps))
}

// Couleurs par catégorie
const CAT_COLORS: Record<string, string> = {
  concert: '#EF233C', festival: '#F59E0B', culture: '#6366F1',
  formation: '#10B981', sport: '#3B82F6', soiree: '#EC4899',
  business: '#8B5CF6', religieux: '#F97316', gastronomie: '#14B8A6', autre: '#94A3B8',
}
const catColor = (name: string) => CAT_COLORS[name] ?? '#94A3B8'
</script>

<template>
  <div class="min-h-screen font-sans">

    <!-- ══ LOADER ══ -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="flex flex-col items-center gap-4">
        <div class="w-10 h-10 border-4 border-[#EF233C]/20 border-t-[#EF233C] rounded-full animate-spin" />
        <p class="text-sm text-slate-400 font-medium tracking-wide">Chargement du tableau de bord…</p>
      </div>
    </div>

    <div v-else class="max-w-[1400px] mx-auto px-6 py-10 space-y-8">

      <!-- ══ HEADER ══════════════════════════════════════════════════════ -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
            <LayoutDashboard :size="13" />
            <span>Tableau de bord</span>
          </div>
          <h3 class="text-3xl font-bold text-slate-900 tracking-tight">
            {{ greeting }}, <span class="text-[#EF233C]">{{ firstName }}</span> 👋
          </h3>
          <p class="text-sm text-slate-400 mt-1 capitalize">{{ today }}</p>
        </div>
        <div class="flex items-center gap-3">
          <router-link
            to='/dashboard/events'
            class="flex items-center gap-2 px-4 py-2.5 rounded border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white hover:shadow-sm transition-all"
          >
            <Eye :size="15" /> Mes événements
          </router-link>
          <router-link
            to='/dashboard/create-event'
            class="flex items-center gap-2 px-5 py-2.5 rounded bg-[#EF233C] hover:bg-[#D90429] text-white text-sm font-bold shadow-lg shadow-[#EF233C]/25 transition-all active:scale-95"
          >
            <Plus :size="16" /> Créer un événement
          </router-link>
        </div>
      </div>

      <!-- ══ KPI CARDS ════════════════════════════════════════════════════ -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">

        <!-- Événements -->
        <div class="bg-white rounded border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-[#EF233C]/10 rounded flex items-center justify-center">
              <CalendarDays :size="19" class="text-[#EF233C]" />
            </div>
            <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp :size="11" /> Actif
            </span>
          </div>
          <p class="text-3xl font-bold text-slate-900">{{ totalEvents }}</p>
          <p class="text-xs text-slate-400 font-medium mt-1">Événements créés</p>
          <div class="flex gap-2 mt-3 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-400">
            <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>{{ publishedEvents }} publiés</span>
            <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span>{{ draftEvents }} brouillons</span>
          </div>
        </div>

        <!-- Tickets -->
        <div class="bg-white rounded border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-violet-50 rounded flex items-center justify-center">
              <Ticket :size="19" class="text-violet-600" />
            </div>
            <ArrowUpRight :size="16" class="text-slate-300" />
          </div>
          <p class="text-3xl font-bold text-slate-900">{{ totalTickets.toLocaleString('fr-FR') }}</p>
          <p class="text-xs text-slate-400 font-medium mt-1">Places disponibles</p>
          <div class="mt-3 pt-3 border-t border-slate-50">
            <div class="w-full bg-slate-100 rounded-full h-1.5">
              <div class="bg-violet-500 h-1.5 rounded-full" style="width: 68%" />
            </div>
            <p class="text-[10px] text-slate-400 font-bold mt-1">Capacité totale configurée</p>
          </div>
        </div>

        <!-- Revenu potentiel -->
        <div class="bg-slate-900 rounded p-5 shadow-sm hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-white/10 rounded flex items-center justify-center">
              <BarChart3 :size="19" class="text-white" />
            </div>
            <span class="text-[10px] font-bold text-white/40 uppercase tracking-widest">Potentiel</span>
          </div>
          <p class="text-2xl font-bold text-white leading-tight">
            {{ totalRevenuePotential > 0 ? formatCurrency(totalRevenuePotential) : '—' }}
          </p>
          <p class="text-xs text-white/40 font-medium mt-1">Revenus potentiels</p>
          <div class="mt-3 pt-3 border-t border-white/10 text-[10px] font-bold text-white/30">
            Basé sur le prix × stock de chaque ticket
          </div>
        </div>

        <!-- Visibilité -->
        <div class="bg-white rounded border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 bg-blue-50 rounded flex items-center justify-center">
              <Globe :size="19" class="text-blue-500" />
            </div>
            <ArrowUpRight :size="16" class="text-slate-300" />
          </div>
          <p class="text-3xl font-bold text-slate-900">{{ publishedEvents }}</p>
          <p class="text-xs text-slate-400 font-medium mt-1">Événements publics</p>
          <div class="flex gap-2 mt-3 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-400">
            <span class="flex items-center gap-1"><Archive :size="11" />{{ archivedEvents }} archivés</span>
            <span class="flex items-center gap-1"><Zap :size="11" class="text-[#EF233C]" />{{ draftEvents }} en attente</span>
          </div>
        </div>
      </div>

      <!-- ══ CONTENU PRINCIPAL ════════════════════════════════════════════ -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Colonne gauche (2/3) -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Événements récents -->
          <div class="bg-white rounded border border-slate-100 shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-50">
              <div>
                <h2 class="text-sm font-bold text-slate-900 tracking-tight">Événements récents</h2>
                <p class="text-xs text-slate-400 mt-0.5">Vos {{ recentEvents.length }} derniers événements</p>
              </div>
              <button
                @click="router.push('/dashboard/events')"
                class="flex items-center gap-1.5 text-xs font-bold text-[#EF233C] hover:underline"
              >
                Voir tout <ChevronRight :size="13" />
              </button>
            </div>

            <!-- Vide -->
            <div v-if="recentEvents.length === 0" class="py-16 flex flex-col items-center text-center">
              <div class="w-14 h-14 bg-slate-50 rounded flex items-center justify-center mb-3">
                <CalendarDays :size="24" class="text-slate-300" />
              </div>
              <p class="text-sm font-bold text-slate-400">Aucun événement créé</p>
              <button
                @click="router.push('/dashboard/create-event')"
                class="mt-4 text-xs text-[#EF233C] font-bold underline underline-offset-2"
              >
                Créer mon premier événement
              </button>
            </div>

            <!-- Liste -->
            <div v-else class="divide-y divide-slate-50">
              <div
                v-for="event in recentEvents"
                :key="event.id"
                class="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer group"
                @click="router.push(`/dashboard/events/${event.id}/edit`)"
              >
                <!-- Thumbnail -->
                <div class="w-12 h-12 rounded overflow-hidden bg-slate-100 shrink-0">
                  <img
                    v-if="event.image_url"
                    :src="event.image_url"
                    :alt="event.title"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-xl">🎫</div>
                </div>

                <!-- Infos -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-slate-800 truncate group-hover:text-[#EF233C] transition-colors">
                    {{ event.title }}
                  </p>
                  <div class="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 font-medium">
                    <span class="flex items-center gap-1">
                      <Clock :size="11" /> {{ getFirstDate(event) }}
                    </span>
                    <span class="flex items-center gap-1">
                      <MapPin v-if="event.location_type === 'in-person'" :size="11" />
                      <Globe v-else :size="11" />
                      {{ event.location_type === 'online' ? 'En ligne' : (event.city || event.country || 'Lieu non défini') }}
                    </span>
                  </div>
                </div>

                <!-- Statut -->
                <div class="flex flex-col items-end gap-1.5 shrink-0">
                  <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1', statusMeta(event.status).bg, statusMeta(event.status).text]">
                    <span :class="['w-1.5 h-1.5 rounded-full', statusMeta(event.status).dot]" />
                    {{ statusMeta(event.status).label }}
                  </span>
                  <span class="text-[11px] font-bold text-slate-500">{{ getMinPrice(event) }}</span>
                </div>

                <ChevronRight :size="15" class="text-slate-300 group-hover:text-[#EF233C] transition-colors shrink-0" />
              </div>
            </div>
          </div>

          <!-- Statut de santé des événements -->
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="item in [
                { label: 'Publiés',    count: publishedEvents, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-400' },
                { label: 'Brouillons', count: draftEvents,     icon: AlertCircle,  color: 'text-amber-600',  bg: 'bg-amber-50',  bar: 'bg-amber-400'   },
                { label: 'Archivés',   count: archivedEvents,  icon: Archive,      color: 'text-slate-500',  bg: 'bg-slate-100', bar: 'bg-slate-300'   },
              ]"
              :key="item.label"
              class="bg-white rounded border border-slate-100 p-5 shadow-sm"
            >
              <div :class="['w-9 h-9 rounded flex items-center justify-center mb-3', item.bg]">
                <component :is="item.icon" :size="17" :class="item.color" />
              </div>
              <p class="text-2xl font-bold text-slate-900">{{ item.count }}</p>
              <p class="text-xs text-slate-400 font-medium mt-0.5">{{ item.label }}</p>
              <div class="mt-3 w-full bg-slate-100 rounded-full h-1">
                <div
                  :class="['h-1 rounded-full transition-all', item.bar]"
                  :style="{ width: totalEvents > 0 ? `${Math.round((item.count / totalEvents) * 100)}%` : '0%' }"
                />
              </div>
              <p class="text-[10px] text-slate-400 mt-1 font-bold">
                {{ totalEvents > 0 ? Math.round((item.count / totalEvents) * 100) : 0 }}% du total
              </p>
            </div>
          </div>
        </div>

        <!-- Colonne droite (1/3) -->
        <div class="space-y-6">

          <!-- Actions rapides -->
          <div class="bg-slate-900 rounded p-5 shadow-sm">
            <h2 class="text-sm font-bold text-white tracking-tight mb-4">Actions rapides</h2>
            <div class="space-y-2">
              <router-link
                to='/dashboard/create-event'
                class="w-full flex items-center gap-3 px-4 py-3 bg-[#EF233C] hover:bg-[#D90429] rounded text-white text-sm font-bold transition-all active:scale-95"
              >
                <Plus :size="16" />
                Créer un événement
                <ArrowRight :size="14" class="ml-auto" />
              </router-link>
              <router-link
            to='/dashboard/events'
                class="w-full flex items-center gap-3 px-4 py-3 bg-white/8 hover:bg-white/12 rounded text-white/80 text-sm font-semibold transition-all"
                style="background: rgba(255,255,255,0.07)"
              >
                <CalendarDays :size="16" />
                Gérer mes événements
                <ArrowRight :size="14" class="ml-auto opacity-40" />
              </router-link>
              <router-link
                to='/'
                class="w-full flex items-center gap-3 px-4 py-3 bg-white/8 hover:bg-white/12 rounded text-white/80 text-sm font-semibold transition-all"
                style="background: rgba(255,255,255,0.07)"
              >
                <Eye :size="16" />
                Voir la page publique
                <ArrowRight :size="14" class="ml-auto opacity-40" />
              </router-link>
            </div>
          </div>

          <!-- Catégories -->
          <div class="bg-white rounded border border-slate-100 p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900 tracking-tight mb-4">Répartition par catégorie</h2>

            <div v-if="categoryStats.length === 0" class="py-8 text-center">
              <p class="text-xs text-slate-400">Aucune catégorie à afficher</p>
            </div>

            <div v-else class="space-y-3">
              <div v-for="cat in categoryStats" :key="cat.name">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <span
                      class="w-2 h-2 rounded-full shrink-0"
                      :style="{ background: catColor(cat.name) }"
                    />
                    <span class="text-xs font-semibold text-slate-700 capitalize">{{ cat.name }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-500">{{ cat.count }}</span>
                    <span class="text-[10px] text-slate-400">{{ cat.pct }}%</span>
                  </div>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    class="h-1.5 rounded-full transition-all duration-700"
                    :style="{ width: `${cat.pct}%`, background: catColor(cat.name) }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Ticket types overview -->
          <div class="bg-white rounded border border-slate-100 p-5 shadow-sm">
            <h2 class="text-sm font-bold text-slate-900 tracking-tight mb-1">Types de tickets</h2>
            <p class="text-xs text-slate-400 mb-4">Stock total configuré</p>

            <div v-if="totalTickets === 0" class="py-6 text-center">
              <Ticket :size="28" class="text-slate-200 mx-auto mb-2" />
              <p class="text-xs text-slate-400">Aucun ticket configuré</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="event in recentEvents.filter(e => e.ticket_types?.length)"
                :key="event.id"
                class="rounded bg-slate-50 p-3"
              >
                <p class="text-xs font-bold text-slate-700 truncate mb-2">{{ event.title }}</p>
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="t in event.ticket_types"
                    :key="t.id"
                    class="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-full"
                  >
                    {{ t.name }} · {{ t.quantity ?? 0 }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Statut compte -->
          <div class="bg-gradient-to-br from-[#EF233C] to-[#D90429] rounded p-5 text-white shadow-lg shadow-[#EF233C]/20">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-bold">
                {{ firstName.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-bold leading-none">{{ firstName }}</p>
                <p class="text-[11px] text-white/70 mt-0.5 truncate max-w-[150px]">{{ currentUser?.email }}</p>
              </div>
            </div>
            <div class="border-t border-white/20 pt-3 mt-3 grid grid-cols-2 gap-2 text-center">
              <div>
                <p class="text-xl font-bold">{{ totalEvents }}</p>
                <p class="text-[10px] text-white/60 font-semibold">Événements</p>
              </div>
              <div>
                <p class="text-xl font-bold">{{ publishedEvents }}</p>
                <p class="text-[10px] text-white/60 font-semibold">Publiés</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ══ FOOTER ══ -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-300 font-medium">
        <span>Données en temps réel · Supabase</span>
        <span>TIKERAMA Dashboard · {{ new Date().getFullYear() }}</span>
      </div>

    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; }

.divide-y > * + * {
  border-top-width: 1px;
}
</style>