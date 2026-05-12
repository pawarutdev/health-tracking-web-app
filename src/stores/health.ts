import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '@/firebase/config'
import type { HealthMetrics } from '@/types'

function userDocRef(date: string) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return doc(db, 'users', uid, 'healthMetrics', date)
}

function userCol() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return collection(db, 'users', uid, 'healthMetrics')
}

export const useHealthStore = defineStore('health', () => {
  const metrics = ref<HealthMetrics[]>([])
  const currentMetrics = ref<HealthMetrics | null>(null)
  const loading = ref(false)

  async function fetchByDate(date: string) {
    loading.value = true
    try {
      const snap = await getDoc(userDocRef(date))
      currentMetrics.value = snap.exists() ? ({ id: snap.id, ...snap.data() } as HealthMetrics) : null
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
        orderBy('date', 'asc')
      )
      const snap = await getDocs(q)
      metrics.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthMetrics))
    } finally {
      loading.value = false
    }
  }

  async function save(m: HealthMetrics) {
    const data = { ...m, createdAt: serverTimestamp() }
    await setDoc(userDocRef(m.date), data, { merge: true })
    currentMetrics.value = m
    const idx = metrics.value.findIndex((x) => x.date === m.date)
    if (idx >= 0) metrics.value[idx] = m
    else metrics.value.push(m)
  }

  return { metrics, currentMetrics, loading, fetchByDate, fetchRange, save }
})
