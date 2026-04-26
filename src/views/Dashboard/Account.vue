<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/helpers/AuthHelpers'
import { 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  Camera, 
  Loader2, 
  CheckCircle2,
  AlertCircle
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const router = useRouter()
const user = ref<any>(null)
const isLoading = ref(true)
const isUpdating = ref(false)
const message = ref<{ type: 'success' | 'error', text: string } | null>(null)

onMounted(async () => {
  const currentUser = await authService.getCurrentUser()
  if (!currentUser) {
    router.push('/login')
  } else {
    user.value = currentUser
  }
  isLoading.value = false
})

const handleSignOut = async () => {
  try {
    await authService.signOut()
    router.push('/login')
  } catch (error) {
    console.error("Erreur de déconnexion", error)
  }
}

const handleResetPassword = async () => {
  if (!user.value?.email) return
  isUpdating.value = true
  try {
    await authService.resetPassword(user.value.email)
    message.value = { type: 'success', text: 'Lien de réinitialisation envoyé par email !' }
  } catch (error) {
    message.value = { type: 'error', text: 'Impossible d\'envoyer l\'email.' }
  } finally {
    isUpdating.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F8F9FA] pb-20">
    <div class="bg-white border-b border-gray-100 pt-12 pb-6 mb-8">
      <div class="container mx-auto px-4 max-w-4xl">
        <h1 class="text-3xl font-black text-[#2B2D42] tracking-tighter">Mon Compte</h1>
        <p class="text-[#8D99AE] text-sm font-medium">Gérez vos informations personnelles et votre sécurité.</p>
      </div>
    </div>

    <div class="container mx-auto px-4 max-w-4xl">
      <div v-if="isLoading" class="flex justify-center py-20">
        <Loader2 class="animate-spin text-[#EF233C]" :size="40" />
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div class="space-y-6">
          <div class="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 text-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-[#EF233C]"></div>
            
            <div class="relative inline-block mb-4 group">
              <img 
                :src="user?.user_metadata?.avatar_url" 
                class="size-28 rounded-full object-cover border-4 border-gray-50 shadow-sm"
                alt="Avatar"
              />
              <button class="absolute bottom-0 right-0 size-8 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-[#2B2D42] hover:text-[#EF233C] transition-colors">
                <Camera :size="16" />
              </button>
            </div>
            
            <h2 class="text-xl font-black text-[#2B2D42] leading-tight">
              {{ user?.user_metadata?.full_name || 'Utilisateur' }}
            </h2>
            <p class="text-xs font-bold text-[#8D99AE] uppercase tracking-widest mt-1">Membre</p>
          </div>
        </div>

        <div class="md:col-span-2 space-y-6">
          
          <div v-if="message" 
            :class="message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'"
            class="p-4 rounded-2xl border flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-2"
          >
            <CheckCircle2 v-if="message.type === 'success'" :size="18" />
            <AlertCircle v-else :size="18" />
            {{ message.text }}
          </div>

          <div class="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div class="flex items-center gap-3 mb-8">
              <div class="size-10 bg-[#2B2D42] text-white rounded-xl flex items-center justify-center">
                <User :size="20" />
              </div>
              <h3 class="text-lg font-black text-[#2B2D42]">Informations personnelles</h3>
            </div>

            <div class="grid gap-6">
              <div class="grid gap-2">
                <Label class="text-[11px] font-black uppercase text-gray-400 ml-1">Nom complet</Label>
                <div class="relative">
                  <Input 
                    :value="user?.user_metadata?.full_name" 
                    readonly
                    class="h-12 rounded-xl bg-gray-50 border-none pl-11 font-medium text-[#2B2D42]"
                  />
                  <User class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
                </div>
              </div>

              <div class="grid gap-2">
                <Label class="text-[11px] font-black uppercase text-gray-400 ml-1">Adresse Email</Label>
                <div class="relative">
                  <Input 
                    :value="user?.email" 
                    readonly
                    class="h-12 rounded-xl bg-gray-50 border-none pl-11 font-medium text-[#2B2D42]"
                  />
                  <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
                </div>
                <p class="text-[10px] text-gray-400 mt-1 ml-1 flex items-center gap-1">
                  <CheckCircle2 :size="12" class="text-green-500" /> Email vérifié via Supabase Auth
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
            <div class="flex items-center gap-3 mb-8">
              <div class="size-10 bg-[#EF233C] text-white rounded-xl flex items-center justify-center">
                <Lock :size="20" />
              </div>
              <h3 class="text-lg font-black text-[#2B2D42]">Sécurité du compte</h3>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div class="text-center sm:text-left">
                <p class="text-sm font-bold text-[#2B2D42]">Mot de passe</p>
                <p class="text-xs text-[#8D99AE]">Dernière modification : il y a longtemps</p>
              </div>
              <Button 
                @click="handleResetPassword" 
                :disabled="isUpdating"
                variant="outline" 
                class="rounded-xl font-bold border-gray-200 hover:bg-white hover:shadow-sm"
              >
                <Loader2 v-if="isUpdating" class="mr-2 h-4 w-4 animate-spin" />
                Réinitialiser
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>