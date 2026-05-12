import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db, auth } from '@/firebase/config'
import type { DailyLog } from '@/types'

function userCol(sub: string) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return collection(db, 'users', uid, sub)
}

function userDoc(sub: string, id: string) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return doc(db, 'users', uid, sub, id)
}

export const useDailyStore = defineStore('daily', () => {
  const logs = ref<DailyLog[]>([])
  const loading = ref(false)
  const currentLog = ref<DailyLog | null>(null)

  async function fetchByDate(date: string) {
    loading.value = true
    try {
      const docRef = userDoc('dailyLogs', date)
      const snap = await getDoc(docRef)
      if (snap.exists()) {
        currentLog.value = { id: snap.id, ...snap.data() } as DailyLog
      } else {
        currentLog.value = null
      }
    } finally {
      loading.value = false
    }
  }

  async function fetchRange(startDate: string, endDate: string) {
    loading.value = true
    try {
      const q = query(
        userCol('dailyLogs'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      )
      const snap = await getDocs(q)
      logs.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as DailyLog))
    } finally {
      loading.value = false
    }
  }

  async function save(log: DailyLog) {
    const docRef = userDoc('dailyLogs', log.date)
    const data = {
      ...log,
      updatedAt: serverTimestamp(),
      createdAt: log.createdAt ?? serverTimestamp()
    }
    await setDoc(docRef, data, { merge: true })
    currentLog.value = log
  }

  return { logs, loading, currentLog, fetchByDate, fetchRange, save }
})
