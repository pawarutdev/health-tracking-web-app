<template>
  <AppLayout>
    <!-- Date picker -->
    <div class="flex items-center gap-2 mb-4">
      <label class="text-sm font-medium text-gray-600">วันที่</label>
      <DatePicker v-model="selectedDateObj" dateFormat="dd-mm-yy" class="flex-1" showIcon />
    </div>

    <div class="flex flex-col gap-4">
      <!-- Physical Feeling -->
      <div class="card-section">
        <h3 class="section-title">ความรู้สึกร่างกาย</h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="opt in feelingOptions"
            :key="opt.value"
            class="btn-option"
            :class="form.physicalFeeling === opt.value ? 'btn-option-active' : 'btn-option-inactive'"
            @click="form.physicalFeeling = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Daily Goal -->
      <div class="card-section">
        <h3 class="section-title">เป้าหมายวันนี้</h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="opt in goalOptions"
            :key="opt.value"
            class="btn-option"
            :class="form.goal === opt.value ? 'btn-option-active' : 'btn-option-inactive'"
            @click="form.goal = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Weights -->
      <div class="card-section">
        <div class="flex items-center justify-between mb-3">
          <h3 class="section-title mb-0">น้ำหนักวันนี้</h3>
          <button
            v-if="weightStore.latestWeight !== undefined"
            class="text-xs text-blue-600 flex items-center gap-1"
            @click="useLatestWeight"
          >
            <i class="pi pi-refresh" />
            ใช้ค่าล่าสุด ({{ weightStore.latestWeight }} kg)
          </button>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-3">
            <label class="text-sm text-gray-600 w-28">น้ำหนักเช้า</label>
            <InputNumber v-model="form.morningWeight" :minFractionDigits="1" :maxFractionDigits="2" suffix=" kg" fluid placeholder="0.0" />
          </div>
          <div class="flex items-center gap-3">
            <label class="text-sm text-gray-600 w-28">หลังออกกำลังกาย</label>
            <InputNumber v-model="form.postWorkoutWeight" :minFractionDigits="1" :maxFractionDigits="2" suffix=" kg" fluid placeholder="0.0" />
          </div>
          <p v-if="weightStore.latestWeight !== undefined && form.morningWeight === null" class="text-[11px] text-gray-400">
            💡 ไม่ได้ชั่งวันนี้? ข้ามไปได้ ระบบจะใช้น้ำหนักล่าสุดให้
          </p>
        </div>
      </div>

      <!-- Cheat Day -->
      <div class="card-section">
        <div class="flex items-center justify-between mb-3">
          <h3 class="section-title mb-0">Cheat Day / โกง</h3>
          <ToggleSwitch v-model="form.isCheatDay" />
        </div>
        <div v-if="form.isCheatDay" class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">เหตุผล</label>
            <InputText v-model="form.cheatReason" placeholder="เหตุผลที่โกง..." class="w-full" />
          </div>
          <div class="flex items-center gap-3">
            <label class="text-sm text-gray-600 w-28">แอลกอฮอล์ (ยูนิต)</label>
            <InputNumber v-model="form.alcoholAmount" fluid placeholder="0" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">ความเสียหาย</label>
            <div class="flex gap-2">
              <button
                v-for="opt in damageOptions"
                :key="opt.value"
                class="btn-option flex-1"
                :class="form.damageLevel === opt.value ? 'btn-option-active' : 'btn-option-inactive'"
                @click="form.damageLevel = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="card-section">
        <h3 class="section-title">บันทึก / หมายเหตุ</h3>
        <Textarea v-model="form.notes" rows="3" class="w-full" placeholder="บันทึกสิ่งที่เกิดขึ้นวันนี้..." autoResize />
      </div>

      <!-- Save Button -->
      <Button
        label="บันทึกข้อมูล"
        icon="pi pi-check"
        :loading="saving"
        class="w-full"
        size="large"
        @click="handleSave"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDailyStore } from '@/stores/daily'
import { useWeightStore } from '@/stores/weight'
import { today, nDaysAgo } from '@/utils/date'
import type { DailyLog, PhysicalFeeling, DailyGoal, DamageLevel } from '@/types'

