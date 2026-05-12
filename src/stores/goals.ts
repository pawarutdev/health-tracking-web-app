import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/firebase/config'
import type { Goals } from '@/types'

function goalsDoc() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return doc(db, 'users', uid, 'settings', 'goals')
}

export const useGoalsStore = defineStore('goals', () => {
  const goals = ref<Goals>({})
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const snap = await getDoc(goalsDoc())
      if (snap.exists()) {
        goals.value = snap.data() as Goals
      }
    } finally {
      loading.value = false
    }
  }

  async function save(data: Goals) {
    const payload = { ...data, updatedAt: serverTimestamp() }
    await setDoc(goalsDoc(), payload, { merge: true })
    goals.value = { ...goals.value, ...data }
  }

  return { goals, loading, fetch, save }
})
