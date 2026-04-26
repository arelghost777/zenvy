<script setup lang="ts">
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator' // Ajout de l'import manquant
import { ref, onMounted, computed } from 'vue';
import { authService } from '@/helpers/AuthHelpers';
import { useRouter, useRoute } from 'vue-router';
import { 
  GalleryVerticalEnd, Home, User2, ChevronUp, 
  LogOut, Settings, CreditCard, Plus, Calendar, Ticket, 
  ChevronRight
} from 'lucide-vue-next'

const router = useRouter();
const route = useRoute();

const userProfile = ref<any>(null);

// ✅ 1. Titre dynamique basé sur le nom de la route défini dans ton router
const pageTitle = computed(() => route.name || 'Tableau de bord');

// ✅ 2. Récupération simplifiée du profil (plus besoin de gérer les redirections ici)
const fetchProfile = async () => {
  try {
    const user = await authService.getCurrentUser();
    if (user) {
      userProfile.value = {
        fullName: user.user_metadata?.full_name || user.email,
        email: user.email
      };
    }
  } catch (error) {
    console.error("Erreur profil:", error);
  }
};

onMounted(fetchProfile);

// ✅ 3. Déconnexion
const handleSignOut = async () => {
  await authService.signOut();
  router.push('/login');
};
</script>

<template>
  <SidebarProvider>
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <router-link to="/" class="cursor-pointer">
              <SidebarMenuButton size="lg" class="hover:bg-transparent">
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <img src="/logo.png" alt="" width="100">
                </div>
              </SidebarMenuButton>
            </router-link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton as-child :is-active="route.path === '/dashboard'">
                  <router-link to="/dashboard">
                    <Home class="text-primary" />
                    <span>Tableau de bord</span>
                  </router-link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel class="text-xs font-bold text-gray-500">Gestion des événements</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton as-child :is-active="route.path === '/dashboard/create-event'">
                  <router-link to="/dashboard/create-event">
                    <Plus class="text-primary" />
                    <span>Créer un événement</span>
                  </router-link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton as-child>
                  <router-link to="/dashboard/events"> <Calendar class="text-primary" />
                    <span>Mes événements</span>
                  </router-link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton as-child>
                  <router-link to="/dashboard/tickets"> <Ticket class="text-primary" />
                    <span>Billetterie & Ventes</span>
                  </router-link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton class="py-7 border border-secondary/10 shadow-sm transition-all hover:bg-background">
                  <User2 class="text-accent" /> 
                  <div class="flex flex-col items-start overflow-hidden text-left">
                    <span class="truncate font-bold text-primary leading-none mb-1">
                      {{ userProfile?.fullName || 'Chargement...' }}
                    </span>
                    <span class="truncate text-[10px] text-secondary leading-none">
                      {{ userProfile?.email }}
                    </span>
                  </div>
                  <ChevronUp class="ml-auto opacity-50" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" class="w-[--radix-dropdown-menu-trigger-width] p-2 mb-2">
                <DropdownMenuItem class="cursor-pointer">
                  <Settings class="mr-2 size-4" />
                  <span>Mon Compte</span>
                </DropdownMenuItem>
                <DropdownMenuItem class="cursor-pointer">
                  <CreditCard class="mr-2 size-4" />
                  <span>Mes Gains</span>
                </DropdownMenuItem>
                <Separator class="my-2" />
                <DropdownMenuItem @click="handleSignOut" class="cursor-pointer text-danger focus:text-danger focus:bg-danger/10">
                  <LogOut class="mr-2 size-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 px-6 border-b bg-white">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mx-2 h-4" />
        <div class="flex items-center gap-2 text-sm">
          <router-link to="/dashboard" class="text-primary/70 hover:text-primary hover:underline font-medium">Tableau de bord</router-link>
           <ChevronRight />
          <span class="font-bold text-primary">{{ pageTitle }}</span>
        </div>
      </header>
      
      <main class="flex flex-1 flex-col gap-6 p-6 bg-background/50">
        <router-view />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>