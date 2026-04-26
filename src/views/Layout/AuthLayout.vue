<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Ticket, ChevronLeft } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4 md:p-0">
    <div class="max-w-5xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] my-5">
      
      <div class="hidden md:flex md:w-1/2 bg-primary relative overflow-hidden p-12 flex-col justify-between">
        <div class="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-secondary/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

        <div class="relative z-10">
          <div class="flex items-center gap-2 text-white mb-8">
            <img src="/logo.png" alt="" width="100">
          </div>
          <h3 class="text-4xl font-bold text-secondary leading-tight">
            Accédez aux meilleurs <span class="text-danger">événements</span> en un clic.
          </h3>
        </div>

        <div class="relative z-10 mt-auto">
          <p class="text-secondary text-sm italic opacity-60">
            "La meilleure plateforme pour vos concerts, festivals et conférences."
          </p>
        </div>
      </div>

      <div class="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
        
<button 
  @click="router.back()" 
  class="flex items-center gap-3 text-primary transition-all font-black text-[10px] uppercase tracking-[0.2em] mb-10 w-fit group p-1 pr-4 rounded-full hover:bg-white hover:shadow-md hover:shadow-primary/5 border border-transparent hover:border-primary/5 active:scale-95"
>
  <div class="size-8 rounded-full bg-background flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
    <ChevronLeft :size="16" />
  </div>

  <span class="group-hover:translate-x-1 transition-transform duration-300">
    Retour
  </span>
</button>

        <div class="flex-1 flex flex-col justify-center">
          <router-view />
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ajout d'une petite transition sur le router-view pour fluidifier le changement de page */
.router-view-container {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>