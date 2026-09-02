<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import jsPDF from 'jspdf'
import type { BookingData } from '@/types/orderTypes'
import {
  ChevronLeft, Loader2, CheckCircle2, Download, Ticket as TicketIcon, AlertCircle
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/clientSupabase'

const router = useRouter()

const booking = ref<BookingData | null>(null)
const step = ref<'form' | 'confirming' | 'done'>('form')
const errorMsg = ref('')

const form = ref({
  fullName: '',
  email: '',
  phone: '',
})

// Shape returned by the create-order Edge Function, enriched with a QR image
interface DisplayTicket {
  id: string
  ticketTypeName: string
  price: number
  uniqueCode: string
  qrPayload: { v: number; tid: string; kv: number; sig: string }
  qrDataUrl?: string
  clientName: string
  clientEmail: string
  clientPhone: string
}

const issuedTickets = ref<DisplayTicket[]>([])

onMounted(() => {
  const raw = sessionStorage.getItem('booking_data')
  if (!raw) {
    router.replace({ name: 'Events' })
    return
  }
  booking.value = JSON.parse(raw) as BookingData
})

const isFormValid = computed(() => {
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
  return form.value.fullName.trim().length > 1 && emailOk && form.value.phone.trim().length > 5
})

const handleSubmit = async () => {
  if (!booking.value || !isFormValid.value) return
  errorMsg.value = ''
  step.value = 'confirming'

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Vous devez être connecté pour réserver des billets.')
    }

    const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        event_id: Number(booking.value.event.id),
        items: booking.value.items.map((item) => ({
          ticketTypeId: Number(item.ticketTypeId),
          quantity: item.quantity,
        })),
        client_name: form.value.fullName,
        client_email: form.value.email,
        client_phone: form.value.phone,
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Impossible de finaliser la réservation.')
    }

    // Build the display list and generate one QR image per ticket from the
    // SIGNED payload returned by the server — never from a plain uniqueCode.
    const tickets: DisplayTicket[] = await Promise.all(
      data.tickets.map(async (t: any) => ({
        id: t.id,
        ticketTypeName: t.ticketTypeName,
        price: t.price,
        uniqueCode: t.uniqueCode,
        qrPayload: t.qrPayload,
        qrDataUrl: await QRCode.toDataURL(JSON.stringify(t.qrPayload), { margin: 1, width: 240 }),
        clientName: form.value.fullName,
        clientEmail: form.value.email,
        clientPhone: form.value.phone,
      }))
    )

    issuedTickets.value = tickets
    sessionStorage.removeItem('booking_data')
    step.value = 'done'
  } catch (e: any) {
    errorMsg.value = e.message || 'Une erreur est survenue pendant la réservation.'
    step.value = 'form'
  }
}

