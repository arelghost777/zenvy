<script setup lang="ts">

import { ref } from 'vue'
import { useRouter } from 'vue-router'

// ── UI Components ─────────────────────────────────────────────────────────
import {
  Field, FieldGroup, FieldLabel, FieldLegend,
  FieldSeparator, FieldSet,
} from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// ── Icons ─────────────────────────────────────────────────────────────────
import {
  ArrowLeft, ArrowRight, Check, HelpCircle, PlusCircle,
  Upload, XCircle, CheckCircle2, Trash2, Info,
  MapPin, Calendar, Ticket, Globe, Loader2, AlertCircle,
  Image as ImageIcon,
} from 'lucide-vue-next'

// ── Store ─────────────────────────────────────────────────────────────────

import { useEventStore } from '@/stores/useEventStore'
import { storeToRefs } from 'pinia'
import RecapRow from '@/components/RecapRow.vue'


const store  = useEventStore()
const router = useRouter()

// ── Données locales du formulaire (liées au store) ────────────────────────
const {
  eventData,
  currentStep,
  isLoading,
  validationErrors,
  hasErrors
} = storeToRefs(store)

// ── Constantes UI ─────────────────────────────────────────────────────────

const FORM_STEPS = [
  { id: 1, label: 'Description' },
  { id: 2, label: 'Lieu'        },
  { id: 3, label: 'Dates'       },
  { id: 4, label: 'Billets'     },
  { id: 5, label: 'Récap'       },
]

const RECAP_STEPS = [
  { id: 1, label: 'Infos générales', icon: Info      },
  { id: 2, label: 'Lieu',            icon: MapPin    },
  { id: 3, label: 'Dates',           icon: Calendar  },
  { id: 4, label: 'Billetterie',     icon: Ticket    },
]

const CATEGORIES = [
  { value: 'concert',      label: 'Concert'      },
  { value: 'culture',      label: 'Culture'      },
  { value: 'formation',    label: 'Formation'    },
  { value: 'soiree',       label: 'Soirée'       },
  { value: 'tourisme',     label: 'Tourisme'     },
  { value: 'sport',        label: 'Sport'        },
  { value: 'festival',     label: 'Festival'     },
  { value: 'science',      label: 'Science'      },
  { value: 'religieux',    label: 'Religieux'    },
  { value: 'gastronomie',  label: 'Gastronomie'  },
  { value: 'business',     label: 'Business'     },
  { value: 'autre',        label: 'Autre'        },
]

