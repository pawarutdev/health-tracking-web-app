<template>
  <AppLayout>
    <!-- Date -->
    <div class="flex items-center gap-2 mb-4">
      <label class="text-sm font-medium text-gray-600">วันที่</label>
      <DatePicker v-model="selectedDateObj" dateFormat="dd-mm-yy" class="flex-1" showIcon />
    </div>

    <!-- Recovery Status Card -->
    <div class="mb-4 rounded-2xl p-4 text-white shadow-md" :class="statusBg">
      <div class="flex items-center gap-3">
        <i :class="[statusIcon, 'text-3xl']" />
        <div>
          <div class="font-bold text-lg">{{ statusLabel }}</div>
          <div class="text-sm opacity-90">{{ statusDesc }}</div>
        </div>
      </div>
    </div>

    <!-- Recovery Status Selector -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">สถานะการฟื้นฟู</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="opt in recoveryOptions"
          :key="opt.value"
          class="py-3 rounded-xl text-sm font-medium border transition-all"
          :class="form.recoveryStatus === opt.value ? opt.activeClass : 'bg-gray-50 text-gray-600 border-gray-200'"
          @click="form.recoveryStatus = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Sleep -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">💤 การนอนหลับ</h3>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 w-32">ระยะเวลา (ชม.)</label>
          <InputNumber v-model="form.sleepDuration" :minFractionDigits="1" :maxFractionDigits="1" suffix=" ชม." class="flex-1" placeholder="0.0" :min="0" :max="24" />
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600 w-32">คะแนนการนอน</label>
          <InputNumber v-model="form.sleepScore" class="flex-1" placeholder="0-100" :min="0" :max="100" />
        </div>
      </div>
    </div>

    <!-- Stress & Body Battery -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">😤 ความเครียด & พลังงาน</h3>
      <div class="flex flex-col gap-3">
        <div>
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>ความเครียด</span>
            <span class="font-medium">{{ form.stressScore ?? 0 }}/100</span>
          </div>
          <Slider v-model="form.stressScore" :min="0" :max="100" class="w-full" />
        </div>
        <div>
          <div class="flex justify-between text-sm text-gray-600 mb-1">
            <span>Body Battery</span>
            <span class="font-medium">{{ form.bodyBattery ?? 0 }}%</span>
          </div>
          <Slider v-model="form.bodyBattery" :min="0" :max="100" class="w-full" />
        </div>
      </div>
    </div>

    <!-- HR & HRV -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">❤️ ชีพจรขณะพัก</h3>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">Resting HR (bpm)</label>
          <InputNumber v-model="form.restingHR" fluid :min="0" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">HRV (ms)</label>
          <InputNumber v-model="form.hrv" fluid :min="0" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">เวลาฟื้นฟู (ชม.)</label>
          <InputNumber v-model="form.recoveryTime" fluid :min="0" />
        </div>
      </div>
    </div>

    <!-- Injuries -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-700">🩹 การบาดเจ็บ</h3>
        <Button label="+ เพิ่ม" size="small" severity="secondary" @click="addInjury" />
      </div>
      <div v-if="form.injuries?.length" class="flex flex-col gap-2">
        <div v-for="(injury, idx) in form.injuries" :key="idx" class="flex gap-2 items-start">
          <InputText v-model="injury.location" placeholder="ตำแหน่ง (เช่น เข่าซ้าย)" class="flex-1 text-sm" />
          <Select v-model="injury.severity" :options="injuryOptions" optionLabel="label" optionValue="value" class="w-28" />
          <button class="p-1 text-red-400" @click="form.injuries?.splice(idx, 1)"><i class="pi pi-times" /></button>
        </div>
      </div>
      <div v-else class="text-sm text-gray-400 text-center py-2">ไม่มีการบาดเจ็บ</div>
    </div>

    <Button
      label="บันทึกข้อมูลสุขภาพ"
      icon="pi pi-check"
      :loading="saving"
      class="w-full"
      size="large"
      @click="handleSave"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Select from 'primevue/select'
import Slider from 'primevue/slider'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useHealthStore } from '@/stores/health'
import { today } from '@/utils/date'
import type { RecoveryStatus, Injury, InjurySeverity } from '@/types'

const toast = useToast()
const healthStore = useHealthStore()
const saving = ref(false)