const downloadPdf = () => {
  if (!booking.value || issuedTickets.value.length === 0) return
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  issuedTickets.value.forEach((ticket, index) => {
    if (index > 0) doc.addPage()

    // Header band
    doc.setFillColor(43, 45, 66) // #2B2D42
    doc.rect(0, 0, 595, 110, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text(booking.value!.event.title, 40, 50)
    doc.setFontSize(11)
    doc.setTextColor(239, 35, 60) // #EF233C
    doc.text(ticket.ticketTypeName || '', 40, 75)

    // Details
    doc.setTextColor(30, 30, 30)
    doc.setFontSize(12)
    doc.text(`Titulaire : ${ticket.clientName}`, 40, 150)
    doc.text(`Email : ${ticket.clientEmail}`, 40, 170)
    if (ticket.clientPhone) doc.text(`Téléphone : ${ticket.clientPhone}`, 40, 190)
    doc.text(`Lieu : ${booking.value!.event.address || 'À confirmer'}`, 40, 210)
    doc.setFont('helvetica', 'bold')
    doc.text(`Code billet : ${ticket.uniqueCode}`, 40, 235)
    doc.setFont('helvetica', 'normal')

    // QR code — encodes the signed payload, verified server-side at scan time
    if (ticket.qrDataUrl) {
      doc.addImage(ticket.qrDataUrl, 'PNG', 380, 140, 160, 160)
    }

    doc.setDrawColor(200, 200, 200)
    doc.line(40, 320, 555, 320)
    doc.setFontSize(9)
    doc.setTextColor(140, 140, 140)
    doc.text(
      "Présentez ce billet (imprimé ou sur mobile) à l'entrée. Billet unique, à usage unique.",
      40,
      340
    )
  })

  const filename = `billets-${booking.value.event.title.replace(/\s+/g, '-').toLowerCase()}.pdf`
  doc.save(filename)
}
</script>

<template>
  <div class="min-h-screen bg-[#EDF2F4] pb-20">
    <div v-if="!booking" class="flex h-screen items-center justify-center">
      <Loader2 class="animate-spin text-[#EF233C] size-12" />
    </div>

    <div v-else class="max-w-4xl mx-auto px-4 pt-8">
      <button
        v-if="step !== 'done'"
        @click="router.back()"
        class="inline-flex items-center gap-2 text-[#8D99AE] hover:text-[#2B2D42] font-bold text-xs uppercase tracking-widest mb-6 transition-colors"
      >
        <ChevronLeft :size="16" /> Retour
      </button>

      <!-- STEP: order summary + form -->
      <div v-if="step === 'form' || step === 'confirming'" class="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div class="md:col-span-7 bg-white rounded p-8 border border-[#2B2D42]/5">
          <h1 class="text-2xl font-black text-[#2B2D42] mb-6">Finaliser votre réservation</h1>

          <div v-if="errorMsg" class="flex items-start gap-2 bg-red-50 text-[#D90429] text-sm font-medium p-4 rounded mb-6">
            <AlertCircle :size="18" class="shrink-0 mt-0.5" /> {{ errorMsg }}
          </div>

          <form @submit.prevent="handleSubmit" class="space-y-5">
            <div>
              <label class="block text-[10px] font-black uppercase text-[#8D99AE] mb-2">Nom complet</label>
              <input
                v-model="form.fullName"
                type="text"
                required
                placeholder="Jean Dupont"
                class="w-full border border-[#2B2D42]/10 rounded px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#EF233C]"
              />
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase text-[#8D99AE] mb-2">Email</label>
              <input
                v-model="form.email"
                type="email"
                required
                placeholder="jean@example.com"
                class="w-full border border-[#2B2D42]/10 rounded px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#EF233C]"
              />
            </div>
            <div>
              <label class="block text-[10px] font-black uppercase text-[#8D99AE] mb-2">Téléphone</label>
              <input
                v-model="form.phone"
                type="tel"
                required
                placeholder="+229 00 00 00 00"
                class="w-full border border-[#2B2D42]/10 rounded px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#EF233C]"
              />
            </div>

            <Button
              type="submit"
              :disabled="!isFormValid || step === 'confirming'"
              class="w-full bg-[#EF233C] hover:bg-[#D90429] text-white py-7 rounded font-black text-base disabled:opacity-50"
            >
              <Loader2 v-if="step === 'confirming'" class="animate-spin mr-2" :size="18" />
              {{ step === 'confirming' ? 'Traitement...' : 'Confirmer la réservation' }}
            </Button>
          </form>
        </div>

        <div class="md:col-span-5">
          <div class="bg-[#2B2D42] text-white rounded p-6 sticky top-8">
            <h2 class="font-black text-lg mb-4">{{ booking.event.title }}</h2>
            <div class="space-y-3 mb-6">
              <div
                v-for="item in booking.items"
                :key="item.ticketTypeId"
                class="flex justify-between text-sm border-b border-white/10 pb-2"
              >
                <span class="text-white/80">{{ item.name }} × {{ item.quantity }}</span>
                <span class="font-bold">{{ item.price * item.quantity }} {{ booking.event.currency }}</span>
              </div>
            </div>
            <div class="flex justify-between items-end pt-4 border-t border-white/10">
              <span class="text-xs uppercase text-white/40 font-bold tracking-widest">Total</span>
              <span class="text-2xl font-black">{{ booking.totalPrice }} {{ booking.event.currency }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP: confirmation + PDF download -->
      <div v-else class="bg-white rounded p-10 border border-[#2B2D42]/5 text-center">
        <CheckCircle2 :size="56" class="text-[#EF233C] mx-auto mb-4" />
        <h1 class="text-2xl font-black text-[#2B2D42] mb-2">Réservation confirmée !</h1>
        <p class="text-[#8D99AE] font-medium mb-8">
          {{ issuedTickets.length }} billet(s) généré(s) pour {{ booking.event.title }}.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
          <div
            v-for="ticket in issuedTickets"
            :key="ticket.id"
            class="border border-[#2B2D42]/10 rounded p-4 flex items-center gap-4"
          >
            <img :src="ticket.qrDataUrl" class="size-16 rounded" />
            <div>
              <p class="font-bold text-sm text-[#2B2D42] flex items-center gap-1">
                <TicketIcon :size="14" class="text-[#EF233C]" /> {{ ticket.ticketTypeName }}
              </p>
              <p class="text-xs text-[#8D99AE] font-mono">{{ ticket.uniqueCode }}</p>
            </div>
          </div>
        </div>

        <Button
          @click="downloadPdf"
          class="bg-[#EF233C] hover:bg-[#D90429] text-white py-7 px-8 rounded font-black text-base"
        >
          <Download :size="18" class="mr-2" /> Télécharger mes billets (PDF)
        </Button>
      </div>
    </div>
  </div>
</template>