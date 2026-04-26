<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { MapPinOff, ArrowLeft } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-[80vh] flex items-center justify-center px-6">
    <div class="text-center space-y-7 max-w-md animate-in fade-in zoom-in duration-700">
      
      <div class="relative inline-block">
        <div class="size-32 bg-gray-50 rounded-[40px] flex items-center justify-center mx-auto shadow-inner border border-gray-100">
          <MapPinOff :size="48" class="text-danger" stroke-width="1.5" />
        </div>
        <span class="absolute -top-2 -right-2 bg-[#2B2D42] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
          Erreur 404
        </span>
      </div>

      <div class="space-y-3">
        <h3 class="text-4xl font-black text-primary tracking-tighter">Événement introuvable</h3>
        <p class="text-gray-400 text-sm font-medium leading-relaxed">
          Il semble que ce ticket soit déjà expiré ou que l'adresse de l'événement soit incorrecte.
        </p>
      </div>

      <div class="pt-4">
        <Button 
          variant="outline" 
          class="rounded-2xl border-gray-200 py-6 px-8 font-bold hover:bg-primary hover:text-white transition-all gap-2 group"
          @click="$router.push('/')"
        >
          <ArrowLeft :size="18" class="group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </Button>
      </div>

    </div>
  </div>
</template>