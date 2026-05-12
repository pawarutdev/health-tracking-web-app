import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth'
import { auth } from '@/firebase/config'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  function setUser(firebaseUser: FirebaseUser | null) {
    if (firebaseUser) {
      user.value = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL
      }
    } else {
      user.value = null
    }
  }

  function init() {
    return new Promise<void>((resolve) => {
      onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser)
        loading.value = false
        resolve()
      })
    })
  }

  async function login(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    setUser(credential.user)
  }

  async function register(email: string, password: string, displayName: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName })
    // New users default to dark mode
    try {
      localStorage.setItem('app-theme', 'dark')
      document.documentElement.classList.add('dark')
      document.documentElement.dataset.theme = 'dark'
    } catch {}
    setUser(credential.user)
  }

  async function logout() {
    await signOut(auth)
    user.value = null
  }

  return { user, loading, init, login, register, logout }
})