const toast = useToast()
const dailyStore = useDailyStore()
const weightStore = useWeightStore()
const saving = ref(false)

const todayStr = today()
const selectedDateObj = ref(new Date())
const selectedDate = computed(() => {
  const d = selectedDateObj.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const form = reactive<{
  physicalFeeling: PhysicalFeeling
  goal: DailyGoal
  morningWeight?: number | null
  postWorkoutWeight?: number | null
  isCheatDay: boolean
  cheatReason?: string
  alcoholAmount?: number | null
  damageLevel?: DamageLevel
  notes?: string
}>({
  physicalFeeling: 'fresh',
  goal: 'fat_loss',
  morningWeight: null,
  postWorkoutWeight: null,
  isCheatDay: false,
  cheatReason: '',
  alcoholAmount: null,
  damageLevel: undefined,
  notes: ''
})

const feelingOptions = [
  { label: '😊 สดชื่น', value: 'fresh' as PhysicalFeeling },
  { label: '😴 เหนื่อย', value: 'tired' as PhysicalFeeling },
  { label: '💪 เจ็บกล้ามเนื้อ', value: 'sore' as PhysicalFeeling },
  { label: '😰 เครียด', value: 'stressed' as PhysicalFeeling }
]

const goalOptions = [
  { label: '🔥 ลดไขมัน', value: 'fat_loss' as DailyGoal },
  { label: '🏋️ ฝึกซ้อม', value: 'training' as DailyGoal },
  { label: '😴 พักฟื้น', value: 'rest' as DailyGoal },
  { label: '🥗 ควบคุมอาหาร', value: 'diet_control' as DailyGoal }
]

const damageOptions = [
  { label: '😐 เล็กน้อย', value: 'low' as DamageLevel },
  { label: '😟 ปานกลาง', value: 'medium' as DamageLevel },
  { label: '😱 มาก', value: 'high' as DamageLevel }
]

async function loadLog(date: string) {
  await dailyStore.fetchByDate(date)
  if (dailyStore.currentLog) {
    Object.assign(form, dailyStore.currentLog)
  } else {
    Object.assign(form, {
      physicalFeeling: 'fresh',
      goal: 'fat_loss',
      morningWeight: weightStore.latestWeight ?? null,
      postWorkoutWeight: null,
      isCheatDay: false,
      cheatReason: '',
      alcoholAmount: null,
      damageLevel: undefined,
      notes: ''
    })
  }
}

function useLatestWeight() {
  if (weightStore.latestWeight !== undefined) {
    form.morningWeight = weightStore.latestWeight
  }
}

watch(selectedDate, loadLog)
onMounted(async () => {
  await weightStore.fetchRange(nDaysAgo(14), today())
  await loadLog(selectedDate.value)
})

async function handleSave() {
  saving.value = true
  try {
    const log: DailyLog = {
      date: selectedDate.value,
      physicalFeeling: form.physicalFeeling,
      goal: form.goal,
      morningWeight: form.morningWeight ?? undefined,
      postWorkoutWeight: form.postWorkoutWeight ?? undefined,
      isCheatDay: form.isCheatDay,
      cheatReason: form.cheatReason,
      alcoholAmount: form.alcoholAmount ?? undefined,
      damageLevel: form.damageLevel,
      notes: form.notes
    }
    await dailyStore.save(log)
    toast.add({ severity: 'success', summary: 'บันทึกสำเร็จ', detail: 'ข้อมูลประจำวันถูกบันทึกแล้ว', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', detail: 'ไม่สามารถบันทึกข้อมูลได้', life: 3000 })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.card-section {
  @apply bg-white rounded-2xl p-4 shadow-sm border border-gray-100;
}
.section-title {
  @apply text-sm font-semibold text-gray-700 mb-3;
}
.btn-option {
  @apply py-2.5 px-3 rounded-xl text-sm font-medium transition-all border;
}
.btn-option-active {
  @apply bg-blue-600 text-white border-blue-600;
}
.btn-option-inactive {
  @apply bg-gray-50 text-gray-600 border-gray-200;
}
</style>
