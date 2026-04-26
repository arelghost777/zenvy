export interface TicketCategory {
  id: number
  name: string
  description: string
  price: number | undefined
  quantity: number | undefined
  send_instructions: boolean
  instructions: string
}

export interface EventDate {
  id: number
  starts_at: string
  ends_at: string
}

export interface EventData {
  // Étape 1 — Description
  title: string
  description: string
  category: string
  visibility: 'public' | 'private'
  imageFile: File | null
  imagePreviewUrl: string | null
  owner_name: string

  // Étape 2 — Lieu
  locationType: 'online' | 'in-person'
  country: string
  city: string
  address: string

  // Étape 3 — Dates
  timezone: string
  dates: EventDate[]

  // Étape 4 — Billetterie
  isFree: boolean
  currency: string
  ticketCategories: TicketCategory[]
}

export interface EventType {
  id: number
  owner_id: string
  owner_name: string
  title: string
  description: string
  category: string
  visibility: 'public' | 'private'
  image_url: string | null
  location_type: 'online' | 'in-person'
  country: string
  city: string
  address: string
  timezone: string
  is_free: boolean
  currency: string
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  dates: EventDate[]
  ticket_types: TicketCategory[]
}