<script setup lang="ts">
import { eventService } from '@/services/eventService'
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft, Save, Loader2, AlertCircle, CheckCircle2,
  Calendar, MapPin, Globe, Ticket, Image as ImageIcon,
  Plus, Trash2, Clock, DollarSign, Tag, Eye, EyeOff, Info
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Badge }  from '@/components/ui/badge'
import type { EventType } from '@/types/eventTypes'
import { useEventStore } from '@/stores/useEventStore'
import { storeToRefs } from 'pinia'

// ─── Référentiels ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'concert',     label: 'Concert'     },
  { value: 'culture',     label: 'Culture'     },
  { value: 'formation',   label: 'Formation'   },
  { value: 'soiree',      label: 'Soirée'      },
  { value: 'tourisme',    label: 'Tourisme'    },
  { value: 'sport',       label: 'Sport'       },
  { value: 'festival',    label: 'Festival'    },
  { value: 'science',     label: 'Science'     },
  { value: 'religieux',   label: 'Religieux'   },
  { value: 'gastronomie', label: 'Gastronomie' },
  { value: 'business',    label: 'Business'    },
  { value: 'autre',       label: 'Autre'       },
]

const TIMEZONES = [
  { value: 'Africa/Abidjan',   label: 'UTC +0 — Abidjan / Dakar'    },
  { value: 'Africa/Lagos',     label: 'UTC +1 — Lagos / Cotonou'    },
  { value: 'Africa/Nairobi',   label: 'UTC +3 — Nairobi'            },
  { value: 'Europe/Paris',     label: 'UTC +1/+2 — Paris'           },
  { value: 'UTC',              label: 'UTC +0'                       },
  { value: 'America/New_York', label: 'UTC -5/-4 — New York'        },
]

const CURRENCIES = [
  { value: 'xof', label: 'Franc CFA (XOF)' },
  { value: 'xaf', label: 'Franc CFA (XAF)' },
  { value: 'gnf', label: 'Franc guinéen (GNF)' },
  { value: 'eur', label: 'Euro (€)' },
]

// ─── Router ────────────────────────────────────────────────────────────────
const route   = useRoute()
const router  = useRouter()
const eventId = String(route.params.id)  // getEventById attend un string

// ─── State ─────────────────────────────────────────────────────────────────
const isLoading   = ref(true)
const isSaving    = ref(false)
const saveError   = ref<string | null>(null)
const saveSuccess = ref(false)
const activeTab   = ref<'general' | 'dates' | 'tickets'>('general')
const imageFile        = ref<File | null>(null)
const imagePreviewUrl  = ref<string | null>(null)  // aperçu local (avant upload)
const isUploadingImage = ref(false)

// ─── Form model ────────────────────────────────────────────────────────────
const form = ref<Omit<EventType, 'id' | 'created_at' | 'updated_at'>>({
  title:         '',
  description:   '',
  category:      '',
  visibility:    'public',
  image_url:     null,
  location_type: 'in-person',
  country:       '',
  city:          '',
  address:       '',
  timezone:      'Africa/Lagos',
  is_free:       false,
  currency:      'XOF',
  status:        'draft',
  owner_id:      '',
  owner_name:    '',
  dates:         [],
  ticket_types:  [],
})

const store  = useEventStore()


// ─── Chargement via getEventById ───────────────────────────────────────────
const loadEvent = async () => {
  try {
    const event = await eventService.getEventById(eventId)
    if (!event) throw new Error('Événement introuvable')
    // On exclut les champs auto-gérés par Supabase
    const { id, created_at, updated_at, ...rest } = event as any
    form.value = JSON.parse(JSON.stringify(rest))
  } catch (err: any) {
    saveError.value = err.message ?? 'Erreur de chargement'
  } finally {
    isLoading.value = false
  }
}

// ─── Onglets ───────────────────────────────────────────────────────────────
const tabs = [
  { key: 'general', label: 'Général', icon: Tag      },
  { key: 'dates',   label: 'Dates',   icon: Calendar },
  { key: 'tickets', label: 'Tickets', icon: Ticket   },
] as const

