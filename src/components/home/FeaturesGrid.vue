<script setup lang="ts">
import { Zap, Lock, LayoutDashboard, QrCode, Headphones, Globe } from 'lucide-vue-next'

const features = [
  {
    icon: Zap,
    emoji: '⚡',
    bg: '#EEEDFE',
    color: '#534AB7',
    title: 'Création rapide',
    description: 'Lancez votre billetterie en moins de 5 minutes, sans compétence technique.',
  },
  {
    icon: Lock,
    emoji: '🔒',
    bg: '#E1F5EE',
    color: '#0F6E56',
    title: 'Paiement sécurisé',
    description: 'Transactions chiffrées et multiples modes de paiement acceptés.',
  },
  {
    icon: LayoutDashboard,
    emoji: '📊',
    bg: '#E6F1FB',
    color: '#185FA5',
    title: 'Tableau de bord',
    description: 'Suivez vos ventes, participants et revenus en temps réel.',
  },
  {
    icon: QrCode,
    emoji: '📱',
    bg: '#FAEEDA',
    color: '#854F0B',
    title: 'QR code intégré',
    description: 'Billets électroniques avec QR code pour un contrôle d\'accès sans faille.',
  },
  {
    icon: Globe,
    emoji: '🌍',
    bg: '#FAECE7',
    color: '#993C1D',
    title: 'Multi-pays',
    description: 'Vendez vos billets partout en Afrique et dans le monde entier.',
  },
  {
    icon: Headphones,
    emoji: '🎧',
    bg: '#FBEAF0',
    color: '#993556',
    title: 'Support dédié',
    description: 'Une équipe disponible pour vous accompagner à chaque étape.',
  },
]
</script>

<template>
  <div>
    <p class="text-xs font-bold uppercase tracking-widest text-primary/40 mb-2">Pourquoi nous choisir</p>
    <h2 class="text-2xl font-bold text-primary tracking-tight mb-8">Simple, rapide, sécurisé</h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="feat in features"
        :key="feat.title"
        class="bg-white rounded-2xl border border-primary/10 p-6 hover:border-primary/25
               hover:-translate-y-0.5 transition-all duration-200"
      >
        <div
          class="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
          :style="{ background: feat.bg }"
        >
          {{ feat.emoji }}
        </div>
        <h3 class="text-sm font-bold text-primary mb-2">{{ feat.title }}</h3>
        <p class="text-xs text-primary/50 leading-relaxed">{{ feat.description }}</p>
      </div>
    </div>
  </div>
</template>