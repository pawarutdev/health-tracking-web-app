import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '@/firebase/config'

export interface UserProfile {
  displayName?: string
  photoBase64?: string  // data URL "data:image/jpeg;base64,..."
  updatedAt?: any
}

function profileDocRef() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return doc(db, 'users', uid, 'profile', 'info')
}

export const useProfileStore = defineStore('profile', () => {
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)

  async function fetch() {
    if (!auth.currentUser) return
    loading.value = true
    try {
      const snap = await getDoc(profileDocRef())
      profile.value = snap.exists() ? (snap.data() as UserProfile) : null
    } finally {
      loading.value = false
    }
  }

  async function save(p: UserProfile) {
    await setDoc(
      profileDocRef(),
      { ...p, updatedAt: serverTimestamp() },
      { merge: true }
    )
    profile.value = { ...(profile.value ?? {}), ...p }
    // mirror displayName ไป Firebase Auth (จะใช้ใน Auth state ทันที)
    if (auth.currentUser && p.displayName && p.displayName !== auth.currentUser.displayName) {
      try {
        await updateProfile(auth.currentUser, { displayName: p.displayName })
      } catch {
        // ไม่ critical
      }
    }
  }

  function clear() {
    profile.value = null
  }

  return { profile, loading, fetch, save, clear }
})