// ─── Dates ─────────────────────────────────────────────────────────────────
let nextDateId = -1
const addDate = () => {
  form.value.dates.push({ id: nextDateId--, starts_at: '', ends_at: '' })
}
const removeDate = (index: number) => form.value.dates.splice(index, 1)

const toDatetimeLocal = (iso: string) => iso ? iso.substring(0, 16) : ''
const fromDatetimeLocal = (val: string) => val ? new Date(val).toISOString() : ''

// ─── Tickets ───────────────────────────────────────────────────────────────
let nextTicketId = -1
const addTicket = () => {
  form.value.ticket_types.push({
    id:                nextTicketId--,
    name:              '',
    description:       '',
    price:             form.value.is_free ? 0 : undefined,
    quantity:          undefined,
    send_instructions: false,
    instructions:      '',
  })
}
const removeTicket = (index: number) => form.value.ticket_types.splice(index, 1)

// ─── Computed ──────────────────────────────────────────────────────────────
const isOnline = computed(() => form.value.location_type === 'online')

const statusOptions: { value: EventType['status']; label: string; color: string }[] = [
  { value: 'draft',     label: 'Brouillon', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'published', label: 'Publié',    color: 'bg-green-100  text-green-800'  },
  { value: 'archived',  label: 'Archivé',   color: 'bg-gray-100   text-gray-600'   },
]
const currentStatus = computed(
  () => statusOptions.find(s => s.value === form.value.status) ?? statusOptions[0]
)

// Quand l'utilisateur choisit un fichier
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file  = input.files?.[0]
  if (!file) return

  imageFile.value = file

  // Aperçu local immédiat sans attendre l'upload
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreviewUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  imageFile.value       = null
  imagePreviewUrl.value = null
  form.value.image_url  = null
}

const uploadImageIfNeeded = async (): Promise<string | null> => {
  if (!imageFile.value) return form.value.image_url

  isUploadingImage.value = true
  try {
    return await eventService.uploadEventImage(imageFile.value)
  } finally {
    isUploadingImage.value = false
  }
}

// ─── Sauvegarde ────────────────────────────────────────────────────────────
const save = async () => {
  isSaving.value    = true
  saveError.value   = null
  saveSuccess.value = false
  try {
    // 1. Upload l'image si un nouveau fichier a été sélectionné
    const imageUrl = await uploadImageIfNeeded()
    form.value.image_url = imageUrl

    // 2. Sauvegarde de l'événement (dates + tickets dans leurs tables via le service)
    await eventService.updateEvent(Number(eventId), form.value)
    saveSuccess.value = true
    setTimeout(() => (saveSuccess.value = false), 3000)
  } catch (err: any) {
    saveError.value = err.message ?? 'Une erreur est survenue lors de la sauvegarde.'
  } finally {
    isSaving.value = false
  }
}

onMounted(loadEvent)
</script>

