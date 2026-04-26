import { supabase } from "@/lib/clientSupabase"
import type { EventType } from "@/types/eventTypes"

export const eventService = {

  async getUserEvents(): Promise<EventType[]> {
    // 1. Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) throw new Error("Utilisateur non connecté")

    // 2. Requête typée sur la table 'events'
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        dates: event_dates (id, starts_at, ends_at),
        ticket_types: ticket_types (id, name, description, price, quantity, send_instructions, instructions)
      `)
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Erreur Supabase:", error.message)
      throw error
    }

    // On cast le résultat pour correspondre à notre interface étendue
    return data as unknown as EventType[]
  },

  async uploadEventImage(file: File): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non connecté')

  const ext      = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(fileName, file, { upsert: false })

  if (uploadError) throw new Error(`Erreur upload : ${uploadError.message}`)

  const { data: urlData } = supabase.storage
    .from('event-images')
    .getPublicUrl(fileName)

  return urlData.publicUrl
  },

  async updateEvent(id: number, payload: Partial<EventType>): Promise<void> {
    const { dates, ticket_types, ...eventFields } = payload as EventType

    // 1. Mettre à jour les champs de l'événement (sans les relations)
    const { error: eventError } = await supabase
      .from('events')
      .update(eventFields)
      .eq('id', id)
    if (eventError) throw eventError

    // 2. Gérer les dates ─────────────────────────────────────────────────────
    if (dates) {
      const newDates     = dates.filter(d => d.id < 0).map(({ id: _, ...d }) => ({ ...d, event_id: id }))
      const existingDates = dates.filter(d => d.id > 0)

      // Supprimer les dates qui ne sont plus dans le formulaire
      const keptIds = existingDates.map(d => d.id)
      const { error: delDateErr } = await supabase
        .from('event_dates')
        .delete()
        .eq('event_id', id)
        .not('id', 'in', `(${keptIds.join(',')})`)
      if (delDateErr && keptIds.length > 0) throw delDateErr

      // Mettre à jour les dates existantes
      for (const date of existingDates) {
        const { error } = await supabase
          .from('event_dates')
          .update({ starts_at: date.starts_at, ends_at: date.ends_at })
          .eq('id', date.id)
        if (error) throw error
      }

      // Insérer les nouvelles dates
      if (newDates.length > 0) {
        const { error: insDateErr } = await supabase
          .from('event_dates')
          .insert(newDates)
        if (insDateErr) throw insDateErr
      }
    }

    // 3. Gérer les ticket_types ───────────────────────────────────────────────
    if (ticket_types) {
      const newTickets      = ticket_types.filter(t => t.id < 0).map(({ id: _, ...t }) => ({ ...t, event_id: id }))
      const existingTickets = ticket_types.filter(t => t.id > 0)

      // Supprimer les tickets qui ne sont plus dans le formulaire
      const keptIds = existingTickets.map(t => t.id)
      const { error: delTickErr } = await supabase
        .from('ticket_types')
        .delete()
        .eq('event_id', id)
        .not('id', 'in', `(${keptIds.join(',')})`)
      if (delTickErr && keptIds.length > 0) throw delTickErr

      // Mettre à jour les tickets existants
      for (const ticket of existingTickets) {
        const { error } = await supabase
          .from('ticket_types')
          .update({
            name:              ticket.name,
            description:       ticket.description,
            price:             ticket.price,
            quantity:          ticket.quantity,
            send_instructions: ticket.send_instructions,
            instructions:      ticket.instructions,
          })
          .eq('id', ticket.id)
        if (error) throw error
      }

      // Insérer les nouveaux tickets
      if (newTickets.length > 0) {
        const { error: insTickErr } = await supabase
          .from('ticket_types')
          .insert(newTickets)
        if (insTickErr) throw insTickErr
      }
    }
  },
  async deleteEvent(id: number): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  if (error) throw error
  },
  async getPublicEvents(filters: { search?: string; category?: string } = {}): Promise<EventType[]> {
    let query = supabase
      .from('events')
      .select(`
        *,
        dates: event_dates (id, starts_at, ends_at),
        ticket_types: ticket_types (id, name, price)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (filters.category && filters.category !== 'Toutes') {
      query = query.ilike('category', filters.category)
    }

    if (filters.search?.trim()) {
      query = query.ilike('title', `%${filters.search.trim()}%`)
    }

    const { data, error } = await query
    if (error) throw error
    return data as unknown as EventType[]
  },
  // @/services/eventService.ts
  async getEventById(id: string): Promise<EventType | null> {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        dates: event_dates (id, starts_at, ends_at),
        ticket_types: ticket_types (id, name, description, price, quantity, instructions)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data as unknown as EventType
  }
}