const COUNTRIES = [
  { value: 'benin',       label: 'Bénin'         },
  { value: 'burkina-faso',label: 'Burkina Faso'  },
  { value: 'cameroun',    label: 'Cameroun'      },
  { value: 'cote-ivoire', label: "Côte d'Ivoire" },
  { value: 'guinee',      label: 'Guinée'        },
  { value: 'mali',        label: 'Mali'          },
  { value: 'senegal',     label: 'Sénégal'       },
  { value: 'togo',        label: 'Togo'          },
  { value: 'autre',       label: 'Autre pays'    },
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

// ── État local UI ─────────────────────────────────────────────────────────

/** Onglet actif dans le récapitulatif */
const activeRecapTab = ref(1)
const transitionDirection = ref<'forward' | 'backward'>('forward')
const isSuccess = ref(true)

// ── Helpers ───────────────────────────────────────────────────────────────

function getStepClass(stepId: number) {
  if (currentStep.value === stepId) return 'active'
  if (currentStep.value > stepId)   return 'done'
  return 'pending'
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file  = input.files?.[0]
  if (file) store.handleImageFile(file)
}

function handleNext() {
  transitionDirection.value = 'forward'
  store.nextStep()
}

function handlePrev() {
  transitionDirection.value = 'backward'
  store.prevStep()
}

function handleGoTo(step: number) {
  transitionDirection.value = step > currentStep.value ? 'forward' : 'backward'
  store.goToStep(step)
}

/** Formatage de la date pour l'affichage dans le récap */
function formatDate(iso: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

/** Label lisible pour les valeurs de select */
function labelOf(arr: { value: string; label: string }[], val: string) {
  return arr.find(i => i.value === val)?.label ?? val ?? '—'
}

// ── Submit ────────────────────────────────────────────────────────────────

async function onSubmit() {
  const result = await store.submitEvent()
  if (result.success) {
    router.push(`/dashboard/events`)
    isSuccess.value = true
  }
}
</script>

<template>
<div v-if="isSuccess" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2B2D42]/20 backdrop-blur-sm animate-in fade-in duration-300">
  
  <div class="bg-white p-8 md:p-12 rounded-xl shadow-[0_20px_70px_rgba(0,0,0,0.15)] border border-white max-w-sm w-full text-center animate-in zoom-in duration-500">
    
    <div class="size-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
      <CheckCircle2 :size="48" stroke-width="2.5" class="animate-bounce" />
    </div>

    <h2 class="text-3xl font-black text-[#2B2D42] mb-3 tracking-tighter">C'est en ligne !</h2>
    <p class="text-[#8D99AE] text-sm leading-relaxed mb-10">
      Votre événement <span class="font-bold text-[#2B2D42]">"{{ eventData.title }}"</span> a été publié avec succès sur <span class="text-[#EF233C] font-black">Zenvy</span>.
    </p>

    <div class="flex flex-col gap-3">
      <router-link 
        to="/dashboard/events" 
        class="w-full bg-[#2B2D42] hover:bg-[#2B2D42]/90 text-white font-bold py-3 mt-3 rounded-lg transition-all shadow-xl shadow-[#2B2D42]/20 text-sm"
      >
        Voir l'événement
      </router-link>
    </div>
  </div>
</div>
  <!-- ══════════════════════════════════════════════════════════════════════
       CONTENEUR PRINCIPAL
  ══════════════════════════════════════════════════════════════════════════ -->
  <div v-else class="w-full mx-auto pb-8 px-4">

    <!-- En-tête -->
    <h1 class="font-bold mb-2" style="color: var(--color-primary)">
      Créer un événement
    </h1>
    <p class="text-sm mb-8 text-gray-600">
      Suivez les étapes pour publier votre événement sur la plateforme.
    </p>

    <!-- ────────────────────────────────────────────────────────────────────
         STEPPER — Desktop
    ──────────────────────────────────────────────────────────────────────── -->
    <div class="hidden md:flex items-center justify-between my-10">
      <template v-for="(step, index) in FORM_STEPS" :key="step.id">
        <div class="flex flex-col items-center">
          <!-- Cercle -->
          <button
            type="button"
            :aria-label="`Aller à l'étape ${step.label}`"
            :disabled="step.id > currentStep + 1"
            @click="handleGoTo(step.id)"
            class="rounded-full w-10 h-10 flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2"
            :class="{
              'text-white shadow-md': true,
              'focus:ring-primary':   getStepClass(step.id) === 'active',
              'focus:ring-green-500': getStepClass(step.id) === 'done',
            }"
            :style="{
              background:
                getStepClass(step.id) === 'active'  ? 'var(--color-primary)'   :
                getStepClass(step.id) === 'done'     ? '#22c55e'                :
                'var(--color-danger)',
            }"
          >
            <Check v-if="getStepClass(step.id) === 'done'" class="w-5 h-5" />
            <span v-else>{{ step.id }}</span>
          </button>
          <!-- Label -->
          <span
            class="mt-2 text-xs font-semibold uppercase tracking-wide transition-colors"
            :style="{
              color:
                getStepClass(step.id) === 'active' ? 'var(--color-primary)'   :
                getStepClass(step.id) === 'done'   ? '#22c55e'                :
                'var(--color-danger)',
            }"
          >{{ step.label }}</span>
        </div>

        <!-- Connecteur -->
        <div
          v-if="index < FORM_STEPS.length - 1"
          class="flex-1 h-0.5 mx-3 transition-all duration-500"
          :style="{ background: currentStep > step.id ? '#22c55e' : '#D1D5DB' }"
        />
      </template>
    </div>

    <!-- STEPPER — Mobile -->
    <div class="md:hidden flex gap-2 my-6">
      <div
        v-for="step in FORM_STEPS"
        :key="step.id"
        class="flex-1 h-1.5 rounded-full transition-all duration-500"
        :style="{
          background:
            currentStep === step.id ? 'var(--color-primary)'   :
            currentStep >  step.id  ? '#22c55e'                :
            '#E5E7EB',
        }"
      />
    </div>
    <div class="md:hidden text-md font-semibold mb-6" style="color: var(--color-primary)">
      Étape {{ currentStep }} / {{ FORM_STEPS.length }} — {{ FORM_STEPS[currentStep - 1]?.label }}
    </div>

    <!-- ────────────────────────────────────────────────────────────────────
         ERREURS GLOBALES DE VALIDATION
    ──────────────────────────────────────────────────────────────────────── -->
    <Transition name="fade">
      <div
        v-if="hasErrors && Object.keys(validationErrors).length > 0"
        class="mb-4 rounded-lg border p-4 flex gap-3"
        style="background: #FEF2F2; border-color: #FECACA"
      >
        <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" style="color: var(--color-danger)" />
        <div>
          <p class="font-semibold text-sm mb-1" style="color: var(--color-danger)">
            Veuillez corriger les erreurs suivantes :
          </p>
          <ul class="list-disc list-inside text-sm space-y-1" style="color: var(--color-danger)">
            <li v-for="(msg, key) in validationErrors" :key="key">{{ msg }}</li>
          </ul>
        </div>
      </div>
    </Transition>

    <!-- ────────────────────────────────────────────────────────────────────
         PANNEAU DE FORMULAIRE — avec transition slide
    ──────────────────────────────────────────────────────────────────────── -->
    <Transition :name="transitionDirection === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">

      <!-- ══ ÉTAPE 1 : Description ════════════════════════════════════ -->
      <FieldGroup
        v-if="currentStep === 1"
        key="step-1"
        class="border rounded-xl p-6 shadow-sm"
        style="background: #fff; border-color: #E5E7EB"
      >
        <FieldSet class="flex flex-col gap-6 lg:flex-row">

          <!-- Colonne gauche : image -->
          <div class="lg:w-56 flex-shrink-0">
            <Field>
              <FieldLabel for="event-image">Image de couverture</FieldLabel>

              <!-- Zone de dépôt avec aperçu -->
              <div
                class="relative rounded-lg overflow-hidden border-2 border-dashed transition-all duration-200 cursor-pointer group"
                :class="validationErrors.imageFile
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300 hover:border-primary bg-gray-50'"
                style="min-height: 180px"
              >
                <input
                  type="file"
                  id="event-image"
                  accept="image/*"
                  class="absolute inset-0 opacity-0 cursor-pointer z-10"
                  @change="handleFileChange"
                />

                <!-- Aperçu de l'image -->
                <template v-if="eventData.imagePreviewUrl">
                  <img
                    :src="eventData.imagePreviewUrl"
                    alt="Aperçu"
                    class="w-full h-full object-cover absolute inset-0"
                  />
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p class="text-white text-xs font-semibold">Changer l'image</p>
                  </div>
                  <button
                    type="button"
                    class="absolute top-2 right-2 z-20 rounded-full bg-white/80 p-1 hover:bg-white transition"
                    @click.stop="store.clearImage()"
                    title="Supprimer l'image"
                  >
                    <XCircle class="w-4 h-4" style="color: var(--color-danger)" />
                  </button>
                </template>

                <!-- Placeholder upload -->
                <template v-else>
                  <div class="flex flex-col items-center justify-center h-full py-8 px-4 text-center space-y-2">
                    <Upload class="w-8 h-8 transition-colors text-gray-400 group-hover:text-primary" />
                    <p class="text-sm font-medium text-gray-500">Cliquez pour insérer</p>
                    <p class="text-[10px] uppercase tracking-widest text-gray-400">JPG · PNG · WebP</p>
                  </div>
                </template>
              </div>

              <!-- Erreur image -->
              <p v-if="validationErrors.imageFile" class="text-xs mt-1" style="color: var(--color-danger)">
                {{ validationErrors.imageFile }}
              </p>
            </Field>
          </div>

          <!-- Colonne droite : champs texte -->
          <div class="flex-1 grid gap-4 md:grid-cols-2">

            <!-- Nom -->
            <Field>
              <FieldLabel for="event-name">
                Nom de l'événement <span class="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="event-name"
                v-model="eventData.title"
                placeholder="Ex : Fête de la musique 2025"
                :class="{ 'border-red-400 focus:ring-red-400': validationErrors.title }"
              />
              <p v-if="validationErrors.title" class="text-xs mt-1" style="color: var(--color-danger)">
                {{ validationErrors.title }}
              </p>
            </Field>

            <!-- Catégorie -->
            <Field>
              <FieldLabel for="event-category">
                Catégorie <span class="text-red-500">*</span>
              </FieldLabel>
              <Select v-model="eventData.category">
                <SelectTrigger id="event-category" class="w-full">
                  <SelectValue placeholder="Sélectionnez…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Catégories</SelectLabel>
                    <SelectItem
                      v-for="cat in CATEGORIES"
                      :key="cat.value"
                      :value="cat.value"
                    >{{ cat.label }}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p v-if="validationErrors.category" class="text-xs mt-1" style="color: var(--color-danger)">
                {{ validationErrors.category }}
              </p>
            </Field>

            <!-- Description -->
            <Field class="md:col-span-2">
              <FieldLabel for="event-description">Description</FieldLabel>
              <textarea
                id="event-description"
                v-model="eventData.description"
                rows="4"
                placeholder="Décrivez l'événement et donnez envie aux visiteurs de participer…"
                class="w-full border rounded-md p-3 text-sm resize-y transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                style="border-color: #E5E7EB; color: var(--color-primary)"
              />
            </Field>

          </div>
        </FieldSet>

        <FieldSeparator class="" />

        <!-- Visibilité -->
        <FieldSet>
          <Field>
            <FieldLabel>
              Visibilité
              <HelpCircle
                class="inline-block cursor-help"
                :size="15"
                style="color: var(--color-danger)"
                title="Public : visible par tous · Privé : sur invitation seulement"
              />
            </FieldLabel>
            <div class="flex gap-6 mt-1">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" name="visibility" value="public"  v-model="eventData.visibility" />
                <span class="text-sm">Public</span>
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" name="visibility" value="private" v-model="eventData.visibility" />
                <span class="text-sm">Privé</span>
              </label>
            </div>
          </Field>
        </FieldSet>

        <FieldSeparator class="" />

        <div class="flex justify-end">
          <Button @click="handleNext()" type="button">
            Suivant <ArrowRight :size="16" class="ml-1" />
          </Button>
        </div>
      </FieldGroup>

      <!-- ══ ÉTAPE 2 : Lieu ════════════════════════════════════════════ -->
      <FieldGroup
        v-else-if="currentStep === 2"
        key="step-2"
        class="border rounded-xl p-6 shadow-sm"
        style="background: #fff; border-color: #E5E7EB"
      >
        <FieldSet class="grid md:grid-cols-2 gap-6">

          <!-- Colonne gauche -->
          <FieldGroup class="space-y-4">
            <Field>
              <FieldLabel>
                Format de l'événement <span class="text-red-500">*</span>
              </FieldLabel>
              <div class="flex gap-6 mt-1">
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="location-type" value="online"     v-model="eventData.locationType" />
                  <span class="text-sm flex items-center gap-1">
                    <Globe :size="14" style="color: var(--color-danger)" /> En ligne
                  </span>
                </label>
                <label class="inline-flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="location-type" value="in-person"  v-model="eventData.locationType" />
                  <span class="text-sm flex items-center gap-1">
                    <MapPin :size="14" style="color: var(--color-danger)" /> En présentiel
                  </span>
                </label>
              </div>
            </Field>

            <Transition name="fade">
              <Field v-if="eventData.locationType === 'in-person'">
                <FieldLabel for="event-city">
                  Ville <span class="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="event-city"
                  v-model="eventData.city"
                  placeholder="Ex : Abidjan"
                  :class="{ 'border-red-400': validationErrors.city }"
                />
                <p v-if="validationErrors.city" class="text-xs mt-1" style="color: var(--color-danger)">
                  {{ validationErrors.city }}
                </p>
              </Field>
            </Transition>
          </FieldGroup>

          <!-- Colonne droite -->
          <FieldGroup class="space-y-4">
            <Field>
              <FieldLabel for="event-country">
                Pays <span class="text-red-500">*</span>
              </FieldLabel>
              <Select v-model="eventData.country">
                <SelectTrigger id="event-country" class="w-full">
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Pays</SelectLabel>
                    <SelectItem
                      v-for="c in COUNTRIES"
                      :key="c.value"
                      :value="c.value"
                    >{{ c.label }}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p v-if="validationErrors.country" class="text-xs mt-1" style="color: var(--color-danger)">
                {{ validationErrors.country }}
              </p>
            </Field>

            <Transition name="fade">
              <Field v-if="eventData.locationType === 'in-person'">
                <FieldLabel for="event-address">Adresse complète</FieldLabel>
                <Input
                  id="event-address"
                  v-model="eventData.address"
                  placeholder="Ex : 12 rue des Palmiers, Plateau"
                />
              </Field>
            </Transition>
          </FieldGroup>

        </FieldSet>

        <!-- Bandeau info événement en ligne -->
        <Transition name="fade">
          <div
            v-if="eventData.locationType === 'online'"
            class="mt-4 rounded-lg border p-4 flex gap-3 text-sm"
            style="background: #FFFBEB; border-color: #FDE68A; color: #92400E"
          >
            <Info class="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong>Événement en ligne</strong> : un lien de visioconférence sera
              automatiquement généré et partagé avec les participants après achat.
            </div>
          </div>
        </Transition>

        <FieldSeparator class="" />
        <div class="flex justify-between">
          <Button type="button" variant="outline" @click="handlePrev">
            <ArrowLeft :size="16" class="mr-1" /> Précédent
          </Button>
          <Button type="button" @click="handleNext">
            Suivant <ArrowRight :size="16" class="ml-1" />
          </Button>
        </div>
      </FieldGroup>

      <!-- ══ ÉTAPE 3 : Dates ════════════════════════════════════════════ -->
      <FieldGroup
        v-else-if="currentStep === 3"
        key="step-3"
        class="border rounded-xl p-6 shadow-sm"
        style="background: #fff; border-color: #E5E7EB"
      >
        <FieldSet class="space-y-4">

          <!-- Fuseau horaire -->
          <Field class="max-w-xs">
            <FieldLabel for="timezone">
              Fuseau horaire <span class="text-red-500">*</span>
            </FieldLabel>
            <Select v-model="eventData.timezone">
              <SelectTrigger id="timezone" class="w-full">
                <SelectValue placeholder="Sélectionnez…" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fuseaux horaires</SelectLabel>
                  <SelectItem
                    v-for="tz in TIMEZONES"
                    :key="tz.value"
                    :value="tz.value"
                  >{{ tz.label }}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <!-- Liste des créneaux -->
          <TransitionGroup name="list" tag="div" class="space-y-3">
            <div
              v-for="(date, index) in eventData.dates"
              :key="date.id"
              class="relative rounded-lg border p-4"
              style="background: #F9FAFB; border-color: #E5E7EB"
            >
              <!-- En-tête du créneau -->
              <div class="flex items-center justify-between mb-3">
                <p class="text-sm font-semibold" style="color: var(--color-primary)">
                  Créneau {{ index + 1 }}
                </p>
                <button
                  v-if="eventData.dates.length > 1"
                  type="button"
                  class="rounded-full p-1 hover:bg-red-100 transition"
                  @click="store.removeDate(date.id)"
                  title="Supprimer ce créneau"
                >
                  <Trash2 :size="16" style="color: var(--color-danger)" />
                </button>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <Field class="">
                  <FieldLabel :for="`start-date-${date.id}`">Début <span class="text-red-500">*</span></FieldLabel>
                  <Input
                    type="datetime-local"
                    :id="`start-date-${date.id}`"
                    v-model="date.starts_at"
                    class=""
                    :class="{ 'border-red-400': validationErrors[`start-${index}`] }"
                  />
                  <p v-if="validationErrors[`start-${index}`]" class="text-xs mt-1" style="color: var(--color-danger)">
                    {{ validationErrors[`start-${index}`] }}
                  </p>
                </Field>
                <Field>
                  <FieldLabel :for="`end-date-${date.id}`">Fin <span class="text-red-500">*</span></FieldLabel>
                  <Input
                    type="datetime-local"
                    :id="`end-date-${date.id}`"
                    v-model="date.ends_at"
                    :class="{ 'border-red-400': validationErrors[`end-${index}`] }"
                  />
                  <p v-if="validationErrors[`end-${index}`]" class="text-xs mt-1" style="color: var(--color-danger)">
                    {{ validationErrors[`end-${index}`] }}
                  </p>
                </Field>
              </div>
            </div>
          </TransitionGroup>

          <!-- Bouton ajouter créneau -->
          <div class="flex justify-center pt-2">
            <Button type="button" variant="outline" @click="store.addDate">
              <PlusCircle :size="16" class="mr-1" /> Ajouter un créneau
            </Button>
          </div>

        </FieldSet>

        <FieldSeparator class="" />
        <div class="flex justify-between">
          <Button type="button" variant="outline" @click="handlePrev">
            <ArrowLeft :size="16" class="mr-1" /> Précédent
          </Button>
          <Button type="button" @click="handleNext">
            Suivant <ArrowRight :size="16" class="ml-1" />
          </Button>
        </div>
      </FieldGroup>

      <!-- ══ ÉTAPE 4 : Billetterie ══════════════════════════════════════ -->
      <FieldGroup
        v-else-if="currentStep === 4"
        key="step-4"
        class="border rounded-xl p-6 shadow-sm"
        style="background: #fff; border-color: #E5E7EB"
      >

        <!-- Options générales -->
        <FieldSet class="grid md:grid-cols-2 gap-4 mb-6">

          <Field
            class="rounded-lg border p-4"
            style="background: #F9FAFB; border-color: #E5E7EB"
          >
            <FieldLabel>L'événement est-il gratuit ?</FieldLabel>
            <div class="flex gap-6 mt-2">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" name="is-free" :value="true"
                  v-model="eventData.isFree" />
                <span class="text-sm">Oui, gratuit</span>
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" name="is-free" :value="false"
                  v-model="eventData.isFree" />
                <span class="text-sm">Non, payant</span>
              </label>
            </div>
          </Field>

          <Transition name="fade">
            <Field
              v-if="!eventData.isFree"
              class="rounded-lg border p-4"
              style="background: #F9FAFB; border-color: #E5E7EB"
            >
              <FieldLabel for="currency">
                Devise <span class="text-red-500">*</span>
              </FieldLabel>
              <Select v-model="eventData.currency">
                <SelectTrigger id="currency" class="w-full">
                  <SelectValue placeholder="Sélectionnez une devise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Devises</SelectLabel>
                    <SelectItem
                      v-for="cur in CURRENCIES"
                      :key="cur.value"
                      :value="cur.value"
                    >{{ cur.label }}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <p v-if="validationErrors.currency" class="text-xs mt-1" style="color: var(--color-danger)">
                {{ validationErrors.currency }}
              </p>
            </Field>
          </Transition>

        </FieldSet>

        <!-- Catégories de tickets -->
        <TransitionGroup name="list" tag="div" class="space-y-4">
          <div
            v-for="(cat, index) in eventData.ticketCategories"
            :key="cat.id"
            class="rounded-lg border p-4"
            style="background: #F9FAFB; border-color: #E5E7EB"
          >
            <!-- En-tête catégorie -->
            <div class="flex items-center justify-between mb-4">
              <FieldLegend class="font-semibold" style="color: var(--color-primary)">
                Catégorie de ticket {{ index + 1 }}
              </FieldLegend>
              <button
                v-if="eventData.ticketCategories.length > 1"
                type="button"
                class="rounded-full p-1 hover:bg-red-100 transition"
                @click="store.removeTicketCategory(cat.id)"
                title="Supprimer cette catégorie"
              >
                <Trash2 :size="16" style="color: var(--color-danger)" />
              </button>
            </div>

            <div class="grid md:grid-cols-2 gap-4">

              <!-- Nom -->
              <Field>
                <FieldLabel :for="`cat-name-${cat.id}`">
                  Nom <span class="text-red-500">*</span>
                </FieldLabel>
                <Input
                  :id="`cat-name-${cat.id}`"
                  v-model="cat.name"
                  placeholder="Ex : VIP, Standard, Early Bird…"
                  :class="{ 'border-red-400': validationErrors[`cat-name-${index}`] }"
                />
                <p v-if="validationErrors[`cat-name-${index}`]" class="text-xs mt-1" style="color: var(--color-danger)">
                  {{ validationErrors[`cat-name-${index}`] }}
                </p>
              </Field>

              <!-- Description -->
              <Field>
                <FieldLabel :for="`cat-desc-${cat.id}`">Description (facultative)</FieldLabel>
                <Input
                  :id="`cat-desc-${cat.id}`"
                  v-model="cat.description"
                  placeholder="Avantages inclus, accès VIP…"
                />
              </Field>

              <!-- Prix -->
              <Field>
                <FieldLabel :for="`cat-price-${cat.id}`">
                  Prix <span class="text-red-500" v-if="!eventData.isFree">*</span>
                </FieldLabel>
                <Input
                  type="number"
                  :id="`cat-price-${cat.id}`"
                  v-model.number="cat.price"
                  :disabled="eventData.isFree"
                  placeholder="Ex : 5000"
                  min="0"
                  :class="{ 'border-red-400': validationErrors[`cat-price-${index}`] }"
                />
                <p v-if="validationErrors[`cat-price-${index}`]" class="text-xs mt-1" style="color: var(--color-danger)">
                  {{ validationErrors[`cat-price-${index}`] }}
                </p>
              </Field>

              <!-- Quantité -->
              <Field>
                <FieldLabel :for="`cat-qty-${cat.id}`">
                  Quantité disponible <span class="text-red-500">*</span>
                </FieldLabel>
                <Input
                  type="number"
                  :id="`cat-qty-${cat.id}`"
                  v-model.number="cat.quantity"
                  placeholder="Ex : 100"
                  min="1"
                  :class="{ 'border-red-400': validationErrors[`cat-qty-${index}`] }"
                />
                <p v-if="validationErrors[`cat-qty-${index}`]" class="text-xs mt-1" style="color: var(--color-danger)">
                  {{ validationErrors[`cat-qty-${index}`] }}
                </p>
              </Field>

              <!-- Instructions -->
              <Field class="md:col-span-2">
                <FieldLabel>Instructions post-achat ?</FieldLabel>
                <div class="flex gap-6 mt-1">
                  <label class="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      :name="`instr-${cat.id}`"
                      :checked="cat.send_instructions"
                      @change="cat.send_instructions = true"
                    /> Oui
                  </label>
                  <label class="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      :name="`instr-${cat.id}`"
                      :checked="!cat.send_instructions"
                      @change="cat.send_instructions = false"
                    /> Non
                  </label>
                </div>
              </Field>

              <Transition name="fade">
                <Field v-if="cat.send_instructions" class="md:col-span-2">
                  <FieldLabel :for="`cat-instr-${cat.id}`">
                    Contenu des instructions
                  </FieldLabel>
                  <textarea
                    :id="`cat-instr-${cat.id}`"
                    v-model="cat.instructions"
                    rows="3"
                    placeholder="Ex : Présentez ce ticket à l'entrée avec une pièce d'identité…"
                    class="w-full border rounded-md p-3 text-sm resize-y transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                    style="border-color: #E5E7EB"
                  />
                </Field>
              </Transition>

            </div>
          </div>
        </TransitionGroup>

        <!-- Bouton ajouter catégorie -->
        <div class="flex justify-center mt-4">
          <Button type="button" variant="outline" @click="store.addTicketCategory">
            <PlusCircle :size="16" class="mr-1" /> Ajouter une catégorie de ticket
          </Button>
        </div>

        <FieldSeparator class="" />
        <div class="flex justify-between">
          <Button type="button" variant="outline" @click="handlePrev">
            <ArrowLeft :size="16" class="mr-1" /> Précédent
          </Button>
          <Button type="button" @click="handleNext">
            Aperçu <ArrowRight :size="16" class="ml-1" />
          </Button>
        </div>
      </FieldGroup>

      <!-- ══ ÉTAPE 5 : Récapitulatif ════════════════════════════════════ -->
      <FieldGroup
        v-else-if="currentStep === 5"
        key="step-5"
        class="border rounded-xl p-6 shadow-sm"
        style="background: #fff; border-color: #E5E7EB"
      >
        <!-- En-tête récap -->
        <div class="text-center mb-6">
          <div
            class="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style="background: #ECFDF5"
          >
            <CheckCircle2 class="w-8 h-8" style="color: #16a34a" />
          </div>
          <h3 class="text-xl font-bold" style="color: var(--color-primary)">
            Récapitulatif de l'événement
          </h3>
          <p class="text-sm mt-1 text-gray-600">
            Vérifiez les informations avant de publier.
          </p>
        </div>

        <!-- Onglets de navigation du récap -->
        <div class="flex border-b  mb-6 overflow-x-auto overflow-y-hidden" style="border-color: #E5E7EB">
          <button
            v-for="tab in RECAP_STEPS"
            :key="tab.id"
            type="button"
            class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-4 transition-all -mb-px"
            :style="{
              borderColor: activeRecapTab === tab.id ? 'var(--color-danger)' : 'transparent',
              color:        activeRecapTab === tab.id ? 'var(--color-danger)' : 'var(--color-primary)',
            }"
            @click="activeRecapTab = tab.id"
          >
            <component :is="tab.icon" :size="15" />
            {{ tab.label }}
          </button>
        </div>

        <!-- Contenu des onglets du récap -->
        <Transition name="fade" mode="out-in">

          <!-- Onglet 1 : Infos générales -->
          <div v-if="activeRecapTab === 1" key="recap-1">
            <div class="grid md:grid-cols-2 gap-6">

              <!-- Image -->
              <div
                class="rounded-lg overflow-hidden border aspect-video flex items-center justify-center"
                style="border-color: #E5E7EB; background: #F9FAFB"
              >
                <img
                  v-if="eventData.imagePreviewUrl"
                  :src="eventData.imagePreviewUrl"
                  alt="Image de l'événement"
                  class="w-full h-full object-cover"
                />
                <div v-else class="flex flex-col items-center gap-2 text-gray-400">
                  <ImageIcon :size="32" />
                  <span class="text-xs">Aucune image</span>
                </div>
              </div>

              <!-- Détails -->
              <div class="space-y-3">
                <RecapRow label="Titre"       :value="eventData.title || '—'" />
                <RecapRow label="Catégorie"   :value="labelOf(CATEGORIES, eventData.category)" />
                <RecapRow label="Visibilité"  :value="eventData.visibility === 'public' ? 'Public' : 'Privé'" />
                <RecapRow label="Description" :value="eventData.description || '—'" />
              </div>

            </div>

            <!-- Lien d'édition -->

          </div>

          <!-- Onglet 2 : Lieu -->
          <div v-else-if="activeRecapTab === 2" key="recap-2" class="space-y-3">
            <RecapRow label="Format"    :value="eventData.locationType === 'online' ? 'En ligne' : 'En présentiel'" />
            <RecapRow label="Pays"      :value="labelOf(COUNTRIES, eventData.country)" />
            <RecapRow
              v-if="eventData.locationType === 'in-person'"
              label="Ville"    :value="eventData.city    || '—'"
            />
            <RecapRow
              v-if="eventData.locationType === 'in-person'"
              label="Adresse" :value="eventData.address || '—'"
            />
          </div>

          <!-- Onglet 3 : Dates -->
          <div v-else-if="activeRecapTab === 3" key="recap-3" class="space-y-4">
            <RecapRow label="Fuseau horaire" :value="(eventData.timezone || '').toUpperCase()" />
            <div
              v-for="(d, i) in eventData.dates"
              :key="d.id"
              class="rounded-lg border p-4"
              style="background: #F9FAFB; border-color: #E5E7EB"
            >
              <p class="text-xs font-semibold mb-2" style="color: var(--color-danger)">
                Créneau {{ i + 1 }}
              </p>
              <RecapRow label="Début" :value="formatDate(d.starts_at)" />
              <RecapRow label="Fin"   :value="formatDate(d.ends_at)"   />
            </div>
          </div>

          <!-- Onglet 4 : Billetterie -->
          <div v-else-if="activeRecapTab === 4" key="recap-4" class="space-y-4">
            <RecapRow
              label="Type"
              :value="eventData.isFree ? 'Gratuit' : `Payant — ${labelOf(CURRENCIES, eventData.currency)}`"
            />
            <div
              v-if="!eventData.isFree"
              v-for="(cat, i) in eventData.ticketCategories"
              :key="cat.id"
              class="rounded-lg border p-4"
              style="background: #F9FAFB; border-color: #E5E7EB"
            >
              <p class="text-xs font-semibold mb-2" style="color: var(--color-danger)">
                Catégorie {{ i + 1 }} — {{ cat.name || '—' }}
              </p>
              <RecapRow label="Prix"             :value="cat.price !== null ? `${cat.price}` : '—'" />
              <RecapRow label="Quantité"         :value="cat.quantity !== null ? `${cat.quantity}` : '—'" />
              <RecapRow label="Instructions"     :value="cat.send_instructions ? 'Oui' : 'Non'" />
            </div>
          </div>

        </Transition>

        <FieldSeparator class="my-5" />

        <!-- Bouton de publication -->
        <div class="flex justify-between items-center">
          <Button type="button" variant="outline" @click="handlePrev">
            <ArrowLeft :size="16" class="mr-1" /> Précédent
          </Button>

          <Button
            type="button"
            :disabled="isLoading"
            class=" justify-center"
            style="background: var(--color-primary); color: #fff"
            @click="onSubmit"
          >
            <Loader2 v-if="isLoading" :size="16" class="mr-2 animate-spin" />
            <Check v-else             :size="16" class="mr-2" />
            {{ isLoading ? 'Publication…' : 'Publier' }}
          </Button>
        </div>

        <!-- Erreur de soumission -->
        <Transition name="fade">
          <div
            v-if="store.submitError"
            class="mt-4 rounded-lg border p-4 flex gap-3 text-sm"
            style="background: #FEF2F2; border-color: #FECACA; color: #991B1B"
          >
            <AlertCircle class="w-5 h-5 flex-shrink-0" />
            {{ store.submitError }}
          </div>
        </Transition>

      </FieldGroup>

    </Transition>
  </div>
</template>

<!-- ─── Composant utilitaire local : RecapRow ──────────────────────────────── -->
<!-- <script lang="ts">
// Micro-composant inline pour les lignes de récap
import { defineComponent } from 'vue'

export const RecapRow = defineComponent({
  props: {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  template: `
    <div class="flex justify-between gap-4 py-1.5 border-b last:border-0 text-sm" style="border-color: #F3F4F6">
      <span style="color: var(--color-danger); min-width: 100px">{{ label }}</span>
      <span class="text-right font-medium" style="color: var(--color-primary)">{{ value }}</span>
    </div>
  `,
})
</script> -->

<!-- ─── Transitions CSS ────────────────────────────────────────────────────── -->
<style scoped>
/* Slide vers la gauche (avancer) */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from  { opacity: 0; transform: translateX(40px);  }
.slide-left-leave-to    { opacity: 0; transform: translateX(-40px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-40px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(40px);  }

/* Fade simple */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

/* TransitionGroup pour les listes */
.list-enter-active { transition: all 0.3s ease; }
.list-leave-active { transition: all 0.25s ease; }
.list-enter-from   { opacity: 0; transform: translateY(-12px); }
.list-leave-to     { opacity: 0; transform: translateY(-8px); max-height: 0; }
</style>