<template>
  <div class="space-y-8 pb-24">

    <!-- ── Loader ── -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center py-32 text-primary">
      <Loader2 class="animate-spin size-10 mb-4 text-danger" />
      <p class="text-sm">Chargement de l'événement...</p>
    </div>

    <template v-else>

      <!-- ── Header ── -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/10 pb-6">
        <div class="flex items-center gap-3">
          <button
            @click="router.back()"
            class="p-2 rounded border border-primary/20 text-primary hover:bg-primary/5 transition-all"
          >
            <ArrowLeft :size="18" />
          </button>
          <div>
            <h3 class="text-2xl font-bold text-primary tracking-tight leading-tight truncate max-w-sm">
              {{ form.title || 'Modifier l\'événement' }}
            </h3>
            <div class="flex items-center gap-2 mt-1">
              <Badge class="text-xs border-none" :class="currentStatus.color">
                {{ currentStatus.label }}
              </Badge>
              <span class="text-xs text-primary/40">ID #{{ eventId }}</span>
            </div>
          </div>
        </div>

        <!-- Feedback + bouton save -->
        <div class="flex items-center gap-3 flex-wrap">
          <transition name="fade">
            <div
              v-if="saveSuccess"
              class="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded border border-green-200"
            >
              <CheckCircle2 :size="16" /> Sauvegardé !
            </div>
          </transition>
          <transition name="fade">
            <div
              v-if="saveError && !isSaving"
              class="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200 max-w-xs truncate"
            >
              <AlertCircle :size="16" class="shrink-0" />
              {{ saveError }}
            </div>
          </transition>
          <Button
            @click="save"
            :disabled="isSaving"
            class="bg-danger hover:bg-danger/90 text-white shadow-lg shadow-danger/20 flex items-center gap-2"
          >
            <Loader2 v-if="isSaving" :size="16" class="animate-spin" />
            <Save v-else :size="16" />
            {{ isSaving ? 'Sauvegarde...' : 'Enregistrer' }}
          </Button>
        </div>
      </div>

      <!-- ── Onglets ── -->
      <div class="flex gap-1 p-1 bg-primary/5 rounded w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="[
            'flex items-center gap-2 px-5 py-2.5 rounded text-sm font-medium transition-all duration-200',
            activeTab === tab.key
              ? 'bg-white text-primary shadow-sm border border-primary/10'
              : 'text-primary/50 hover:text-primary/70'
          ]"
        >
          <component :is="tab.icon" :size="15" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ════════ TAB: GÉNÉRAL ════════ -->
      <div v-show="activeTab === 'general'" class="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <!-- Colonne principale -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Infos de base -->
          <section class="bg-white rounded border border-primary/10 p-6 space-y-5">
            <h2 class="text-base font-bold text-primary flex items-center gap-2">
              <Tag :size="16" class="text-danger" /> Informations générales
            </h2>

            <!-- Titre -->
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Titre *</label>
              <Input
                v-model="form.title"
                placeholder="Nom de votre événement"
                class="border-primary/20 focus:border-danger text-base font-semibold"
              />
            </div>

            <!-- Description -->
            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Description</label>
              <textarea
                v-model="form.description"
                rows="5"
                placeholder="Décrivez votre événement en détail..."
                class="w-full rounded border border-primary/20 focus:border-danger focus:ring-0 focus:outline-none px-3 py-2.5 text-sm text-primary placeholder:text-primary/30 resize-none transition-colors"
              />
            </div>

            <!-- Catégorie + Fuseau horaire -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Catégorie</label>
                <select
                  v-model="form.category"
                  class="w-full h-10 rounded border border-primary/20 px-3 text-sm text-primary focus:border-danger focus:outline-none bg-white"
                >
                  <option value="" disabled>Sélectionnez…</option>
                  <option v-for="cat in CATEGORIES" :key="cat.value" :value="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Fuseau horaire</label>
                <select
                  v-model="form.timezone"
                  class="w-full h-10 rounded border border-primary/20 px-3 text-sm text-primary focus:border-danger focus:outline-none bg-white"
                >
                  <option v-for="tz in TIMEZONES" :key="tz.value" :value="tz.value">
                    {{ tz.label }}
                  </option>
                </select>
              </div>
            </div>
          </section>

          <!-- Lieu -->
          <section class="bg-white rounded border border-primary/10 p-6 space-y-5">
            <h2 class="text-base font-bold text-primary flex items-center gap-2">
              <MapPin :size="16" class="text-danger" /> Lieu
            </h2>

            <div class="flex gap-3">
              <button
                v-for="opt in [
                  { value: 'in-person', icon: MapPin, label: 'En présentiel' },
                  { value: 'online',    icon: Globe,  label: 'En ligne'      },
                ]"
                :key="opt.value"
                @click="form.location_type = opt.value as any"
                :class="[
                  'flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium border transition-all',
                  form.location_type === opt.value
                    ? 'border-danger text-danger bg-danger/5'
                    : 'border-primary/20 text-primary/60 hover:border-primary/40'
                ]"
              >
                <component :is="opt.icon" :size="14" />
                {{ opt.label }}
              </button>
            </div>

            <div v-if="!isOnline" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Pays</label>
                  <Input v-model="form.country" placeholder="Bénin" class="border-primary/20 focus:border-danger" />
                </div>
                <div class="space-y-2">
                  <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Ville</label>
                  <Input v-model="form.city" placeholder="Cotonou" class="border-primary/20 focus:border-danger" />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Adresse</label>
                <Input v-model="form.address" placeholder="12 avenue Jean Paul II..." class="border-primary/20 focus:border-danger" />
              </div>
            </div>

            <div v-else class="flex items-center gap-3 p-4 bg-blue-50 rounded border border-blue-100 text-sm text-blue-700">
              <Info :size="16" class="shrink-0" />
              Les participants recevront un lien de connexion par e-mail après l'achat.
            </div>
          </section>

          <!-- Image de couverture -->
          <section class="bg-white rounded border border-primary/10 p-6 space-y-4">
            <h2 class="text-base font-bold text-primary flex items-center gap-2">
              <ImageIcon :size="16" class="text-danger" /> Image de couverture
            </h2>

            <!-- Zone de drop / sélection -->
            <label
              class="relative flex flex-col items-center justify-center h-36 rounded border-2 border-dashed border-primary/20 hover:border-danger/40 hover:bg-danger/5 transition-all cursor-pointer group"
            >
              <input
                type="file"
                accept="image/*"
                class="absolute inset-0 opacity-0 cursor-pointer"
                @change="handleFileChange"
              />
              <ImageIcon :size="28" class="text-primary/20 group-hover:text-danger/40 mb-2 transition-colors" />
              <span class="text-xs text-primary/40 group-hover:text-danger/60 transition-colors">
                Cliquez ou déposez une image ici
              </span>
              <span class="text-[10px] text-primary/30 mt-1">PNG, JPG, WEBP — max 5 Mo</span>
            </label>

            <!-- Aperçu : nouveau fichier sélectionné (priorité) -->
            <div v-if="imagePreviewUrl" class="relative h-44 rounded overflow-hidden border border-primary/10">
              <img :src="imagePreviewUrl" class="w-full h-full object-cover" alt="Aperçu nouveau fichier" />
              <div class="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <span class="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">
                  Nouveau fichier sélectionné
                </span>
              </div>
              <button
                type="button"
                @click="clearImage"
                class="absolute top-2 right-2 p-1.5 bg-white/90 rounded text-primary hover:text-danger transition-colors"
              >
                <Trash2 :size="14" />
              </button>
            </div>

            <!-- Aperçu : image actuelle en base (si pas de nouveau fichier) -->
            <div v-else-if="form.image_url" class="relative h-44 rounded overflow-hidden border border-primary/10">
              <img :src="form.image_url" class="w-full h-full object-cover" :alt="form.title" />
              <div class="absolute top-2 left-2 text-[10px] font-bold bg-black/50 text-white px-2 py-0.5 rounded-full">
                Image actuelle
              </div>
              <button
                type="button"
                @click="clearImage"
                class="absolute top-2 right-2 p-1.5 bg-white/90 rounded text-primary hover:text-danger transition-colors"
              >
                <Trash2 :size="14" />
              </button>
            </div>

            <!-- Indicateur d'upload en cours -->
            <div v-if="isUploadingImage" class="flex items-center gap-2 text-xs text-primary/60">
              <Loader2 :size="14" class="animate-spin text-danger" />
              Upload de l'image en cours...
            </div>
          </section>
        </div>

        <!-- Colonne latérale -->
        <div class="space-y-5">

          <!-- Statut -->
          <section class="bg-white rounded border border-primary/10 p-5 space-y-4">
            <h2 class="text-sm font-bold text-primary uppercase tracking-wider">Statut</h2>
            <div class="space-y-2">
              <button
                v-for="opt in statusOptions"
                :key="opt.value"
                @click="form.status = opt.value"
                :class="[
                  'w-full flex items-center justify-between px-4 py-3 rounded border text-sm font-medium transition-all',
                  form.status === opt.value
                    ? 'border-danger bg-danger/5 text-primary'
                    : 'border-primary/15 text-primary/50 hover:border-primary/30'
                ]"
              >
                <span>{{ opt.label }}</span>
                <span :class="['text-xs px-2 py-0.5 rounded-full', opt.color]">{{ opt.label }}</span>
              </button>
            </div>
          </section>

          <!-- Visibilité -->
          <section class="bg-white rounded border border-primary/10 p-5 space-y-4">
            <h2 class="text-sm font-bold text-primary uppercase tracking-wider">Visibilité</h2>
            <div class="space-y-2">
              <button
                v-for="opt in [
                  { value: 'public',  label: 'Public', icon: Eye,    desc: 'Visible par tous'  },
                  { value: 'private', label: 'Privé',  icon: EyeOff, desc: 'Sur invitation'    },
                ]"
                :key="opt.value"
                @click="form.visibility = opt.value as any"
                :class="[
                  'w-full flex items-center gap-3 px-4 py-3 rounded border text-sm transition-all',
                  form.visibility === opt.value
                    ? 'border-danger bg-danger/5 text-primary'
                    : 'border-primary/15 text-primary/50 hover:border-primary/30'
                ]"
              >
                <component :is="opt.icon" :size="15" />
                <div class="text-left">
                  <p class="font-medium leading-none">{{ opt.label }}</p>
                  <p class="text-xs text-primary/40 mt-0.5">{{ opt.desc }}</p>
                </div>
              </button>
            </div>
          </section>

          <!-- Tarification -->
          <section class="bg-white rounded border border-primary/10 p-5 space-y-4">
            <h2 class="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <DollarSign :size="14" class="text-danger" /> Tarification
            </h2>
            <!-- Toggle gratuit -->
            <label class="flex items-center gap-3 cursor-pointer">
              <div
                @click="form.is_free = !form.is_free"
                :class="['w-11 h-6 rounded-full relative transition-colors', form.is_free ? 'bg-danger' : 'bg-primary/20']"
              >
                <span :class="['absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', form.is_free ? 'left-6' : 'left-1']" />
              </div>
              <span class="text-sm text-primary font-medium">Événement gratuit</span>
            </label>
            <!-- Devise (si payant) -->
            <div v-if="!form.is_free" class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Devise</label>
              <select
                v-model="form.currency"
                class="w-full h-10 rounded border border-primary/20 px-3 text-sm text-primary focus:border-danger focus:outline-none bg-white"
              >{{ form.currency }}
                <option v-for="c in CURRENCIES" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
          </section>
        </div>
      </div>

      <!-- ════════ TAB: DATES ════════ -->
      <div v-show="activeTab === 'dates'" class="space-y-5">
        <div class="flex items-center justify-between">
          <p class="text-sm text-primary/60">Ajoutez une ou plusieurs dates pour votre événement.</p>
          <Button @click="addDate" variant="outline" size="sm" class="border-danger text-danger hover:bg-danger/5 flex items-center gap-2">
            <Plus :size="15" /> Ajouter une date
          </Button>
        </div>

        <div v-if="form.dates.length === 0" class="py-16 text-center bg-white rounded border-2 border-dashed border-primary/20">
          <Calendar :size="40" class="mx-auto text-primary/20 mb-3" />
          <p class="text-primary/50 text-sm">Aucune date ajoutée</p>
          <button @click="addDate" class="mt-3 text-danger text-sm underline underline-offset-2">Ajouter la première date</button>
        </div>

        <div class="space-y-4">
          <div
            v-for="(date, index) in form.dates"
            :key="date.id"
            class="bg-white rounded border border-primary/10 p-6"
          >
            <div class="flex items-center justify-between mb-5">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-danger/10 flex items-center justify-center text-danger text-xs font-bold">
                  {{ index + 1 }}
                </div>
                <span class="text-sm font-bold text-primary">Date {{ index + 1 }}</span>
              </div>
              <button @click="removeDate(index)" class="p-1.5 text-primary/30 hover:text-danger transition-colors rounded hover:bg-danger/5">
                <Trash2 :size="16" />
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-primary/60 flex items-center gap-1">
                  <Clock :size="12" /> Début *
                </label>
                <input
                  type="datetime-local"
                  :value="toDatetimeLocal(date.starts_at)"
                  @change="(e) => date.starts_at = fromDatetimeLocal((e.target as HTMLInputElement).value)"
                  class="w-full h-10 rounded border border-primary/20 px-3 text-sm text-primary focus:border-danger focus:outline-none bg-white"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-primary/60 flex items-center gap-1">
                  <Clock :size="12" /> Fin
                </label>
                <input
                  type="datetime-local"
                  :value="toDatetimeLocal(date.ends_at)"
                  @change="(e) => date.ends_at = fromDatetimeLocal((e.target as HTMLInputElement).value)"
                  class="w-full h-10 rounded border border-primary/20 px-3 text-sm text-primary focus:border-danger focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════ TAB: TICKETS ════════ -->
      <div v-show="activeTab === 'tickets'" class="space-y-5">
        <div class="flex items-center justify-between">
          <p class="text-sm text-primary/60">Configurez les types de billets disponibles.</p>
          <Button @click="addTicket" variant="outline" size="sm" class="border-danger text-danger hover:bg-danger/5 flex items-center gap-2">
            <Plus :size="15" /> Ajouter un ticket
          </Button>
        </div>

        <div v-if="form.ticket_types.length === 0" class="py-16 text-center bg-white rounded border-2 border-dashed border-primary/20">
          <Ticket :size="40" class="mx-auto text-primary/20 mb-3" />
          <p class="text-primary/50 text-sm">Aucun type de billet configuré</p>
          <button @click="addTicket" class="mt-3 text-danger text-sm underline underline-offset-2">Ajouter le premier ticket</button>
        </div>

        <div class="space-y-5">
          <div
            v-for="(ticket, index) in form.ticket_types"
            :key="ticket.id"
            class="bg-white rounded border border-primary/10 p-6 space-y-5"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Ticket :size="16" class="text-danger" />
                <span class="text-sm font-bold text-primary">{{ ticket.name || `Ticket ${index + 1}` }}</span>
              </div>
              <button @click="removeTicket(index)" class="p-1.5 text-primary/30 hover:text-danger transition-colors rounded hover:bg-danger/5">
                <Trash2 :size="16" />
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Nom du ticket *</label>
                <Input v-model="ticket.name" placeholder="VIP, Standard, Gratuit..." class="border-primary/20 focus:border-danger" />
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Quantité disponible</label>
                <Input type="number" v-model.number="ticket.quantity" placeholder="100" min="0" class="border-primary/20 focus:border-danger" />
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-primary/60">Description</label>
              <Input v-model="ticket.description" placeholder="Accès VIP, placement libre..." class="border-primary/20 focus:border-danger" />
            </div>

            <div v-if="!form.is_free" class="space-y-2">
              <label class="text-xs font-bold uppercase tracking-wider text-primary/60">
                Prix ({{ form.currency }})
              </label>
              <Input type="number" v-model.number="ticket.price" placeholder="0.00" min="0" step="0.01" class="border-primary/20 focus:border-danger" />
            </div>

            <!-- Instructions acheteur -->
            <div class="pt-4 border-t border-primary/5 space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <div
                  @click="ticket.send_instructions = !ticket.send_instructions"
                  :class="['w-10 h-5 rounded-full relative transition-colors cursor-pointer', ticket.send_instructions ? 'bg-danger' : 'bg-primary/20']"
                >
                  <span :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', ticket.send_instructions ? 'left-5' : 'left-0.5']" />
                </div>
                <span class="text-sm text-primary">Envoyer des instructions aux acheteurs</span>
              </label>
              <textarea
                v-if="ticket.send_instructions"
                v-model="ticket.instructions"
                rows="3"
                placeholder="Instructions envoyées après l'achat..."
                class="w-full rounded border border-primary/20 focus:border-danger focus:ring-0 focus:outline-none px-3 py-2.5 text-sm text-primary placeholder:text-primary/30 resize-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

    </template>

    <!-- ── Barre sticky mobile ── -->
    <div class="fixed bottom-0 left-0 right-0 md:hidden bg-white/95 backdrop-blur border-t border-primary/10 p-4 flex gap-3 z-50">
      <Button variant="outline" @click="router.back()" class="flex-1 border-primary/20">Annuler</Button>
      <Button
        @click="save"
        :disabled="isSaving"
        class="flex-1 bg-danger hover:bg-danger/90 text-white flex items-center justify-center gap-2"
      >
        <Loader2 v-if="isSaving" :size="15" class="animate-spin" />
        <Save v-else :size="15" />
        {{ isSaving ? 'Sauvegarde...' : 'Enregistrer' }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

textarea:focus,
input[type="datetime-local"]:focus,
select:focus {
  border-color: var(--color-danger, #e11d48);
  box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.08);
}

input[type="datetime-local"],
select {
  background-color: white;
}
</style>