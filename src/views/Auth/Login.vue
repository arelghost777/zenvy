<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/helpers/AuthHelpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const showPassword = ref(false)

// Petit traducteur pour rester dans l'élégance
const translateError = (err: any) => {
  const msg = err.message || ""
  if (msg.includes("Invalid login credentials")) return "Email ou mot de passe incorrect."
  if (msg.includes("Email not confirmed")) return "Veuillez confirmer votre email avant de vous connecter."
  return "Une erreur est survenue. Veuillez réessayer."
}

const handleLogin = async () => {
  errorMessage.value = null
  isLoading.value = true
  
  try {
    await authService.signIn(email.value, password.value)
    router.push('/dashboard') // Redirection après succès
  } catch (error: any) {
    errorMessage.value = translateError(error)
  } finally {
    isLoading.value = false
  }
}

const handleGoogleLogin = async () => {
  errorMessage.value = null
  try {
    await authService.signInWithGoogle()
  } catch (error) {
    errorMessage.value = "La connexion avec Google a échoué."
  }
}
</script>

<template>
  <div class="mx-auto flex w-full flex-col justify-center space-y-7 sm:w-[380px]">
    
    <div class="flex flex-col space-y-2 text-center md:text-left">
      <h1 class="text-3xl font-black tracking-tighter text-primary">Bon retour !</h1>
      <p class="text-sm text-gray-400 font-medium">
        Entrez vos identifiants pour accéder à <span class="text-danger font-black">Zenvy</span>
      </p>
    </div>

    <div v-if="errorMessage" 
      class="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in fade-in slide-in-from-top-2"
    >
      <AlertCircle :size="16" class="shrink-0" />
      {{ errorMessage }}
    </div>

    <div class="grid gap-6">
      <form @submit.prevent="handleLogin">
        <div class="grid gap-4">
          
          <div class="grid gap-2">
            <Label for="email" class="text-[11px] font-black uppercase text-primary/50 ml-1">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="nom@exemple.com"
              required
              :class="{'border-red-400 bg-red-50/30': errorMessage}"
              class="h-12 rounded-xl transition-all"
            />
          </div>

          <div class="grid gap-2">
            <div class="flex items-center justify-between ml-1">
              <Label for="password" class="text-[11px] font-black uppercase text-primary/50">Mot de passe</Label>
              <router-link to="/forgot-password" class="text-[11px] text-gray-400 hover:text-primary font-bold transition-colors">
                Oublié ?
              </router-link>
            </div>
            <div class="relative">
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                required
                :class="{'border-red-400 bg-red-50/30': errorMessage}"
                class="h-12 rounded-xl pr-10 transition-all"
              />
              <button 
                type="button" 
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <Eye v-if="!showPassword" :size="18" />
                <EyeOff v-else :size="18" />
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            :disabled="isLoading"
            class="w-full bg-primary hover:bg-primary/95 text-white font-black py-7 rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-5 w-5 animate-spin" />
            <span v-else>Se connecter au compte</span>
          </Button>
        </div>
      </form>

      <div class="relative">
        <div class="absolute inset-0 flex items-center"><Separator class="bg-gray-100" /></div>
        <div class="relative flex justify-center text-[10px] uppercase tracking-widest font-black text-gray-400">
          <span class="bg-white px-4">Ou continuer avec</span>
        </div>
      </div>

      <Button 
        type="button" 
        variant="outline" 
        @click="handleGoogleLogin"
        :disabled="isLoading"
        class="w-full border-gray-100 bg-white hover:bg-gray-50 text-primary py-7 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
          <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
        </svg>
        Google
      </Button>
    </div>

    <p class="text-center text-xs text-gray-400 font-medium">
      Pas encore de compte ?
      <router-link to="/signup" class="text-primary font-black hover:text-danger transition-colors ml-1">
        S'inscrire
      </router-link>
    </p>
  </div>
</template>