<template>
  <AppLayout>
    <!-- Period Selector -->
    <div class="flex gap-2 mb-4">
      <button
        v-for="p in periods"
        :key="p.value"
        class="flex-1 py-2 rounded-xl text-sm font-medium border transition-all"
        :class="period === p.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'"
        @click="period = p.value"
      >
        {{ p.label }}
      </button>
    </div>

    <!-- Summary Cards -->
    <div v-if="!loading" class="grid grid-cols-2 gap-3 mb-4">
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-xl font-bold text-orange-500">{{ summary.totalCalIn }}</div>
        <div class="text-xs text-gray-500">แคลอรี่รับเข้า (kcal)</div>
      </div>
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-xl font-bold text-blue-600">{{ summary.totalCalOut }}</div>
        <div class="text-xs text-gray-500">แคลอรี่เผาผลาญ (kcal)</div>
      </div>
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-xl font-bold text-green-600">{{ summary.totalDistance }}</div>
        <div class="text-xs text-gray-500">ระยะทางรวม (กม.)</div>
      </div>
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-xl font-bold text-purple-600">{{ summary.exerciseCount }}</div>
        <div class="text-xs text-gray-500">จำนวนครั้งออกกำลังกาย</div>
      </div>
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-xl font-bold" :class="summary.calBalance >= 0 ? 'text-red-500' : 'text-green-600'">
          {{ summary.calBalance >= 0 ? '+' : '' }}{{ summary.calBalance }}
        </div>
        <div class="text-xs text-gray-500">สมดุลแคลอรี่ (kcal)</div>
      </div>
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-xl font-bold text-orange-400">{{ summary.cheatDays }}</div>
        <div class="text-xs text-gray-500">วัน Cheat Day</div>
      </div>
    </div>

    <!-- Weight Trend Chart -->
    <WeightTrendChart
      v-if="weightDates.length"
      :dates="weightDates"
      :weights="weightValues"
      :targetWeight="goalsStore.goals.targetWeight"
      title="แนวโน้มน้ำหนัก"
      :height="200"
      class="mb-4"
    />

    <!-- Calorie Chart -->
    <CalorieChart
      v-if="calDates.length"
      :dates="calDates"
      :caloriesIn="calIn"
      :caloriesOut="calOut"
      :height="200"
      class="mb-4"
    />

    <!-- Health Chart -->
    <HealthChart
      v-if="healthDates.length"
      :dates="healthDates"
      :sleep="sleepData"
      :stress="stressData"
      :height="200"
      class="mb-4"
    />

    <!-- Top Exercises -->
    <div v-if="topExercises.length" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div class="px-4 py-3 border-b border-gray-50">
        <h3 class="text-sm font-semibold text-gray-700">กิจกรรมยอดนิยม</h3>
      </div>
      <div v-for="ex in topExercises" :key="ex.type" class="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
        <div class="flex-1 text-sm text-gray-800">{{ ex.type }}</div>
        <div class="text-sm text-gray-500">{{ ex.count }} ครั้ง</div>
        <div class="ml-3 text-sm font-semibold text-blue-600">{{ ex.totalDistance }} กม.</div>
      </div>
    </div>

    <!-- High Stress Days -->
    <div v-if="highStressDays > 0" class="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
      <div class="flex items-center gap-2">
        <i class="pi pi-exclamation-triangle text-red-500" />
        <span class="text-sm font-semibold text-red-700">วันที่ความเครียดสูง: {{ highStressDays }} วัน</span>
      </div>
    </div>

    <!-- Export -->
    <div class="flex gap-2">
      <Button label="Export Excel" icon="pi pi-file-excel" severity="secondary" class="flex-1" :loading="exporting" @click="handleExport" />
      <Button label="Export CSV" icon="pi pi-file" severity="secondary" class="flex-1" :loading="exporting" @click="handleExportCSV" />
    </div>

    <LoadingSpinner v-if="loading" message="กำลังโหลดรายงาน..." />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import AppLayout from '@/components/layout/AppLayout.vue'
