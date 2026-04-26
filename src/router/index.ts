import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/lib/clientSupabase'
// Import des vues
import AuthLayout from '@/views/Layout/AuthLayout.vue'
import DashboardLayout from '@/views/Layout/DashboardLayout.vue'
import Login from '@/views/Auth/Login.vue'
import SignUp from '@/views/Auth/SignUp.vue'
import TableauDeBord from '@/views/Dashboard/Dashboard.vue'
import CreateEvents from '@/views/Dashboard/CreateEvents.vue'
import ImpressionBillets from '@/views/Dashboard/ImpressionBillets.vue'
import Events from '@/views/Dashboard/Events.vue'
import UpdateEvent from '@/views/Dashboard/UpdateEvent.vue'
import Account from '@/views/Dashboard/Account.vue'

const routes = [
  // --- ROUTES PUBLIQUES (Landing Page) ---
  {
    path: '/',
    name: 'Accueil',
    component: import('@/views/Public/Home.vue'),
  },
  {
    path: '/events/:eventId',
    name: 'Détails de l\'évenement',
    component: import('@/views/Public/EventDetails.vue'),
  },

  // --- ROUTES AUTHENTIFICATION (Layout dédié) ---
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: '/login',
        name: 'Connexion',
        component: Login,
        meta: { guestOnly: true }
      },
      {
        path: '/signup',
        name: 'Inscription',
        component: SignUp,
        meta: { guestOnly: true }
      }
    ]
  },

  // --- ROUTES PRIVÉES (Dashboard Layout) ---
  {
    path: '/dashboard', // Parent pour grouper les routes protégées
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Tableau de bord',
        component: TableauDeBord,
      },
      {
        path: '/dashboard/account',
        name: 'Mon compte',
        component: Account,
      },
      {
        path: '/dashboard/create-event',
        name: 'Créer un événement',
        component: CreateEvents,
      },
      {
        path: '/dashboard/events/:id/impression-billets',
        name: 'Impression des tickets',
        component: ImpressionBillets,
      },
      {
        path: '/dashboard/events',
        name: 'Mes événements',
        component: Events,
      },
      {
        path: '/dashboard/events/:id/edit',
        name: 'Éditer un événement',
        component: UpdateEvent,
      }
    ]
  },

  // Redirection par défaut si la page n'existe pas
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

/**
 * MIDDLEWARE DE PROTECTION DES ROUTES
 */
router.beforeEach(async (to, _from, next) => {
  // 1. Récupération de la session via le client Supabase
  const { data: { session } } = await supabase.auth.getSession()
  const isAuthenticated = !!session

  // 2. Vérification de la hiérarchie des routes (certaines sont marquées en meta parent)
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isGuestOnly = to.matched.some(record => record.meta.guestOnly)

  // Cas 1 : Accès à une page protégée sans être connecté
  if (requiresAuth && !isAuthenticated) {
    return next({ name: 'Connexion' })
  }

  // Cas 2 : Accès à Login/SignUp/Home en étant déjà connecté
  // (Typiquement pour rediriger l'utilisateur vers son espace de gestion)
  if (isGuestOnly && isAuthenticated) {
    return next({ name: 'Tableau de bord' })
  }

  // Cas 3 : Tout est ok, on continue
  next()
})

export default router