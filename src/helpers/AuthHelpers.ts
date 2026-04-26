import { supabase } from "@/lib/clientSupabase"

export const authService = {
    // 1. INSCRIPTION / Par mail
  async signUp(email: string, pass: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=EF233C&color=fff`,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    })
    if (error) throw error
    return data
  },

  //CONNEXION / Par mail
  async signIn(email: string, pass: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    })
    if (error) throw error
    return data
  },

  // 3. CONNEXION ou inscription / Par Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    if (error) throw error
    return data
  },

  // DÉCONNEXION
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // RÉCUPÉRER L'UTILISATEUR
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) return null
    return user
  },

    
  // RÉINITIALISATION DE MOT DE PASSE
  async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) throw error
    return data
  }
}