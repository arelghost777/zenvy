<script setup lang="ts">
// On importe le layout créé précédemment
// Import des composants UI standards
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { authService } from '@/helpers/AuthHelpers'
// Import de l'icône de chargement pour le bouton
import { Loader2 } from 'lucide-vue-next'
import { ref } from 'vue'

// Gestion de l'état du formulaire
const email = ref('')
const password = ref('')
const isLoading = ref(false)

// Fonction de soumission du formulaire classique
const handleLogin = async () => {
  isLoading.value = true
  await authService.signIn(email.value, password.value)
  isLoading.value = false
}

// Fonction de connexion Google
const handleGoogleLogin = async () => {
    isLoading.value = true
    await authService.signInWithGoogle()
    isLoading.value = false
}
</script>

<template>
    <div class="mx-auto flex w-full flex-col justify-center space-y-7 sm:w-[380px]">
      
      <div class="flex flex-col space-y-2 text-center md:text-left">
        <h1 class="text-3xl font-extrabold tracking-tight text-primary">
          Bon retour !
        </h1>
        <p class="max-sm:text-xs text-sm text-gray-400">
          Entrez vos identifiants pour accéder à <span class="text-danger font-bold">Zenvy</span>
        </p>
      </div>

      <div class="grid gap-6">
        <form @submit.prevent="handleLogin">
          <div class="grid gap-4">
            
            <div class="grid gap-2">
              <Label for="email" class="text-primary font-medium">Email</ Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="nom@exemple.com"
                autocapitalize="none"
                autocomplete="email"
                autocorrect="off"
                required
                class="border-secondary focus:border-accent focus:ring-accent"
              />
            </div>

            <div class="grid gap-2">
              <div class="flex items-center justify-between">
                <Label for="password" class="text-primary font-medium">Mot de passe</Label>
                <a href="#" class="text-xs text-gray-400 hover:underline font-medium">
                  Oublié ?
                </a>
              </div>
              <Input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                required
                class="border-secondary focus:border-accent focus:ring-accent"
              />
            </div>

            <Button 
              type="submit" 
              :disabled="isLoading"
              class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-6 transition-all shadow-lg hover:shadow-primary/20"
            >
              <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
              <span v-else>Se connecter</span>
            </Button>
          </div>
        </form>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <Separator class="w-full bg-gray-300" />
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span class="bg-white px-2 text-gray-400 font-medium">
              Ou continuer avec
            </span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          @click="handleGoogleLogin"
          class="w-full border-accent hover:bg-accent hover:border-1 hover:border-primary/10 cursor-pointer text-primary py-6 flex items-center justify-center gap-3 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Continuer avec Google
        </Button>
      </div>

      <p class="px-8 text-center text-sm text-gray-400">
        Pas encore de compte ?
        <router-link to="/signup" class="text-blue-400 font-bold hover:underline">
          S'inscrire gratuitement
        </router-link>
      </p>
    </div>
</template>