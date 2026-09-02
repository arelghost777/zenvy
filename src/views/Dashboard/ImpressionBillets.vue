<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  Ticket,
  Users,
  DollarSign,
  CheckCircle2,
  Printer,
  Search,
  Loader2,
  ArrowLeft,
  TrendingUp,
  Filter,
  AlertCircle,
  RotateCcw,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/clientSupabase";
import { useAuthStore } from "@/stores/authStore";

const authStore = useAuthStore();
const user = computed(() => authStore.user);
const route = useRoute();
const router = useRouter();
const eventId = route.params.id as string;

const isLoading = ref(true);
const error = ref<string | null>(null);
const event = ref<any>(null);
const tickets = ref<any[]>([]);
const ticketTypes = ref<any[]>([]);
const orders = ref<any[]>([]);
const searchQuery = ref("");
const filterType = ref<string>("all");
const filterStatus = ref<string>("all");

// ---------------------------------------------------------
// 1. CHARGEMENT DES DONNÉES
// ---------------------------------------------------------
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;

  // 1. Vérifier si l'utilisateur est connecté
  if (!user.value?.id) {
    error.value = "Vous devez être connecté pour accéder à cette page.";
    isLoading.value = false;
    return;
  }

  // 2. Vérifier si l'ID d'événement est valide
  if (!eventId || eventId === "undefined") {
    error.value = "Identifiant d'événement invalide.";
    isLoading.value = false;
    return;
  }

  try {
    // 🔒 3. ÉTAPE CLÉ : Récupérer l'événement EN FILTRANT STRICTEMENT sur owner_id
    const { data: eventData, error: eventErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("owner_id", user.value.id) // 👈 Empêche de récupérer un événement d'un autre utilisateur
      .single();

    // Si l'événement n'existe pas OU qu'il n'appartient pas à l'utilisateur
    if (eventErr || !eventData) {
      error.value =
        "Accès refusé : Cet événement n'existe pas ou vous n'en êtes pas le propriétaire.";
      isLoading.value = false;
      return; // ⛔ STOP : On s'arrête ici, AUCUNE autre donnée n'est chargée !
    }

    // Si on arrive ici, l'utilisateur est légitime !
    event.value = eventData;

    // 4. Charger les types de billets
    const { data: typesData, error: typesErr } = await supabase
      .from("ticket_types")
      .select("*")
      .eq("event_id", eventId);
    if (typesErr) throw typesErr;
    ticketTypes.value = typesData || [];

    // 5. Charger TOUS les billets vendus pour CET événement
    const { data: ticketsData, error: ticketsErr } = await supabase
      .from("tickets")
      .select(
        `
        *,
        ticket_types ( name, price )
      `,
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    if (ticketsErr) throw ticketsErr;
    tickets.value = ticketsData || [];

    // 6. Charger TOUTES les commandes payées pour CET événement
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "paid");
    if (ordersErr) throw ordersErr;
    orders.value = ordersData || [];
  } catch (err: any) {
    console.error("Erreur lors du chargement des données :", err);
    error.value =
      err.message || "Une erreur est survenue lors du chargement des données.";
  } finally {
    isLoading.value = false;
  }
};

// Recharger les données si l'utilisateur change (ex: après connexion)
watch(user, (newUser, oldUser) => {
  if (newUser?.id !== oldUser?.id) {
    fetchData();
  }
});

// ---------------------------------------------------------
// 2. CALCUL DES STATISTIQUES (KPIs)
// ---------------------------------------------------------
const totalRevenue = computed(() => {
  return orders.value.reduce(
    (acc, order) => acc + Number(order.total_price || 0),
    0,
  );
});

const totalTicketsSold = computed(() => tickets.value.length);

const totalCheckedIn = computed(() => {
  return tickets.value.filter((t) => t.is_used).length;
});

const checkInRate = computed(() => {
  if (totalTicketsSold.value === 0) return 0;
  return Math.round((totalCheckedIn.value / totalTicketsSold.value) * 100);
});