const selectedDateObj = ref(new Date())
const selectedDate = computed(() => {
  const d = selectedDateObj.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const form = reactive<{
  sleepDuration: number | null
  sleepScore: number | null
  stressScore: number
  bodyBattery: number
  restingHR: number | null
  hrv: number | null
  recoveryTime: number | null
  recoveryStatus: RecoveryStatus
  injuries: Injury[]
}>({
  sleepDuration: null,
  sleepScore: null,
  stressScore: 25,
  bodyBattery: 75,
  restingHR: null,
  hrv: null,
  recoveryTime: null,
  recoveryStatus: 'ready',
  injuries: []
})

const recoveryOptions = [
  { label: '✅ พร้อมออกกำลังกาย', value: 'ready' as RecoveryStatus, activeClass: 'bg-green-500 text-white border-green-500' },
  { label: '🟡 ออกเบาๆ ได้', value: 'light' as RecoveryStatus, activeClass: 'bg-yellow-400 text-gray-800 border-yellow-400' },
  { label: '🟠 ควรพักผ่อน', value: 'rest' as RecoveryStatus, activeClass: 'bg-orange-400 text-white border-orange-400' },
  { label: '🔴 เสี่ยง Overtraining', value: 'overtraining' as RecoveryStatus, activeClass: 'bg-red-500 text-white border-red-500' }
]

const injuryOptions = [
  { label: 'เล็กน้อย', value: 'mild' as InjurySeverity },
  { label: 'ปานกลาง', value: 'moderate' as InjurySeverity },
  { label: 'รุนแรง', value: 'severe' as InjurySeverity }
]

const statusBg = computed(() => ({
  ready: 'bg-green-500',
  light: 'bg-yellow-400',
  rest: 'bg-orange-400',
  overtraining: 'bg-red-500'
}[form.recoveryStatus]))
const statusIcon = computed(() => ({
  ready: 'pi pi-check-circle',
  light: 'pi pi-exclamation-circle',
  rest: 'pi pi-info-circle',
  overtraining: 'pi pi-times-circle'
}[form.recoveryStatus]))
const statusLabel = computed(() => ({
  ready: 'พร้อมออกกำลังกาย',
  light: 'ออกกำลังกายเบาๆ ได้',
  rest: 'ควรพักผ่อน',
  overtraining: 'เสี่ยง Overtraining!'
}[form.recoveryStatus]))
const statusDesc = computed(() => ({
  ready: 'ร่างกายพร้อมรับการฝึกซ้อม',
  light: 'แนะนำออกกำลังกายเบา เช่น เดิน โยคะ',
  rest: 'ร่างกายต้องการพักผ่อน งดออกกำลังกายหนัก',
  overtraining: 'หยุดพักทันที เสี่ยงบาดเจ็บและฟื้นฟูช้า'
}[form.recoveryStatus]))

function addInjury() {
  form.injuries.push({ location: '', severity: 'mild' })
}

async function loadMetrics(date: string) {
  await healthStore.fetchByDate(date)
  if (healthStore.currentMetrics) {
    const m = healthStore.currentMetrics
    form.sleepDuration = m.sleepDuration ?? null
    form.sleepScore = m.sleepScore ?? null
    form.stressScore = m.stressScore ?? 25
    form.bodyBattery = m.bodyBattery ?? 75
    form.restingHR = m.restingHR ?? null
    form.hrv = m.hrv ?? null
    form.recoveryTime = m.recoveryTime ?? null
    form.recoveryStatus = m.recoveryStatus ?? 'ready'
    form.injuries = m.injuries ? [...m.injuries] : []
  }
}

async function handleSave() {
  saving.value = true
  try {
    await healthStore.save({
      date: selectedDate.value,
      sleepDuration: form.sleepDuration ?? undefined,
      sleepScore: form.sleepScore ?? undefined,
      stressScore: form.stressScore,
      bodyBattery: form.bodyBattery,
      restingHR: form.restingHR ?? undefined,
      hrv: form.hrv ?? undefined,
      recoveryTime: form.recoveryTime ?? undefined,
      recoveryStatus: form.recoveryStatus,
      injuries: form.injuries.filter((i) => i.location)
    })
    toast.add({ severity: 'success', summary: 'บันทึกสำเร็จ', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', life: 3000 })
  } finally {
    saving.value = false
  }
}

watch(selectedDate, loadMetrics)
onMounted(() => loadMetrics(selectedDate.value))
</script>
