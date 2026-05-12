<template>
  <AppLayout>
    <!-- Date Selector -->
    <div class="flex items-center justify-between mb-3">
      <button class="p-1.5 rounded-full bg-white shadow-sm" @click="changeDay(-1)">
        <i class="pi pi-chevron-left text-gray-600 text-xs" />
      </button>
      <button class="flex flex-col items-center" @click="goToday">
        <span class="text-sm font-semibold text-gray-800">{{ formatDateThai(selectedDate) }}</span>
        <span v-if="isToday" class="text-[10px] text-blue-600 font-medium">วันนี้</span>
      </button>
      <button class="p-1.5 rounded-full bg-white shadow-sm" @click="changeDay(1)" :disabled="isToday">
        <i class="pi pi-chevron-right text-gray-600 text-xs" :class="isToday ? 'opacity-30' : ''" />
      </button>
    </div>

    <!-- Recovery Status Banner -->
    <div v-if="recoveryStatus" class="mb-3 rounded-xl px-3 py-2 text-white text-center text-sm font-semibold shadow-sm" :class="recoveryBannerClass">
      {{ recoveryLabel }}
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 gap-2 mb-3">
      <StatCard
        label="น้ำหนักล่าสุด"
        :value="latestWeight"
        unit="kg"
        icon="pi pi-chart-line"
        color="blue"
        :subtitle="weightChangeText"
        :subtitlePositive="weightChangePositive"
      />
      <StatCard
        label="แคลอรี่รับเข้า"
        :value="todayCalIn"
        unit="kcal"
        icon="pi pi-sun"
        color="orange"
      />
      <StatCard
        label="แคลอรี่เผาผลาญ"
        :value="todayCalOut"
        unit="kcal"
        icon="pi pi-bolt"
        color="green"
      />
      <StatCard
        label="ระยะทางวันนี้"
        :value="todayDistance"
        unit="km"
        icon="pi pi-map-marker"
        color="purple"
      />
      <StatCard
        label="ชีพจรเฉลี่ย"
        :value="avgHR"
        unit="bpm"
        icon="pi pi-heart"
        color="red"
      />
      <StatCard
        label="ความเครียด"
        :value="stressScore"
        unit="/100"
        icon="pi pi-face-smile"
        color="teal"
      />
      <StatCard
        label="การนอนหลับ"
        :value="sleepDisplay"
        unit=""
        icon="pi pi-moon"
        color="purple"
      />
      <StatCard
        label="Body Battery"
        :value="bodyBattery"
        unit="%"
        icon="pi pi-bolt"
        color="green"
      />
    </div>

    <!-- Calorie Balance -->
    <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-3">
      <h3 class="text-xs font-semibold text-gray-600 mb-2">สมดุลแคลอรี่</h3>
      <div class="flex items-center gap-3">
        <div class="flex-1">
          <div class="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>รับเข้า {{ todayCalIn }} kcal</span>
            <span>{{ calorieGoal }} kcal</span>
          </div>
          <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="caloriePct > 100 ? 'bg-red-500' : 'bg-orange-400'"
              :style="{ width: Math.min(caloriePct, 100) + '%' }"
            />
          </div>
        </div>
        <span class="text-xs font-semibold" :class="calBalance >= 0 ? 'text-red-500' : 'text-green-600'">
          {{ calBalance >= 0 ? '+' : '' }}{{ calBalance }} kcal
        </span>
      </div>
    </div>

    <!-- Nutrition Summary -->
    <div v-if="todayMeals.length" class="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-3">
      <h3 class="text-xs font-semibold text-gray-600 mb-2">สรุปโภชนาการวันนี้</h3>
      <div class="grid grid-cols-4 gap-2 text-center">
        <div>
          <div class="text-sm font-bold text-orange-500">{{ nutritionTotals.calories }}</div>
          <div class="text-[10px] text-gray-500">แคลอรี่</div>
        </div>
        <div>
          <div class="text-sm font-bold text-blue-600">{{ nutritionTotals.protein }}g</div>
          <div class="text-[10px] text-gray-500">โปรตีน</div>
        </div>
        <div>
          <div class="text-sm font-bold text-yellow-500">{{ nutritionTotals.carb }}g</div>
          <div class="text-[10px] text-gray-500">คาร์บ</div>
        </div>
        <div>
          <div class="text-sm font-bold text-red-400">{{ nutritionTotals.fat }}g</div>
          <div class="text-[10px] text-gray-500">ไขมัน</div>
        </div>
      </div>
    </div>



    <!-- Today's Exercises -->
    <div v-if="todayExercises.length" class="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 border-b border-gray-50">
        <h3 class="text-xs font-semibold text-gray-700">กิจกรรมวันนี้</h3>
        <router-link to="/exercise" class="text-[10px] text-blue-600">ดูทั้งหมด</router-link>
      </div>
      <div v-for="ex in todayExercises" :key="ex.id" class="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0">
        <div class="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <i :class="exerciseIcon(ex.type)" class="text-blue-600 text-xs" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-gray-800 truncate">{{ ex.type }}</p>
          <p class="text-[10px] text-gray-500">{{ ex.duration ? ex.duration + ' นาที' : '' }} {{ ex.distance ? '· ' + ex.distance + ' กม.' : '' }}</p>
        </div>
        <span class="text-xs font-semibold text-orange-500">{{ ex.calories ?? 0 }} kcal</span>
      </div>
    </div>

    <!-- Today's Meals Summary -->
    <div v-if="todayMeals.length" class="bg-white rounded-xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 border-b border-gray-50">
        <h3 class="text-xs font-semibold text-gray-700">มื้ออาหารวันนี้</h3>
        <router-link to="/food" class="text-[10px] text-blue-600">ดูทั้งหมด</router-link>
      </div>
      <div v-for="meal in todayMeals" :key="meal.id" class="flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-0">
        <div class="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <i class="pi pi-apple text-orange-500 text-xs" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-gray-800">{{ mealTypeLabel(meal.type) }}</p>
          <p class="text-[10px] text-gray-500">{{ meal.items.length }} รายการ</p>
        </div>
        <span class="text-xs font-semibold text-orange-500">{{ meal.totalCalories }} kcal</span>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatCard from '@/components/common/StatCard.vue'
