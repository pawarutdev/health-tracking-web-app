import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '@/firebase/config'
import type { ExerciseActivity } from '@/types'

function userCol() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return collection(db, 'users', uid, 'exercises')
}

function userDocRef(id: string) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return doc(db, 'users', uid, 'exercises', id)
}

export const useExerciseStore = defineStore('exercise', () => {
  const activities = ref<ExerciseActivity[]>([])
  const loading = ref(false)

  async function fetchByDate(date: string) {
    loading.value = true
    try {
      const q = query(userCol(), where('date', '==', date), orderBy('startTime'))
      const snap = await getDocs(q)
      activities.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExerciseActivity))
    } finally {
      loading.value = false
    }
  }

  async function fetchRange(startDate: string, endDate: string) {
    loading.value = true
    try {
      const q = query(
        userCol(),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      )
      const snap = await getDocs(q)
      activities.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ExerciseActivity))
    } finally {
      loading.value = false
    }
  }

  async function add(activity: ExerciseActivity) {
    const data = Object.fromEntries(
      Object.entries({
        ...activity,
        createdAt: serverTimestamp()
      }).filter(([k, v]) => v !== undefined && k !== 'imageUrls')
    )
    const docRef = await addDoc(userCol(), data)
    activities.value.unshift({ id: docRef.id, ...activity })
    return docRef.id
  }

  async function update(id: string, activity: Partial<ExerciseActivity>) {
    const data: Record<string, unknown> = Object.fromEntries(
      Object.entries({ ...activity, updatedAt: serverTimestamp() })
        .filter(([k, v]) => v !== undefined && k !== 'imageUrls')
    )
    await updateDoc(userDocRef(id), data)
    const idx = activities.value.findIndex((a) => a.id === id)
    if (idx >= 0) activities.value[idx] = { ...activities.value[idx], ...data }
  }

  async function remove(id: string) {
    await deleteDoc(userDocRef(id))
    activities.value = activities.value.filter((a) => a.id !== id)
  }

  return { activities, loading, fetchByDate, fetchRange, add, update, remove }
})
