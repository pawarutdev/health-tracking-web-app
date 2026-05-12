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
import type { Meal, MealItem } from '@/types'

function userCol() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return collection(db, 'users', uid, 'meals')
}

function userDocRef(id: string) {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('Not authenticated')
  return doc(db, 'users', uid, 'meals', id)
}

export const useFoodStore = defineStore('food', () => {
  const meals = ref<Meal[]>([])
  const loading = ref(false)

  function calcTotals(items: MealItem[]) {
    return items.reduce(
      (acc, item) => ({
        totalCalories: acc.totalCalories + item.calories,
        totalProtein: acc.totalProtein + item.protein,
        totalCarb: acc.totalCarb + item.carb,
        totalFat: acc.totalFat + item.fat,
        totalSodium: acc.totalSodium + item.sodium
      }),
      { totalCalories: 0, totalProtein: 0, totalCarb: 0, totalFat: 0, totalSodium: 0 }
    )
  }

  async function fetchByDate(date: string) {
    loading.value = true
    try {
      const q = query(userCol(), where('date', '==', date), orderBy('createdAt'))
      const snap = await getDocs(q)
      meals.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Meal))
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
      meals.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Meal))
    } finally {
      loading.value = false
    }
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const scale = Math.min(1, 800 / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
      img.src = url
    })
  }

  async function add(meal: Omit<Meal, 'totalCalories' | 'totalProtein' | 'totalCarb' | 'totalFat' | 'totalSodium'>, imageFiles: File[] = []) {
    const newUrls = await Promise.all(imageFiles.map(fileToBase64))
    const totals = calcTotals(meal.items)
    const data = Object.fromEntries(
      Object.entries({
        ...meal,
        ...totals,
        imageUrls: [...(meal.imageUrls ?? []), ...newUrls],
        createdAt: serverTimestamp()
      }).filter(([, v]) => v !== undefined)
    )
    const docRef = await addDoc(userCol(), data)
    meals.value.push({ id: docRef.id, ...data } as Meal)
    return docRef.id
  }

  async function update(id: string, meal: Partial<Meal>) {
    const totals = meal.items ? calcTotals(meal.items) : {}
    const data = { ...meal, ...totals }
    await updateDoc(userDocRef(id), data)
    const idx = meals.value.findIndex((m) => m.id === id)
    if (idx >= 0) meals.value[idx] = { ...meals.value[idx], ...data }
  }

  async function remove(id: string) {
    await deleteDoc(userDocRef(id))
    meals.value = meals.value.filter((m) => m.id !== id)
  }

  return { meals, loading, fetchByDate, fetchRange, add, update, remove }
})