import { useWeightStore } from '@/stores/weight'
import { useExerciseStore } from '@/stores/exercise'
import { useFoodStore } from '@/stores/food'
import { useHealthStore } from '@/stores/health'
import { useGoalsStore } from '@/stores/goals'
import { useBedtimeStore } from '@/stores/bedtime'
import { today, formatDateThai, nDaysAgo, formatDuration } from '@/utils/date'
import type { RecoveryStatus } from '@/types'

// Quick Action helper component
const QuickAction = defineComponent({
  props: { to: String, icon: String, label: String, color: String },
  setup(props) {
    const router = useRouter()
    return () => h(
      'button',
      {
        class: 'flex flex-col items-center gap-1 p-2',
        onClick: () => router.push(props.to!)
      },
      [
        h('div', { class: `w-12 h-12 rounded-2xl ${props.color} flex items-center justify-center shadow-sm` }, [
          h('i', { class: `${props.icon} text-white text-xl` })
        ]),
        h('span', { class: 'text-xs text-gray-600 font-medium' }, props.label)
      ]
    )
  }
})

const router = useRouter()
const weightStore = useWeightStore()
const exerciseStore = useExerciseStore()
const foodStore = useFoodStore()
const healthStore = useHealthStore()
const goalsStore = useGoalsStore()
const bedtimeStore = useBedtimeStore()

const selectedDate = ref(today())
const isToday = computed(() => selectedDate.value === today())

function changeDay(delta: number) {
  const d = new Date(selectedDate.value)
  d.setDate(d.getDate() + delta)
  const newDate = d.toISOString().slice(0, 10)
  if (newDate <= today()) selectedDate.value = newDate
}
function goToday() { selectedDate.value = today() }

const latestWeight = computed(() => {
  const bw = bedtimeStore.currentSummary?.latestWeight
  if (bw !== undefined) return bw.toFixed(1)
  return weightStore.latestWeight?.toFixed(1)
})
const weightChangeText = computed(() => {
  const wc = weightStore.weightChange
  if (wc === undefined) return undefined
  return wc > 0 ? `+${wc} kg จากเมื่อวาน` : `${wc} kg จากเมื่อวาน`
})
const weightChangePositive = computed(() => {
  const wc = weightStore.weightChange
  return wc !== undefined ? wc <= 0 : undefined
})

const todayExercises = computed(() => exerciseStore.activities.filter(a => a.date === selectedDate.value))
const todayMeals = computed(() => foodStore.meals.filter(m => m.date === selectedDate.value))

