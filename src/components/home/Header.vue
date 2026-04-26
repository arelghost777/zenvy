<script setup lang="ts">
import { ref } from 'vue'
import { 
  Search, SlidersHorizontal, PlusCircle, Users, Bell, Heart, 
  Menu, User, MapPin, Globe, Facebook, Instagram, Linkedin, 
  Music, Theater, GraduationCap, Wine, Mountain, Dumbbell, Tent, Atom, ChevronRight 
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const activeTab = ref('events')
const activeCategory = ref('Toutes')

const categories = [
  { name: 'Toutes', icon: Menu },
  { name: 'Concert', icon: Music },
  { name: 'Culture', icon: Theater },
  { name: 'Formation', icon: GraduationCap },
  { name: 'Soirée', icon: Wine },
  { name: 'Tourisme', icon: Mountain },
  { name: 'Sport', icon: Dumbbell },
  { name: 'Festival', icon: Tent },
  { name: 'Science', icon: Atom },
]
</script>

<template>
  <header class="w-full bg-[#EDF2F4] border-b border-[#2B2D42]/10">
    <div class="hidden md:flex items-center justify-between px-6 py-2 border-b border-[#2B2D42]/5 text-[11px] font-bold text-[#8D99AE]">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-1 cursor-pointer hover:text-[#2B2D42] transition-colors">
          <MapPin :size="14" class="text-[#EF233C]" /> Bénin <span class="ml-0.5 opacity-50">▼</span>
        </div>
        <div class="flex items-center gap-1 cursor-pointer hover:text-[#2B2D42] transition-colors">
          <Globe :size="14" /> FR <span class="ml-0.5 opacity-50">▼</span>
        </div>
      </div>
      
      <div class="">
        <div class="flex items-center gap-3 border-r border-[#2B2D42]/10 pr-6">
          <Facebook :size="14" class="hover:text-[#EF233C] cursor-pointer transition-colors" />
          <Instagram :size="14" class="hover:text-[#EF233C] cursor-pointer transition-colors" />
          <Linkedin :size="14" class="hover:text-[#EF233C] cursor-pointer transition-colors" />
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between px-4 md:px-8 py-5 gap-4">
      <div class="flex-shrink-0">
        <span class="text-2xl font-black tracking-tighter text-[#2B2D42]">
          TIKER<span class="text-[#EF233C]">AMA</span>
        </span>
      </div>

      <div class="hidden lg:flex flex-1 max-w-2xl relative group">
        <div class="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 px-2.5 py-1 bg-[#EF233C]/5 border border-[#EF233C]/10 rounded-md text-[#EF233C]">
          <SlidersHorizontal :size="14" />
        </div>
        <Input 
          placeholder="Rechercher un concert, une formation, un festival..." 
          class="w-full bg-white border-[#2B2D42]/10 pl-16 pr-12 py-6 rounded-full focus-visible:ring-[#EF233C]/20 shadow-sm placeholder:text-[#8D99AE]/60 text-[#2B2D42]"
        />
        <button class="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#EF233C] hover:bg-[#D90429] rounded-full transition-all shadow-md active:scale-95">
          <Search :size="18" class="text-white" />
        </button>
      </div>

      <div class="flex items-center gap-2 md:gap-4">
        <Button class="bg-[#EF233C] hover:bg-[#D90429] text-white rounded-full px-6 font-bold hidden sm:flex shadow-lg shadow-[#EF233C]/20 border-none transition-transform active:scale-95">
          Publier un événement
        </Button>
        
        <div class="flex items-center gap-1 md:gap-2 px-2">
          <button class="p-2.5 hover:bg-white rounded-full relative text-[#2B2D42] transition-colors">
            <Users :size="20" />
          </button>
          <button class="p-2.5 hover:bg-white rounded-full relative text-[#2B2D42] transition-colors">
            <Bell :size="20" />
            <span class="absolute top-1.5 right-1.5 size-4 bg-[#D90429] text-[9px] font-black text-white flex items-center justify-center rounded-full border-2 border-[#EDF2F4]">4</span>
          </button>
          <button class="p-2.5 hover:bg-white rounded-full text-[#2B2D42] transition-colors">
            <Heart :size="20" />
          </button>
        </div>

        <button class="flex items-center gap-2 p-1.5 pl-3 bg-white border border-[#2B2D42]/10 rounded-full hover:shadow-md transition-all">
          <Menu :size="18" class="text-[#2B2D42]" />
          <div class="size-8 bg-[#2B2D42] rounded-full flex items-center justify-center text-white">
            <User :size="16" />
          </div>
        </button>
      </div>
    </div>

    <div class="flex flex-col items-center pb-8 space-y-8 mt-2">
      <div class="inline-flex p-1.5 bg-[#2B2D42]/5 rounded-full border border-[#2B2D42]/5 relative">
        <button 
          @click="activeTab = 'events'"
          :class="[activeTab === 'events' ? 'bg-white text-[#2B2D42] shadow-sm' : 'text-[#8D99AE] hover:text-[#2B2D42]']"
          class="px-10 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all"
        >
          Événements
        </button>
        <button 
          @click="activeTab = 'cotisations'"
          :class="[activeTab === 'cotisations' ? 'bg-white text-[#2B2D42] shadow-sm' : 'text-[#8D99AE] hover:text-[#2B2D42]']"
          class="px-10 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
        >
          Cotisations
          <Badge class="bg-[#EF233C] text-white text-[8px] px-1.5 h-3.5 border-none font-bold">NEW</Badge>
        </button>
      </div>

      <div class="w-full max-w-7xl px-6 relative">
        <div class="flex items-center gap-4 overflow-x-auto no-scrollbar py-4 justify-center">
          <button 
            v-for="cat in categories" 
            :key="cat.name"
            @click="activeCategory = cat.name"
            :class="[activeCategory === cat.name ? 'border-[#EF233C] bg-white text-[#EF233C] shadow-md scale-105' : 'border-transparent bg-white text-[#8D99AE] hover:border-[#2B2D42]/20 hover:text-[#2B2D42] shadow-sm']"
            class="flex flex-col items-center justify-center min-w-[110px] py-2 border-2 transition-all duration-300 space-y-3 group"
          >
            <component :is="cat.icon" :size="24" :class="activeCategory === cat.name ? 'text-[#EF233C]' : 'text-[#8D99AE] group-hover:text-[#EF233C]'" />
            <span class="text-[11px] font-black uppercase tracking-tighter">{{ cat.name }}</span>
          </button>
        </div>
        
        <button class="absolute -right-2 top-1/2 -translate-y-1/2 size-12 bg-white rounded-full flex items-center justify-center border border-[#2B2D42]/10 hover:bg-[#EDF2F4] transition-all shadow-xl z-10">
          <ChevronRight :size="20" class="text-[#2B2D42]" />
        </button>
      </div>

      <div class="text-[#2B2D42] text-[11px] font-black uppercase tracking-[0.2em] opacity-40">
        222 événements trouvés
      </div>
    </div>
  </header>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Optionnel : petite ombre douce pour les cartes au survol */
button {
  -webkit-tap-highlight-color: transparent;
}
</style>