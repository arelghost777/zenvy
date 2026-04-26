<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/helpers/AuthHelpers'
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)
const isSuccess = ref(false)
const showPassword = ref(false)

const formData = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  terms: false
})

// Validation simple avant envoi
const isPasswordMatch = computed(() => 
  formData.value.password === formData.value.confirmPassword
)

// Traducteur d'erreurs Supabase
const translateError = (err: any) => {
  const code = err.message || err.code
  if (code.includes('already registered')) return "Cet email est déjà utilisé par un autre compte."
  if (code.includes('Password should be')) return "Le mot de passe doit faire au moins 6 caractères."
  if (code.includes('valid email')) return "Veuillez entrer une adresse email valide."
  return "Une erreur est survenue lors de l'inscription. Réessayez."
}

const handleSignUp = async () => {
  errorMessage.value = null
  
  // 1. Validation locale
  if (!isPasswordMatch.value) {
    errorMessage.value = "Les mots de passe ne correspondent pas."
    return
  }
  if (!formData.value.terms) {
    errorMessage.value = "Vous devez accepter les conditions d'utilisation."
    return
  }

  isLoading.value = true
  try {
    await authService.signUp(formData.value.email, formData.value.password, formData.value.fullName)
    isSuccess.value = true
    // Optionnel : rediriger après 3 secondes
    setTimeout(() => router.push('/login'), 5000)
  } catch (error: any) {
    errorMessage.value = translateError(error)
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignUp = async () => {
  try {
    isLoading.value = true
    await authService.signInWithGoogle()
  } catch (error: any) {
    errorMessage.value = "Impossible de se connecter avec Google pour le moment."
    isLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex w-full flex-col justify-center space-y-7 sm:w-[400px] transition-all duration-500">
    <div>
      <div class="flex flex-col space-y-2 text-center md:text-left">
        <h1 class="text-3xl font-black tracking-tighter text-primary">Créer un compte</h1>
        <p class="text-sm text-gray-400 font-medium">
          Rejoignez <router-link to="/" class="text-danger font-black">Zenvy</router-link> et ne manquez plus aucun événement.
        </p>
      </div>

      <div v-if="errorMessage" class="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in slide-in-from-top-2">
        <AlertCircle :size="18" class="shrink-0" />
        {{ errorMessage }}
      </div>

      <Button 
        type="button" 
        variant="outline" 
        @click="handleGoogleSignUp"
        :disabled="isLoading"
        class="w-full border-gray-100 bg-white hover:bg-gray-50 text-primary mb-2 py-6 flex items-center justify-center gap-3 transition-all rounded-2xl shadow-sm"
      >
        S'inscrire avec Google
      </Button>

      <div class="relative">
        <div class="absolute inset-0 flex items-center"><Separator /></div>
        <div class="relative flex justify-center text-[10px] uppercase tracking-widest text-gray-400 font-black">
          <span class="bg-white px-4">Ou par email</span>
        </div>
      </div>

      <form @submit.prevent="handleSignUp" class="grid gap-5 mb-3">
        <div class="grid gap-2">
          <Label for="name" class="text-[11px] font-black uppercase text-primary/50 ml-1">Nom complet</Label>
          <Input id="name" v-model="formData.fullName" placeholder="John Doe" required class="rounded-xl h-12" />
        </div>

        <div class="grid gap-2">
          <Label for="email" class="text-[11px] font-black uppercase text-primary/50 ml-1">Email</Label>
          <Input 
            id="email" 
            v-model="formData.email" 
            type="email" 
            :class="{'border-red-400 bg-red-50/30': errorMessage?.includes('email')}"
            placeholder="nom@exemple.com" 
            required 
            class="rounded-xl h-12 transition-colors" 
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="password" class="text-[11px] font-black uppercase text-primary/50 ml-1">Mot de passe</Label>
            <div class="relative">
              <Input 
                id="password" 
                v-model="formData.password" 
                :type="showPassword ? 'text' : 'password'" 
                required 
                class="rounded-xl h-12 pr-10" 
              />
              <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Eye v-if="!showPassword" :size="16" />
                <EyeOff v-else :size="16" />
              </button>
            </div>
          </div>
          <div class="grid gap-2">
            <Label for="confirm" class="text-[11px] font-black uppercase text-primary/50 ml-1">Confirmation</Label>
            <Input 
              id="confirm" 
              v-model="formData.confirmPassword" 
              type="password" 
              :class="{'border-red-400': !isPasswordMatch && formData.confirmPassword}"
              required 
              class="rounded-xl h-12 transition-colors" 
            />
          </div>
        </div>

        <div class="flex items-start space-x-3 py-2">
          <Checkbox id="terms" v-model="formData.terms" class="mt-0.5 border-gray-300" />
          <label for="terms" class="text-[11px] text-gray-400 font-medium leading-relaxed">
            J'accepte les <a href="#" class="text-danger font-bold hover:underline">Conditions</a> et la 
            <a href="#" class="text-danger font-bold hover:underline">Politique de confidentialité</a>.
          </label>
        </div>

        <Button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-primary hover:bg-primary/95 text-white font-black py-7 rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-[0.98]"
        >
          <Loader2 v-if="isLoading" class="mr-2 h-5 w-5 animate-spin" />
          <span v-else>Créer mon compte</span>
        </Button>
      </form>

      <p class="text-center text-[12px] text-gray-400 font-medium m">
        Déjà membre ? 
        <router-link to="/login" class="text-primary font-black hover:text-danger transition-colors ml-1">Se connecter</router-link>
      </p>
    </div>
  </div>
</template>