<template>
  <AppLayout>
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
        <h2 class="text-base font-bold mb-1">🎯 เป้าหมายสุขภาพ</h2>
      </div>

      <!-- Weight Goals -->
      <div class="card-section">
        <h3 class="section-title">⚖️ เป้าหมายน้ำหนัก</h3>
        <div class="field-row">
          <label class="field-label">น้ำหนักเป้าหมาย (kg)</label>
          <InputNumber v-model="form.targetWeight" :minFractionDigits="1" :maxFractionDigits="1" suffix=" kg" class="field-input" />
        </div>
      </div>

      <!-- Calorie Goals -->
      <div class="card-section">
        <h3 class="section-title">🔥 เป้าหมายแคลอรี่</h3>
        <div class="flex flex-col gap-3">
          <div class="field-row">
            <label class="field-label">แคลอรี่รับเข้า/วัน (kcal)</label>
            <InputNumber v-model="form.dailyCalorieTarget" class="field-input" :min="0" />
          </div>
          <div class="field-row">
            <label class="field-label">เผาผลาญ/วัน (kcal)</label>
            <InputNumber v-model="form.dailyCalorieBurn" class="field-input" :min="0" />
          </div>
        </div>
      </div>

      <!-- Exercise Goals -->
      <div class="card-section">
        <h3 class="section-title">🏃 เป้าหมายออกกำลังกาย</h3>
        <div class="flex flex-col gap-3">
          <div class="field-row">
            <label class="field-label">ระยะทาง/เดือน (กม.)</label>
            <InputNumber v-model="form.monthlyDistance" :minFractionDigits="1" class="field-input" :min="0" />
          </div>
          <div class="field-row">
            <label class="field-label">ออกกำลังกาย/สัปดาห์ (ครั้ง)</label>
            <InputNumber v-model="form.workoutFrequency" class="field-input" :min="0" :max="7" />
          </div>
          <div class="field-row">
            <label class="field-label">วันพัก/สัปดาห์ (วัน)</label>
            <InputNumber v-model="form.restDayRequirement" class="field-input" :min="0" :max="7" />
          </div>
        </div>
      </div>

      <!-- Progress Cards (if goals set) -->
      <div v-if="goalsStore.goals.targetWeight && weightStore.latestWeight" class="card-section">
        <h3 class="section-title">📈 ความคืบหน้า</h3>
        <div class="flex flex-col gap-3">
          <div>
            <div class="flex justify-between text-sm text-gray-600 mb-1">
              <span>น้ำหนัก: {{ weightStore.latestWeight?.toFixed(1) }} kg → {{ goalsStore.goals.targetWeight }} kg</span>
              <span>{{ weightProgress }}%</span>
            </div>
            <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full" :style="{ width: weightProgress + '%' }" />
            </div>
          </div>
        </div>
      </div>

      <Button
        label="บันทึกเป้าหมาย"
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useGoalsStore } from '@/stores/goals'
import { useWeightStore } from '@/stores/weight'
import { today, nDaysAgo } from '@/utils/date'

const toast = useToast()
const goalsStore = useGoalsStore()
const weightStore = useWeightStore()
const saving = ref(false)

const form = reactive({
  targetWeight: null as number | null,
  dailyCalorieTarget: null as number | null,
  dailyCalorieBurn: null as number | null,
  monthlyDistance: null as number | null,
  workoutFrequency: null as number | null,
  restDayRequirement: null as number | null
})

const weightProgress = computed(() => {
  const current = weightStore.latestWeight
  const target = goalsStore.goals.targetWeight
  if (!current || !target) return 0
  // Assuming we know a "start weight" - use first log
  const first = weightStore.logs.length > 0
    ? (weightStore.logs[0].morning ?? current)
    : current
  if (first === target) return 100
  const progress = ((first - current) / (first - target)) * 100
  return Math.max(0, Math.min(100, Math.round(progress)))
})

async function handleSave() {
  saving.value = true
  try {
    await goalsStore.save({
      targetWeight: form.targetWeight ?? undefined,
      dailyCalorieTarget: form.dailyCalorieTarget ?? undefined,
      dailyCalorieBurn: form.dailyCalorieBurn ?? undefined,
      monthlyDistance: form.monthlyDistance ?? undefined,
      workoutFrequency: form.workoutFrequency ?? undefined,
      restDayRequirement: form.restDayRequirement ?? undefined
    })
    toast.add({ severity: 'success', summary: 'บันทึกเป้าหมายสำเร็จ', life: 2500 })
  } catch {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', life: 3000 })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await Promise.all([
    goalsStore.fetch(),
    weightStore.fetchRange(nDaysAgo(90), today())
  ])
  const g = goalsStore.goals
  form.targetWeight = g.targetWeight ?? null
  form.dailyCalorieTarget = g.dailyCalorieTarget ?? null
  form.dailyCalorieBurn = g.dailyCalorieBurn ?? null
  form.monthlyDistance = g.monthlyDistance ?? null
  form.workoutFrequency = g.workoutFrequency ?? null
  form.restDayRequirement = g.restDayRequirement ?? null
})
</script>

<style scoped>
.card-section {
  @apply bg-white rounded-2xl p-4 shadow-sm border border-gray-100;
}
.section-title {
  @apply text-sm font-semibold text-gray-700 mb-3;
}
.field-row {
  @apply flex flex-col gap-1.5;
}
.field-label {
  @apply text-sm text-gray-600;
}
.field-input {
  @apply w-full;
}
.field-input :deep(.p-inputnumber),
.field-input :deep(.p-inputnumber-input) {
  @apply w-full;
}
</style>
