<template>
  <AppLayout>
    <!-- Date -->
    <div class="flex items-center gap-2 mb-4">
      <label class="text-sm font-medium text-gray-600">วันที่</label>
      <DatePicker v-model="selectedDateObj" dateFormat="dd-mm-yy" class="flex-1" showIcon />
    </div>

    <!-- 7-day Trend Chart -->
    <WeightTrendChart
      v-if="trendDates.length"
      :dates="trendDates"
      :weights="trendWeights"
      :targetWeight="goalsStore.goals.targetWeight"
      class="mb-4"
    />

    <!-- Latest Stats -->
    <div class="grid grid-cols-3 gap-3 mb-4">
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-lg font-bold text-blue-600">{{ latestWeight ?? '-' }}</div>
        <div class="text-xs text-gray-500">น้ำหนักล่าสุด (kg)</div>
      </div>
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-lg font-bold" :class="weightChange && weightChange > 0 ? 'text-red-500' : 'text-green-600'">
          {{ weightChange !== undefined ? (weightChange > 0 ? '+' : '') + weightChange : '-' }}
        </div>
        <div class="text-xs text-gray-500">เปลี่ยน (kg)</div>
      </div>
      <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 text-center">
        <div class="text-lg font-bold text-purple-600">{{ goalsStore.goals.targetWeight ?? '-' }}</div>
        <div class="text-xs text-gray-500">เป้าหมาย (kg)</div>
      </div>
    </div>

    <!-- Weight Form -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-gray-700">บันทึกน้ำหนัก</h3>
        <button
          v-if="weightStore.latestWeight !== undefined"
          class="text-xs text-blue-600 flex items-center gap-1"
          @click="useLatest"
        >
          <i class="pi pi-refresh" />
          ใช้ค่าล่าสุด ({{ weightStore.latestWeight }} kg)
        </button>
      </div>

      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 w-36">⏰ น้ำหนักตอนเช้า</label>
          <InputNumber v-model="form.morning" :minFractionDigits="1" :maxFractionDigits="2" suffix=" kg" fluid placeholder="0.0" />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 w-36">🏃 หลังออกกำลังกาย</label>
          <InputNumber v-model="form.postWorkout" :minFractionDigits="1" :maxFractionDigits="2" suffix=" kg" fluid placeholder="0.0" />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 w-36">🌙 ก่อนนอน</label>
          <InputNumber v-model="form.beforeSleep" :minFractionDigits="1" :maxFractionDigits="2" suffix=" kg" fluid placeholder="0.0" />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 w-36">📏 รอบเอว</label>
          <InputNumber v-model="form.waist" :minFractionDigits="1" :maxFractionDigits="1" suffix=" cm" fluid placeholder="0.0" />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 w-36">💧 ไขมันร่างกาย</label>
          <InputNumber v-model="form.bodyFat" :minFractionDigits="1" :maxFractionDigits="1" suffix=" %" fluid placeholder="0.0" />
        </div>

        <Button
          label="บันทึกน้ำหนัก"
          icon="pi pi-check"
          :loading="saving"
          class="w-full mt-2"
          @click="handleSave"
        />
      </div>
    </div>

    <!-- History List -->
    <div v-if="recentLogs.length" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <h3 class="text-sm font-semibold text-gray-700">ประวัติน้ำหนัก (14 วัน)</h3>
      </div>
      <div
        v-for="log in recentLogs"
        :key="log.date"
        class="flex items-center px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50"
        @click="loadLog(log)"
      >
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-800">{{ formatDate(log.date) }}</div>
          <div class="text-xs text-gray-500">{{ log.morning ? log.morning + ' kg เช้า' : '' }} {{ log.waist ? '· ' + log.waist + ' cm' : '' }}</div>
        </div>
        <div class="text-sm font-semibold text-blue-600">{{ log.morning ?? log.postWorkout ?? log.beforeSleep ?? '-' }} kg</div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import AppLayout from '@/components/layout/AppLayout.vue'
import WeightTrendChart from '@/components/charts/WeightTrendChart.vue'
import { useWeightStore } from '@/stores/weight'
import { useGoalsStore } from '@/stores/goals'
import { today, nDaysAgo, formatDate } from '@/utils/date'
import type { WeightLog } from '@/types'

const toast = useToast()
const weightStore = useWeightStore()
const goalsStore = useGoalsStore()
const saving = ref(false)

const selectedDateObj = ref(new Date())
const selectedDate = computed(() => {
  const d = selectedDateObj.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const form = reactive({
  morning: null as number | null,
  postWorkout: null as number | null,
  beforeSleep: null as number | null,
  waist: null as number | null,
  bodyFat: null as number | null
})

const latestWeight = computed(() => weightStore.latestWeight?.toFixed(1))
const weightChange = computed(() => weightStore.weightChange)

const recentLogs = computed(() =>
  [...weightStore.logs].sort((a, b) => b.date.localeCompare(a.date))
)

const trendDates = computed(() =>
  weightStore.sevenDayTrend.map((l) => l.date.slice(5))
)
const trendWeights = computed(() =>
  weightStore.sevenDayTrend.map((l) => l.weight ?? null)
)

function loadLog(log: WeightLog) {
  const d = new Date(log.date)
  selectedDateObj.value = d
  form.morning = log.morning ?? null
  form.postWorkout = log.postWorkout ?? null
  form.beforeSleep = log.beforeSleep ?? null
  form.waist = log.waist ?? null
  form.bodyFat = log.bodyFat ?? null
}

function useLatest() {
  const w = weightStore.latestWeight
  if (w !== undefined && (form.morning === null || form.morning === undefined)) {
    form.morning = w
  }
}

async function handleSave() {
  if (form.morning === null && form.postWorkout === null && form.beforeSleep === null) {
    toast.add({ severity: 'warn', summary: 'กรุณากรอกน้ำหนักอย่างน้อย 1 ช่อง', life: 2500 })
    return
  }
  saving.value = true
  try {
    const log: WeightLog = {
      date: selectedDate.value,
      morning: form.morning ?? undefined,
      postWorkout: form.postWorkout ?? undefined,
      beforeSleep: form.beforeSleep ?? undefined,
      waist: form.waist ?? undefined,
      bodyFat: form.bodyFat ?? undefined
    }
    await weightStore.save(log)
    toast.add({ severity: 'success', summary: 'บันทึกสำเร็จ', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', life: 3000 })
  } finally {
    saving.value = false
  }
}

watch(selectedDate, async (date) => {
  const existing = await weightStore.fetchByDate(date)
  if (existing) loadLog(existing)
  else {
    form.morning = weightStore.latestWeight ?? null
    form.postWorkout = null
    form.beforeSleep = null
    form.waist = null
    form.bodyFat = null
  }
})

onMounted(async () => {
  await Promise.all([
    weightStore.fetchRange(nDaysAgo(14), today()),
    goalsStore.fetch()
  ])
  const existing = await weightStore.fetchByDate(selectedDate.value)
  if (existing) loadLog(existing)
  else if (weightStore.latestWeight !== undefined) {
    form.morning = weightStore.latestWeight
  }
})
</script>
