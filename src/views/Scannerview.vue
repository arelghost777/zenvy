<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-vue-next'
import { supabase } from '@/lib/supabase/clientSupabase'

const route = useRoute()
const eventId = Number(route.params.eventId)

type ResultState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'valid'; ticketType: string; holderName: string }
  | { kind: 'already_used'; firstScannedAt?: string }
  | { kind: 'rejected'; status: string; message: string }

const result = ref<ResultState>({ kind: 'idle' })
const deviceId = ref<string>('')
let scanner: Html5Qrcode | null = null
let locked = false // avoids firing multiple scans for the same frame burst

const REGION_ID = 'qr-reader-region'

onMounted(async () => {
  deviceId.value = localStorage.getItem('scanner_device_id') || crypto.randomUUID()
  localStorage.setItem('scanner_device_id', deviceId.value)

  scanner = new Html5Qrcode(REGION_ID)
  await scanner.start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    onScanSuccess,
    () => {} // ignore per-frame decode failures, they're just "no QR in view"
  )
})

onBeforeUnmount(() => {
  scanner?.stop().catch(() => {})
})

async function onScanSuccess(decodedText: string) {
  if (locked) return
  locked = true
  result.value = { kind: 'checking' }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/check-in-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ qr_data: decodedText, event_id: eventId, device_id: deviceId.value }),
    })
    const data = await res.json()

    if (data.success) {
      result.value = {
        kind: 'valid',
        ticketType: data.ticket?.ticket_type ?? '',
        holderName: data.ticket?.holder_name ?? '',
      }
    } else if (data.status === 'ALREADY_USED') {
      result.value = { kind: 'already_used', firstScannedAt: data.first_scanned_at }
    } else {
      result.value = { kind: 'rejected', status: data.status, message: data.message }
    }
  } catch {
    result.value = { kind: 'rejected', status: 'ERROR', message: 'Connexion impossible, réessayez.' }
  }

  // brief pause before accepting the next scan
  setTimeout(() => {
    locked = false
    result.value = { kind: 'idle' }
  }, 2200)
}
</script>

<template>
  <div class="min-h-screen bg-[#2B2D42] flex flex-col">
    <div :id="REGION_ID" class="w-full aspect-square max-w-md mx-auto mt-6 rounded overflow-hidden" />

    <div class="flex-1 flex items-center justify-center p-6">
      <div v-if="result.kind === 'idle'" class="text-white/40 text-sm font-medium text-center">
        Visez le QR code du billet
      </div>

      <div v-else-if="result.kind === 'checking'" class="text-white flex flex-col items-center gap-3">
        <Loader2 class="animate-spin" :size="40" />
        <p class="font-bold text-sm uppercase tracking-widest">Vérification...</p>
      </div>

      <div v-else-if="result.kind === 'valid'" class="w-full max-w-sm bg-emerald-500 rounded-2xl p-8 text-center text-white">
        <CheckCircle2 :size="56" class="mx-auto mb-3" />
        <p class="text-2xl font-black">BILLET VALIDE</p>
        <p class="font-bold uppercase text-sm mt-2">{{ result.ticketType }}</p>
        <p class="mt-1">{{ result.holderName }}</p>
        <p class="text-xs font-bold uppercase tracking-widest mt-4 opacity-80">Entrée autorisée</p>
      </div>

      <div v-else-if="result.kind === 'already_used'" class="w-full max-w-sm bg-[#EF233C] rounded-2xl p-8 text-center text-white">
        <XCircle :size="56" class="mx-auto mb-3" />
        <p class="text-2xl font-black">BILLET DÉJÀ UTILISÉ</p>
        <p class="text-sm mt-2 opacity-90">Ce billet a déjà été présenté.</p>
        <p v-if="result.firstScannedAt" class="text-xs mt-2 opacity-70">
          Premier scan : {{ new Date(result.firstScannedAt).toLocaleTimeString('fr-FR') }}
        </p>
      </div>

      <div v-else-if="result.kind === 'rejected'" class="w-full max-w-sm bg-[#EF233C] rounded-2xl p-8 text-center text-white">
        <AlertTriangle :size="56" class="mx-auto mb-3" />
        <p class="text-2xl font-black">BILLET INVALIDE</p>
        <p class="text-sm mt-2 opacity-90">{{ result.message }}</p>
      </div>
    </div>
  </div>
</template>