const todayCalIn = computed(() => todayMeals.value.reduce((s, m) => s + m.totalCalories, 0))
const nutritionTotals = computed(() => ({
  calories: todayMeals.value.reduce((s, m) => s + m.totalCalories, 0),
  protein: +todayMeals.value.reduce((s, m) => s + m.totalProtein, 0).toFixed(1),
  carb: +todayMeals.value.reduce((s, m) => s + m.totalCarb, 0).toFixed(1),
  fat: +todayMeals.value.reduce((s, m) => s + m.totalFat, 0).toFixed(1)
}))
const todayCalOut = computed(() => {
  // Prefer Garmin daily total (ภาพรวมก่อนนอน) when available
  const total = bedtimeStore.currentSummary?.totalCalories
  if (total != null) return total
  return todayExercises.value.reduce((s, e) => s + (e.calories ?? 0), 0)
})
const todayDistance = computed(() => {
  const d = todayExercises.value.reduce((s, e) => s + (e.distance ?? 0), 0)
  return d > 0 ? +d.toFixed(2) : null
})
const avgHR = computed(() => {
  const hrs = todayExercises.value.filter(e => e.avgHR).map(e => e.avgHR!)
  if (!hrs.length) return null
  return Math.round(hrs.reduce((s, h) => s + h, 0) / hrs.length)
})

const stressScore = computed(() => bedtimeStore.currentSummary?.stressScore ?? healthStore.currentMetrics?.stressScore ?? null)
const bodyBattery = computed(() => bedtimeStore.currentSummary?.bodyBattery ?? healthStore.currentMetrics?.bodyBattery ?? null)
const sleepDisplay = computed(() => {
  const s = bedtimeStore.currentSummary?.sleepDuration ?? healthStore.currentMetrics?.sleepDuration
  if (!s) return null
  return `${Math.floor(s)}:${String(Math.round((s % 1) * 60)).padStart(2, '0')}`
})

const recoveryStatus = computed(() => healthStore.currentMetrics?.recoveryStatus)
const recoveryBannerClass = computed(() => ({
  ready: 'bg-green-500',
  light: 'bg-yellow-400 text-gray-800',
  rest: 'bg-orange-400',
  overtraining: 'bg-red-500'
}[recoveryStatus.value ?? 'ready']))
const recoveryLabel = computed(() => ({
  ready: '✅ พร้อมออกกำลังกาย',
  light: '🟡 แนะนำออกเบาๆ',
  rest: '🟠 ควรพักผ่อน',
  overtraining: '🔴 เสี่ยง Overtraining'
}[recoveryStatus.value ?? 'ready']))

const calorieGoal = computed(() => goalsStore.goals.dailyCalorieTarget ?? 2000)
const caloriePct = computed(() => Math.round((todayCalIn.value / calorieGoal.value) * 100))
const calBalance = computed(() => todayCalIn.value - todayCalOut.value)

const quickActions = [
  { to: '/exercise', icon: 'pi pi-bolt', label: 'ออกกำลังกาย', color: 'bg-blue-500' },
  { to: '/food', icon: 'pi pi-apple', label: 'บันทึกอาหาร', color: 'bg-orange-400' },
  { to: '/weight', icon: 'pi pi-chart-line', label: 'น้ำหนัก', color: 'bg-green-500' },
  { to: '/daily', icon: 'pi pi-calendar', label: 'บันทึกวัน', color: 'bg-purple-500' }
]

function exerciseIcon(type: string): string {
  const map: Record<string, string> = {
    'วิ่ง': 'pi pi-directions-run', 'เดิน': 'pi pi-map-marker',
    'จักรยาน': 'pi pi-map', 'ยิม': 'pi pi-microsoft',
    'ว่ายน้ำ': 'pi pi-wave-pulse', 'แบดมินตัน': 'pi pi-star'
  }
  return map[type] ?? 'pi pi-bolt'
}

function mealTypeLabel(type: string): string {
  return ({ breakfast: 'มื้อเช้า', lunch: 'มื้อกลางวัน', dinner: 'มื้อเย็น', snack: 'ของว่าง' }[type] ?? type)
}

async function loadData() {
  const start = nDaysAgo(14)
  await Promise.all([
    weightStore.fetchRange(start, today()),
    exerciseStore.fetchByDate(selectedDate.value),
    foodStore.fetchByDate(selectedDate.value),
    healthStore.fetchByDate(selectedDate.value),
    bedtimeStore.fetchByDate(selectedDate.value),
    goalsStore.fetch()
  ])
}

watch(selectedDate, async () => {
  await Promise.all([
    exerciseStore.fetchByDate(selectedDate.value),
    foodStore.fetchByDate(selectedDate.value),
    healthStore.fetchByDate(selectedDate.value),
    bedtimeStore.fetchByDate(selectedDate.value)
  ])
})

onMounted(loadData)
</script>
