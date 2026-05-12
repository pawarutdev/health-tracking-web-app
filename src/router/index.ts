import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/daily',
      name: 'daily',
      component: () => import('@/views/DailyLogView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/exercise',
      name: 'exercise',
      component: () => import('@/views/ExerciseLogView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/food',
      name: 'food',
      component: () => import('@/views/FoodLogView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/weight',
      name: 'weight',
      component: () => import('@/views/WeightLogView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/summary',
      name: 'summary',
      component: () => import('@/views/SummaryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/recovery',
      name: 'recovery',
      component: () => import('@/views/RecoveryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/bedtime',
      name: 'bedtime',
      component: () => import('@/views/BedtimeSummaryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/goals',
      name: 'goals',
      component: () => import('@/views/GoalsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/reports',
      name: 'reports',
      component: () => import('@/views/ReportsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/import',
      name: 'import',
      component: () => import('@/views/ImportView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

let authResolved = false

const waitForAuth = (): Promise<void> =>
  new Promise((resolve) => {
    if (authResolved) {
      resolve()
      return
    }
    const unsubscribe = onAuthStateChanged(auth, () => {
      authResolved = true
      unsubscribe()
      resolve()
    })
  })

router.beforeEach(async (to) => {
  await waitForAuth()
  const user = auth.currentUser
  if (to.meta.requiresAuth && !user) {
    return { name: 'login' }
  }
  if (to.name === 'login' && user) {
    return { name: 'dashboard' }
  }
})

export default router
