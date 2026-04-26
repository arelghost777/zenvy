<script setup lang="ts">
import { ref } from 'vue'
import { Instagram, Twitter, Linkedin, ArrowRight } from 'lucide-vue-next'

const email = ref('')
</script>

<template>
  <footer class="bg-[#0B0C10] text-gray-400 py-20 border-t border-white/5">
    <div class="container mx-auto px-6">
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
        
        <div class="flex flex-col gap-5">
          <img src="/logo.png" alt="" width="100">
          <p class="text-sm leading-relaxed">
            L'expérience événementielle premium. Simplifiez la gestion, amplifiez l'impact.
          </p>
          <div class="relative">
            <input 
              v-model="email"
              type="email" 
              placeholder="Newsletter" 
              class="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-[#EF233C] transition-colors"
            />
            <button class="absolute right-2 top-2 p-1.5 bg-[#EF233C] text-white rounded-lg">
              <ArrowRight :size="16" />
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <h4 class="font-black text-white uppercase text-xs tracking-widest mb-6">Plateforme</h4>
          <ul class="space-y-3 text-sm">
            <li><a href="#" class="hover:text-[#EF233C] transition-colors">Découvrir les événements</a></li>
            <li><a href="#" class="hover:text-[#EF233C] transition-colors">Créer un événement</a></li>
            <li><a href="#" class="hover:text-[#EF233C] transition-colors">Tarifs</a></li>
            <li><a href="#" class="hover:text-[#EF233C] transition-colors">Support</a></li>
          </ul>
        </div>

        <div class="space-y-4">
          <h4 class="font-black text-white uppercase text-xs tracking-widest mb-6">Légal</h4>
          <ul class="space-y-3 text-sm">
            <li><a href="#" class="hover:text-[#EF233C] transition-colors">Confidentialité</a></li>
            <li><a href="#" class="hover:text-[#EF233C] transition-colors">Conditions d'utilisation</a></li>
            <li><a href="#" class="hover:text-[#EF233C] transition-colors">Cookies</a></li>
            <li><a href="#" class="hover:text-[#EF233C] transition-colors">Mentions légales</a></li>
          </ul>
        </div>

        <div class="space-y-6">
          <h4 class="font-black text-white uppercase text-xs tracking-widest mb-6">Suivez-nous</h4>
          <div class="flex gap-4">
            <a href="#" class="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#EF233C] hover:text-white transition-all">
              <Instagram :size="18" />
            </a>
            <a href="#" class="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#EF233C] hover:text-white transition-all">
              <Twitter :size="18" />
            </a>
            <a href="#" class="size-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#EF233C] hover:text-white transition-all">
              <Linkedin :size="18" />
            </a>
          </div>
        </div>
      </div>

      <div class="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-500">
        <p>© 2026 Zenvy. Tous droits réservés.</p>
        <div class="flex gap-6">
          <a href="#" class="hover:text-white">Français</a>
          <a href="#" class="hover:text-white">English</a>
        </div>
      </div>
    </div>
  </footer>
</template>