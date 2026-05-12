import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore'
import { db, auth } from '@/firebase/config'
import type { BedtimeSummary } from '@/types'

function userCol() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return collection(db, 'users', uid, 'bedtimeSummaries')
}

function userDocRef(date: string) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return doc(db, 'users', uid, 'bedtimeSummaries', date)
}

export const useBedtimeStore = defineStore('bedtime', () => {
  const summaries = ref<BedtimeSummary[]>([])
  const currentSummary = ref<BedtimeSummary | null>(null)
  const loading = ref(false)

  const latest = computed<BedtimeSummary | undefined>(() => {
    if (!summaries.value.length) return undefined
    return [...summaries.value].sort((a, b) => b.date.localeCompare(a.date))[0]
  })

  async function fetchByDate(date: string) {
    loading.value = true
    try {
      const snap = await getDoc(userDocRef(date))
      currentSummary.value = snap.exists()
        ? ({ id: snap.id, ...snap.data() } as BedtimeSummary)
        : null
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
      summaries.value = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as BedtimeSummary)
      )
    } finally {
      loading.value = false
    }
  }

  async function fetchLatest() {
    const q = query(userCol(), orderBy('date', 'desc'), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) return
    const d = snap.docs[0]
    const item = { id: d.id, ...d.data() } as BedtimeSummary
    const idx = summaries.value.findIndex((s) => s.date === item.date)
    if (idx >= 0) summaries.value[idx] = item
    else summaries.value.push(item)
  }

  async function save(s: BedtimeSummary) {
    const data = { ...s, updatedAt: serverTimestamp() }
    if (!s.createdAt) (data as any).createdAt = serverTimestamp()
    await setDoc(userDocRef(s.date), data, { merge: true })
    currentSummary.value = s
    const idx = summaries.value.findIndex((x) => x.date === s.date)
    if (idx >= 0) summaries.value[idx] = s
    else summaries.value.push(s)
  }

  async function deleteByDate(date: string) {
    await deleteDoc(userDocRef(date))
    if (currentSummary.value?.date === date) currentSummary.value = null
    summaries.value = summaries.value.filter((s) => s.date !== date)
  }

  return {
    summaries,
    currentSummary,
    loading,
    latest,
    fetchByDate,
    fetchRange,
    fetchLatest,
    save,
    deleteByDate
  }
})
