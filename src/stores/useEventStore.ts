// stores/useEventStore.ts
// Store Pinia centralisé pour le formulaire de création d'événement
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/clientSupabase' // Votre client Supabase
import type { EventData, TicketCategory } from '@/types/eventTypes'

// ─── Types ─────────────────────────────────────────────────────────────────


// ─── Store ─────────────────────────────────────────────────────────────────

export const useEventStore = defineStore('event', () => {

  // ── State ──────────────────────────────────────────────────────────────

  const currentStep = ref<number>(1)
  const isLoading = ref(false)
  const submitSuccess = ref(false)
  const submitError = ref<string | null>(null)

  /** Objet centralisé contenant toutes les données du formulaire */
  const eventData = ref<EventData>({
    title: '',
    category: '',
    description: '',
    visibility: 'public',
    imageFile: null,
    imagePreviewUrl: null,
    owner_name: '',

    locationType: 'online',
    country: '',
    city: '',
    address: '',

    timezone: 'utc+1',
    dates: [{ id: Date.now(), starts_at: '', ends_at: '' }],

    isFree: true,
    currency: '',
    ticketCategories: [createEmptyTicketCategory()],
  })

  /** Erreurs de validation par étape */
  const validationErrors = ref<Record<string, string>>({})

  // ── Helpers ────────────────────────────────────────────────────────────

  function createEmptyTicketCategory(): TicketCategory {
    return {
      id: Date.now(),
      name: '',
      description: '',
      price: undefined,
      quantity: undefined,
      send_instructions: false,
      instructions: '',
    }
  }

  // ── Getters ────────────────────────────────────────────────────────────

  const stepErrors = computed(() => {
    const d = eventData.value
    const errors: Record<string, string> = {}

    if (currentStep.value === 1) {
      if (!d.title.trim()) errors.title = 'Le nom de l\'événement est requis.'
      if (!d.category) errors.category = 'Veuillez sélectionner une catégorie.'
    }

    if (currentStep.value === 2) {
      if (!d.country) errors.country = 'Veuillez sélectionner un pays.'
      if (d.locationType === 'in-person' && !d.city.trim())
        errors.city = 'La ville est requise pour un événement en présentiel.'
    }

    if (currentStep.value === 3) {
      if (!d.timezone) errors.timezone = 'Veuillez sélectionner un fuseau horaire.'
      d.dates.forEach((date, i) => {
        if (!date.starts_at) errors[`start-${i}`] = `La date de début est requise (créneau ${i + 1}).`
        if (!date.ends_at)   errors[`end-${i}`]   = `La date de fin est requise (créneau ${i + 1}).`
        if (date.starts_at && date.ends_at && date.ends_at <= date.starts_at)
          errors[`dates-${i}`] = `La fin doit être après le début (créneau ${i + 1}).`
      })
    }

    if (currentStep.value === 4 && !d.isFree) {
      if (!d.currency) errors.currency = 'Veuillez sélectionner une devise.'
      d.ticketCategories.forEach((cat, i) => {
        if (!cat.name.trim()) errors[`cat-name-${i}`] = `Le nom de la catégorie ${i + 1} est requis.`
        if (cat.price === undefined || cat.price < 0) errors[`cat-price-${i}`] = `Le prix de la catégorie ${i + 1} est invalide.`
        if (!cat.quantity || cat.quantity <= 0)  errors[`cat-qty-${i}`]   = `La quantité de la catégorie ${i + 1} est invalide.`
      })
    }

    return errors
  })

  const hasErrors = computed(() => Object.keys(stepErrors.value).length > 0)

  // ── Actions — Navigation ───────────────────────────────────────────────

  function goToStep(step: number) {
    validationErrors.value = {}
    // Empêche d'avancer si l'étape courante est invalide
    if (step > currentStep.value && hasErrors.value) {
      validationErrors.value = stepErrors.value
      return false
    }
    currentStep.value = step
    return true
  }

  function nextStep() { return goToStep(currentStep.value + 1) }
  function prevStep() { return goToStep(currentStep.value - 1) }

  // ── Actions — Dates ────────────────────────────────────────────────────

  function addDate() {
    eventData.value.dates.push({ id: Date.now(), starts_at: '', ends_at: '' })
  }

  function removeDate(id: number) {
    if (eventData.value.dates.length > 1)
      eventData.value.dates = eventData.value.dates.filter(d => d.id !== id)
  }

  // ── Actions — Ticket Categories ────────────────────────────────────────

  function addTicketCategory() {
    eventData.value.ticketCategories.push(createEmptyTicketCategory())
  }

  function removeTicketCategory(id: number) {
    if (eventData.value.ticketCategories.length > 1)
      eventData.value.ticketCategories = eventData.value.ticketCategories.filter(c => c.id !== id)
  }

  // ── Actions — Image ────────────────────────────────────────────────────

  function handleImageFile(file: File) {
    eventData.value.imageFile = file
    // Aperçu local immédiat
    const reader = new FileReader()
    reader.onload = (e) => {
      eventData.value.imagePreviewUrl = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    eventData.value.imageFile = null
    eventData.value.imagePreviewUrl = null
  }

  // ── Actions — Supabase Submit ──────────────────────────────────────────

  /**
   * Soumission principale :
   * 1. Upload de l'image dans le bucket "event-images"
   * 2. Insertion de l'événement dans `events`
   * 3. Insertion des créneaux dans `event_dates`
   * 4. Insertion des catégories de tickets dans `ticket_types`
   *
   * Les étapes 2–4 sont enchaînées manuellement.
   * Pour une vraie transaction atomique, utilisez une Supabase Edge Function
   * ou une fonction RPC PostgreSQL.
   */
  async function submitEvent(): Promise<{ success: boolean; eventId?: string }> {
    isLoading.value = true
    submitError.value = null
    submitSuccess.value = false

    const d = eventData.value

    try {
      // ── 1. Récupération de l'utilisateur connecté ──────────────────
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Vous devez être connecté pour créer un événement.')

      const displayName = user.user_metadata.full_name || user.email;

      // ── 2. Upload de l'image ───────────────────────────────────────
      let imagePath: string | null = null
      let imageUrl:  string | null = null

      if (d.imageFile) {
        const fileExt  = d.imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(fileName, d.imageFile, { upsert: false })

        if (uploadError) throw new Error(`Erreur upload image : ${uploadError.message}`)

        const { data: urlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(fileName)

        imagePath = fileName
        imageUrl  = urlData.publicUrl
      }

      // ── 3. Insertion de l'événement ────────────────────────────────
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          owner_id:      user.id,
          title:         d.title,
          description:   d.description,
          category:      d.category,
          visibility:    d.visibility,
          image_url:     imageUrl,
          image_path:    imagePath,
          location_type: d.locationType,
          country:       d.country || null,
          city:          d.locationType === 'in-person' ? d.city   : null,
          address:       d.locationType === 'in-person' ? d.address : null,
          timezone:      d.timezone,
          is_free:       d.isFree,
          currency:      d.isFree ? null : d.currency,
          status:        'published',
          owner_name:    displayName
        })
        .select('id')
        .single()

      if (eventError) throw new Error(`Erreur création événement : ${eventError.message}`)
      const eventId = event.id

      // ── 4. Insertion des créneaux horaires ─────────────────────────
      if (d.dates.length > 0) {
        const datesPayload = d.dates.map(dt => ({
          event_id:  eventId,
          starts_at: dt.starts_at,
          ends_at:   dt.ends_at,
        }))

        const { error: datesError } = await supabase
          .from('event_dates')
          .insert(datesPayload)

        if (datesError) throw new Error(`Erreur créneaux : ${datesError.message}`)
      }

      // ── 5. Insertion des catégories de tickets ─────────────────────
      if (!d.isFree && d.ticketCategories.length > 0) {
        const ticketsPayload = d.ticketCategories.map(cat => ({
          event_id:         eventId,
          name:             cat.name,
          description:      cat.description || null,
          price:            cat.price ?? 0,
          quantity:         cat.quantity ?? 0,
          send_instructions: cat.send_instructions,
          instructions:     cat.send_instructions ? cat.instructions : null,
        }))

        const { error: ticketsError } = await supabase
          .from('ticket_types')
          .insert(ticketsPayload)

        if (ticketsError) throw new Error(`Erreur tickets : ${ticketsError.message}`)
      }

      // ── Succès ─────────────────────────────────────────────────────
      submitSuccess.value = true
      return { success: true, eventId }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Une erreur inattendue est survenue.'
      submitError.value = message
      return { success: false }

    } finally {
      isLoading.value = false
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────

  function resetForm() {
    currentStep.value = 1
    submitSuccess.value = false
    submitError.value = null
    validationErrors.value = {}
    eventData.value = {
      title: '', category: '', description: '', visibility: 'public',
      imageFile: null, imagePreviewUrl: null, owner_name: '',
      locationType: 'online', country: '', city: '', address: '',
      timezone: 'utc+1',
      dates: [{ id: Date.now(), starts_at: '', ends_at: '' }],
      isFree: true, currency: '',
      ticketCategories: [createEmptyTicketCategory()],
    }
  }

  return {
    // State
    currentStep, isLoading, submitSuccess, submitError,
    eventData, validationErrors,
    // Getters
    stepErrors, hasErrors,
    // Actions
    goToStep, nextStep, prevStep,
    addDate, removeDate,
    addTicketCategory, removeTicketCategory,
    handleImageFile, clearImage,
    submitEvent, resetForm,
  }
})