import WeightTrendChart from '@/components/charts/WeightTrendChart.vue'
import CalorieChart from '@/components/charts/CalorieChart.vue'
import HealthChart from '@/components/charts/HealthChart.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useWeightStore } from '@/stores/weight'
import { useExerciseStore } from '@/stores/exercise'
import { useFoodStore } from '@/stores/food'
import { useHealthStore } from '@/stores/health'
import { useDailyStore } from '@/stores/daily'
import { useGoalsStore } from '@/stores/goals'
import { today, nDaysAgo, startOfMonth, endOfMonth } from '@/utils/date'
import { exportWeeklyReportExcel, exportExerciseCSV } from '@/utils/export'

type Period = '7' | '30' | 'month'
const period = ref<Period>('7')
const loading = ref(false)
const exporting = ref(false)

const weightStore = useWeightStore()
const exerciseStore = useExerciseStore()
const foodStore = useFoodStore()
const healthStore = useHealthStore()
const dailyStore = useDailyStore()
const goalsStore = useGoalsStore()

const periods = [
  { label: '7 วัน', value: '7' as Period },
  { label: '30 วัน', value: '30' as Period },
  { label: 'เดือนนี้', value: 'month' as Period }
]

const dateRange = computed(() => {
  const end = today()
  if (period.value === '7') return { start: nDaysAgo(7), end }
  if (period.value === '30') return { start: nDaysAgo(30), end }
  return { start: startOfMonth(), end: endOfMonth() }
})

// Summary
const summary = computed(() => ({
  totalCalIn: foodStore.meals.reduce((s, m) => s + m.totalCalories, 0),
  totalCalOut: exerciseStore.activities.reduce((s, e) => s + (e.calories ?? 0), 0),
  totalDistance: +exerciseStore.activities.reduce((s, e) => s + (e.distance ?? 0), 0).toFixed(2),
  exerciseCount: exerciseStore.activities.length,
  get calBalance() { return this.totalCalIn - this.totalCalOut },
  cheatDays: dailyStore.logs.filter((d) => d.isCheatDay).length
}))

// Chart data
const weightDates = computed(() => weightStore.logs.map((l) => l.date.slice(5)))
const weightValues = computed(() => weightStore.logs.map((l) => l.morning ?? l.postWorkout ?? null))

// Group calories by date
const calDates = computed(() => {
  const dates = new Set([
    ...foodStore.meals.map((m) => m.date),
    ...exerciseStore.activities.map((a) => a.date)
  ])
  return [...dates].sort()
})
const calIn = computed(() => calDates.value.map((d) =>
  foodStore.meals.filter((m) => m.date === d).reduce((s, m) => s + m.totalCalories, 0)
))
const calOut = computed(() => calDates.value.map((d) =>
  exerciseStore.activities.filter((a) => a.date === d).reduce((s, e) => s + (e.calories ?? 0), 0)
))

const healthDates = computed(() => healthStore.metrics.map((m) => m.date.slice(5)))
const sleepData = computed(() => healthStore.metrics.map((m) => m.sleepDuration ?? 0))
const stressData = computed(() => healthStore.metrics.map((m) => m.stressScore ?? 0))

// Top exercises
const topExercises = computed(() => {
  const map: Record<string, { count: number; totalDistance: number }> = {}
  exerciseStore.activities.forEach((a) => {
    if (!map[a.type]) map[a.type] = { count: 0, totalDistance: 0 }
    map[a.type].count++
    map[a.type].totalDistance += a.distance ?? 0
  })
  return Object.entries(map)
    .map(([type, data]) => ({ type, ...data, totalDistance: +data.totalDistance.toFixed(2) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const highStressDays = computed(() =>
  healthStore.metrics.filter((m) => (m.stressScore ?? 0) > 70).length
)

async function loadData() {
  loading.value = true
  const { start, end } = dateRange.value
  await Promise.all([
    weightStore.fetchRange(start, end),
    exerciseStore.fetchRange(start, end),
    foodStore.fetchRange(start, end),
    healthStore.fetchRange(start, end),
    dailyStore.fetchRange(start, end),
    goalsStore.fetch()
  ])
  loading.value = false
}

async function handleExport() {
  exporting.value = true
  try {
    exportWeeklyReportExcel({
      exercises: exerciseStore.activities,
      meals: foodStore.meals,
      weights: weightStore.logs,
      health: healthStore.metrics,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end
    })
  } finally {
    exporting.value = false
  }
}

async function handleExportCSV() {
  exportExerciseCSV(exerciseStore.activities)
}

watch(period, loadData)
onMounted(loadData)
</script>