const statsByType = computed(() => {
  return ticketTypes.value.map((type) => {
    const sold = tickets.value.filter(
      (t) => t.ticket_type_id === type.id,
    ).length;
    const revenue = sold * Number(type.price || 0);
    return {
      id: type.id,
      name: type.name,
      price: type.price,
      soldCount: sold,
      revenue,
    };
  });
});

// ---------------------------------------------------------
// 3. FILTRAGE DE LA LISTE DE BILLETS
// ---------------------------------------------------------
const filteredTickets = computed(() => {
  return tickets.value.filter((ticket) => {
    const matchesSearch =
      ticket.client_name
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      ticket.client_email
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase()) ||
      ticket.unique_code
        .toLowerCase()
        .includes(searchQuery.value.toLowerCase());

    const matchesType =
      filterType.value === "all" ||
      ticket.ticket_type_id.toString() === filterType.value;

    let matchesStatus = true;
    if (filterStatus.value === "used") matchesStatus = ticket.is_used === true;
    if (filterStatus.value === "unused")
      matchesStatus = ticket.is_used === false;

    return matchesSearch && matchesType && matchesStatus;
  });
});

// Impression navigateur
const triggerPrint = () => {
  window.print();
};

onMounted(fetchData);
</script>

<template>
  <div class="min-h-screen p-4 md:p-8">
    <div class="max-w-7xl mx-auto space-y-8">
      <!-- EN-TÊTE ET ACTIONS (Masqué lors de l'impression) -->
      <div
        class="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden"
      >
        <div>
          <button
            @click="router.back()"
            class="inline-flex items-center gap-2 text-[#8D99AE] hover:text-[#2B2D42] font-bold text-xs uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft :size="16" /> Retour
          </button>
          <h1 class="text-3xl font-black text-[#2B2D42] tracking-tight">
            Statistiques & Impression des Billets
          </h1>
          <p v-if="event" class="text-sm font-semibold text-[#8D99AE]">
            {{ event.title }}
          </p>
        </div>

        <Button
          @click="triggerPrint"
          class="bg-[#EF233C] hover:bg-[#D90429] text-white font-bold px-6 py-6 rounded-xl flex items-center gap-2 shadow-lg shadow-[#EF233C]/20 transition-all active:scale-95"
        >
          <Printer :size="20" /> Imprimer la sélection (PDF)
        </Button>
      </div>

      <!-- ÉTAT DE CHARGEMENT -->
      <div v-if="isLoading" class="flex h-64 items-center justify-center">
        <Loader2 class="animate-spin text-[#EF233C] size-12" />
      </div>

      <!-- MESSAGE D'ERREUR -->
      <div
        v-else-if="error"
        class="bg-white p-8 rounded-2xl border border-[#2B2D42]/5 shadow-sm text-center"
      >
        <AlertCircle :size="48" class="text-red-500 mx-auto mb-4" />
        <h2 class="text-xl font-black text-[#2B2D42] mb-2">
          Oups, une erreur est survenue
        </h2>
        <p class="text-[#8D99AE] font-medium mb-6">{{ error }}</p>
        <div class="flex justify-center gap-3">
          <Button
            @click="fetchData"
            class="bg-[#EF233C] hover:bg-[#D90429] text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2"
          >
            <RotateCcw :size="16" /> Réessayer
          </Button>
          <Button
            @click="router.back()"
            variant="outline"
            class="font-bold px-6 py-3 rounded-xl"
          >
            Retour
          </Button>
        </div>
      </div>

      <template v-else-if="event">
        <!-- KPIS / STATISTIQUES GLOBALES (Masqué lors de l'impression) -->
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden"
        >
          <!-- Recette Totale -->
          <div
            class="bg-white p-6 rounded-2xl border border-[#2B2D42]/5 shadow-sm flex items-center gap-4"
          >
            <div class="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign :size="28" />
            </div>
            <div>
              <p
                class="text-[11px] font-black uppercase text-[#8D99AE] tracking-wider"
              >
                Recette Totale
              </p>
              <h3 class="text-2xl font-black text-[#2B2D42] mt-0.5">
                {{ totalRevenue.toLocaleString() }} €
              </h3>
              <span
                class="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-1"
              >
                <TrendingUp :size="12" /> {{ orders.length }} commande(s)
                payée(s)
              </span>
            </div>
          </div>

          <!-- Billets Vendus -->
          <div
            class="bg-white p-6 rounded-2xl border border-[#2B2D42]/5 shadow-sm flex items-center gap-4"
          >
            <div class="p-4 bg-blue-50 text-blue-600 rounded-xl">
              <Ticket :size="28" />
            </div>
            <div>
              <p
                class="text-[11px] font-black uppercase text-[#8D99AE] tracking-wider"
              >
                Billets Vendus
              </p>
              <h3 class="text-2xl font-black text-[#2B2D42] mt-0.5">
                {{ totalTicketsSold }}
              </h3>
              <span class="text-[10px] font-bold text-blue-600 mt-1 block"
                >Émis dans le système</span
              >
            </div>
          </div>

          <!-- Participants Présents -->
          <div
            class="bg-white p-6 rounded-2xl border border-[#2B2D42]/5 shadow-sm flex items-center gap-4"
          >
            <div class="p-4 bg-purple-50 text-purple-600 rounded-xl">
              <Users :size="28" />
            </div>
            <div>
              <p
                class="text-[11px] font-black uppercase text-[#8D99AE] tracking-wider"
              >
                Présents
              </p>
              <h3 class="text-2xl font-black text-[#2B2D42] mt-0.5">
                {{ totalCheckedIn }} / {{ totalTicketsSold }}
              </h3>
              <span class="text-[10px] font-bold text-purple-600 mt-1 block"
                >Billets scannés</span
              >
            </div>
          </div>

          <!-- Taux de Présence -->
          <div
            class="bg-white p-6 rounded-2xl border border-[#2B2D42]/5 shadow-sm flex items-center gap-4"
          >
            <div class="p-4 bg-amber-50 text-amber-600 rounded-xl">
              <CheckCircle2 :size="28" />
            </div>
            <div>
              <p
                class="text-[11px] font-black uppercase text-[#8D99AE] tracking-wider"
              >
                Taux de Présence
              </p>
              <h3 class="text-2xl font-black text-[#2B2D42] mt-0.5">
                {{ checkInRate }}%
              </h3>
              <span class="text-[10px] font-bold text-amber-600 mt-1 block"
                >Taux de validation</span
              >
            </div>
          </div>
        </div>

        <!-- RÉPARTITION PAR TYPE DE BILLET (Masqué lors de l'impression) -->
        <div
          class="bg-white p-6 rounded-2xl border border-[#2B2D42]/5 shadow-sm space-y-4 print:hidden"
        >
          <h2
            class="text-base font-black text-[#2B2D42] flex items-center gap-2"
          >
            <Filter :size="18" class="text-[#EF233C]" /> Ventes par Catégorie de
            Billet
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="stat in statsByType"
              :key="stat.id"
              class="bg-[#EDF2F4]/50 border border-[#2B2D42]/5 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <p class="font-bold text-sm text-[#2B2D42]">{{ stat.name }}</p>
                <p class="text-xs text-[#8D99AE]">{{ stat.price }} € / unité</p>
              </div>
              <div class="text-right">
                <p class="text-lg font-black text-[#EF233C]">
                  {{ stat.soldCount }} vendus
                </p>
                <p class="text-xs font-bold text-[#2B2D42]">
                  {{ stat.revenue.toLocaleString() }} €
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- RECHERCHE & FILTRES (Masqué lors de l'impression) -->
        <div
          class="bg-white p-4 rounded-2xl border border-[#2B2D42]/5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center print:hidden"
        >
          <!-- Recherche globale -->
          <div class="relative w-full md:w-80">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D99AE]"
              :size="18"
            />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher par nom, email, code..."
              class="w-full bg-[#EDF2F4] pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#EF233C] outline-none"
            />
          </div>

          <!-- Filtres de tri -->
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              v-model="filterType"
              class="bg-[#EDF2F4] text-xs font-bold text-[#2B2D42] p-3 rounded-xl outline-none cursor-pointer"
            >
              <option value="all">Toutes les catégories</option>
              <option
                v-for="t in ticketTypes"
                :key="t.id"
                :value="t.id.toString()"
              >
                {{ t.name }}
              </option>
            </select>

            <select
              v-model="filterStatus"
              class="bg-[#EDF2F4] text-xs font-bold text-[#2B2D42] p-3 rounded-xl outline-none cursor-pointer"
            >
              <option value="all">Tous les statuts</option>
              <option value="used">Utilisés (Scannés)</option>
              <option value="unused">Non utilisés</option>
            </select>
          </div>
        </div>

        <!-- LISTE & GRILLE DE BILLETS (ZONE D'IMPRESSION) -->
        <div class="space-y-4">
          <div class="flex justify-between items-center px-1 print:hidden">
            <p
              class="text-xs font-bold text-[#8D99AE] uppercase tracking-wider"
            >
              Affichage de {{ filteredTickets.length }} billet(s)
            </p>
          </div>

          <!-- Grille des billets (Adaptée à la fois pour écran et PDF/Print) -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-1 print:gap-4"
          >
            <div
              v-for="ticket in filteredTickets"
              :key="ticket.id"
              class="bg-white border-2 border-dashed border-[#2B2D42]/15 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm relative overflow-hidden print:border-solid print:border-slate-300 print:break-inside-avoid"
            >
              <!-- Tag Status Utilisé -->
              <div
                v-if="ticket.is_used"
                class="absolute -right-12 top-4 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-12 py-1 rotate-45 shadow"
              >
                Scanné
              </div>

              <!-- Information du billet -->
              <div class="space-y-3 flex-1 w-full">
                <div class="flex items-center gap-2">
                  <span
                    class="bg-[#EF233C]/10 text-[#EF233C] text-[10px] font-black uppercase px-3 py-1 rounded-full"
                  >
                    {{ ticket.ticket_types?.name || "Billet" }}
                  </span>
                  <span class="text-xs font-black text-[#2B2D42]"
                    >{{ ticket.price }} €</span
                  >
                </div>

                <div>
                  <h4 class="text-lg font-black text-[#2B2D42] capitalize">
                    {{ ticket.client_name }}
                  </h4>
                  <p class="text-xs text-[#8D99AE] font-medium">
                    {{ ticket.client_email }}
                  </p>
                  <p
                    v-if="ticket.client_phone"
                    class="text-xs text-[#8D99AE] font-medium"
                  >
                    {{ ticket.client_phone }}
                  </p>
                </div>

                <div
                  class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#8D99AE]"
                >
                  <span
                    >Code :
                    <strong class="font-mono text-[#2B2D42]">{{
                      ticket.unique_code
                    }}</strong></span
                  >
                  <span>{{
                    new Date(ticket.created_at).toLocaleDateString("fr-FR")
                  }}</span>
                </div>
              </div>

              <!-- Zone QR Code -->
              <div
                class="flex flex-col items-center justify-center bg-[#EDF2F4]/60 p-3 rounded-xl border border-slate-200 shrink-0"
              >
                <img
                  :src="ticket.qr_code"
                  alt="QR Code"
                  class="size-28 object-contain"
                />
                <span
                  class="text-[9px] font-mono font-bold text-[#2B2D42] mt-1"
                  >{{ ticket.unique_code }}</span
                >
              </div>
            </div>
          </div>

          <div
            v-if="filteredTickets.length === 0"
            class="bg-white p-12 text-center rounded-2xl border border-[#2B2D42]/5"
          >
            <Ticket class="mx-auto text-[#8D99AE] mb-3" :size="40" />
            <p class="font-bold text-[#2B2D42]">
              Aucun billet ne correspond aux critères.
            </p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* CSS Spécifique pour l'impression propre via le navigateur ou enregistrement PDF */
@media print {
  body {
    background-color: white !important;
  }
  .print\:hidden {
    display: none !important;
  }
  .print\:grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
  }
  .print\:break-inside-avoid {
    break-inside: avoid !important;
  }
}
</style>
