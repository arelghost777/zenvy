import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authService } from "@/helpers/AuthHelpers"; // Adaptez le chemin vers votre authService
import { supabase } from "@/lib/supabase/clientSupabase";
import type { User } from "@supabase/supabase-js";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  rawUser: User;
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<AppUser | null>(null);
  const isLoading = ref(true);
  const isInitialized = ref(false);

  // 🔹 Helper pour formater l'utilisateur Supabase
  const formatUser = (rawUser: User | null): AppUser | null => {
    if (!rawUser) return null;

    // Extrait le nom complet (depuis inscription classique ou Google)
    const fullName =
      rawUser.user_metadata?.full_name ||
      rawUser.user_metadata?.name ||
      rawUser.email?.split("@")[0] ||
      "Utilisateur";

    const avatarUrl =
      rawUser.user_metadata?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=EF233C&color=fff`;

    return {
      id: rawUser.id,
      email: rawUser.email || "",
      fullName,
      avatarUrl,
      rawUser,
    };
  };

  // 🔹 Initialisation + Écoute des changements de session (Google OAuth, refresh, etc.)
  const initAuth = async () => {
    if (isInitialized.value) return;

    isLoading.value = true;

    // 1. Récupération initiale via votre authService
    const currentUser = await authService.getCurrentUser();
    user.value = formatUser(currentUser);

    isLoading.value = false;
    isInitialized.value = true;

    // 2. Écouter les événements Supabase en arrière-plan (ex: Retour de Google OAuth, déconnexion)
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = formatUser(session?.user ?? null);
    });
  };

  // 🔹 Déconnexion
  const logout = async () => {
    await authService.signOut();
    user.value = null;
  };

  const isAuthenticated = computed(() => !!user.value);

  return {
    user,
    isLoading,
    isInitialized,
    isAuthenticated,
    initAuth,
    logout,
  };
});
