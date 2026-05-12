import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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
import type { WeightLog } from '@/types'

function userCol() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return collection(db, 'users', uid, 'weightLogs')
}

function userDocRef(date: string) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return doc(db, 'users', uid, 'weightLogs', date)
}

export const useWeightStore = defineStore('weight', () => {
  const logs = ref<WeightLog[]>([])
  const loading = ref(false)

  const latestWeight = computed(() => {
    if (!logs.value.length) return undefined
    const sorted = [...logs.value].sort((a, b) => b.date.localeCompare(a.date))
    return sorted[0].morning ?? sorted[0].postWorkout ?? sorted[0].beforeSleep
  })

  const weightChange = computed(() => {
    if (logs.value.length < 2) return undefined
    const sorted = [...logs.value].sort((a, b) => b.date.localeCompare(a.date))
    const today = sorted[0].morning ?? sorted[0].postWorkout
    const yesterday = sorted[1].morning ?? sorted[1].postWorkout
    if (today === undefined || yesterday === undefined) return undefined
    return +(today - yesterday).toFixed(2)
  })

  const sevenDayTrend = computed(() => {
    const sorted = [...logs.value].sort((a, b) => a.date.localeCompare(b.date))
    return sorted.slice(-7).map((l) => ({
      date: l.date,
      weight: l.morning ?? l.postWorkout ?? l.beforeSleep
    }))
  })

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
      logs.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeightLog))
    } finally {
      loading.value = false
    }
  }

  async function fetchByDate(date: string) {
    const snap = await getDoc(userDocRef(date))
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as WeightLog) : null
  }

  async function save(log: WeightLog) {
    const data = { ...log, createdAt: serverTimestamp() }
    await setDoc(userDocRef(log.date), data, { merge: true })
    const idx = logs.value.findIndex((l) => l.date === log.date)
    if (idx >= 0) {
      logs.value[idx] = { ...logs.value[idx], ...log }
    } else {
      logs.value.push(log)
      logs.value.sort((a, b) => a.date.localeCompare(b.date))
    }
  }

  return { logs, loading, latestWeight, weightChange, sevenDayTrend, fetchRange, fetchByDate, save }
})
