<template>
  <AppLayout>
    <!-- Date picker -->
    <div class="flex items-center gap-2 mb-4">
      <label class="text-sm font-medium text-gray-600">วันที่</label>
      <DatePicker v-model="selectedDateObj" dateFormat="dd-mm-yy" class="flex-1" showIcon />
    </div>

    <div class="flex flex-col gap-4">
      <!-- AI Image upload -->
      <div class="card-section">
        <div class="flex items-center justify-between mb-2">
          <h3 class="section-title mb-0">📷 อัพโหลดภาพรวมจาก Garmin</h3>
          <span v-if="files.length" class="text-xs text-gray-500">{{ files.length }} ไฟล์</span>
        </div>
        <p class="text-xs text-gray-500 mb-3">
          อัพโหลดภาพหน้า "ภาพรวม" ของแอป Garmin (VO2 Max, ความเครียด, Body Battery, แคลอรี่, ก้าว, การนอน)
          ระบบจะใช้ AI อ่านค่าและเติมให้อัตโนมัติ
        </p>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="onFileChange"
        />
        <div class="flex gap-2">
          <Button
            label="เลือกรูป"
            icon="pi pi-image"
            severity="secondary"
            outlined
            class="flex-1"
            @click="fileInput?.click()"
          />
          <Button
            label="วิเคราะห์ด้วย AI"
            icon="pi pi-sparkles"
            class="flex-1"
            :loading="aiLoading"
            :disabled="!files.length"
            @click="runAI"
          />
        </div>
        <div v-if="files.length" class="grid grid-cols-3 gap-2 mt-3">
          <div v-for="(f, i) in filePreviews" :key="i" class="relative">
            <img :src="f" class="w-full h-20 object-cover rounded-lg border border-gray-200" />
            <button
              class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center"
              @click="removeFile(i)"
            >×</button>
          </div>
        </div>
      </div>

      <!-- Numeric fields -->
      <div class="card-section">
        <h3 class="section-title">ตัวเลขก่อนนอน</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">VO₂ Max</label>
            <InputNumber v-model="form.vo2Max" :minFractionDigits="0" :maxFractionDigits="1" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">ความเครียด (0-100)</label>
            <InputNumber v-model="form.stressScore" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">Body Battery</label>
            <InputNumber v-model="form.bodyBattery" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">ชาร์จแล้ว / หมดแล้ว</label>
            <div class="flex gap-1">
              <InputNumber v-model="form.bodyBatteryCharged" fluid placeholder="+" size="small" />
              <InputNumber v-model="form.bodyBatteryDrained" fluid placeholder="-" size="small" />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">แคลอรี่เผาผลาญรวม</label>
            <InputNumber v-model="form.totalCalories" suffix=" kcal" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">ก้าวทั้งวัน</label>
            <InputNumber v-model="form.steps" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">แอคทีฟ (kcal)</label>
            <InputNumber v-model="form.activeCalories" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">ขณะพัก (kcal)</label>
            <InputNumber v-model="form.restingCalories" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">น้ำหนักล่าสุด (kg)</label>
            <InputNumber v-model="form.latestWeight" :minFractionDigits="1" :maxFractionDigits="2" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">ชีพจรขณะพัก (bpm)</label>
            <InputNumber v-model="form.restingHR" fluid placeholder="-" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">นาทีความเข้มข้น</label>
            <InputNumber v-model="form.intensityMinutes" fluid placeholder="-" />
          </div>
        </div>
      </div>

      <!-- Sleep -->
      <div class="card-section">
        <h3 class="section-title">😴 การนอน</h3>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">ระยะเวลานอน (ชั่วโมง)</label>
            <InputNumber v-model="form.sleepDuration" :minFractionDigits="1" :maxFractionDigits="2" fluid placeholder="7.5" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs text-gray-500">คะแนนการนอน (0-100)</label>
            <InputNumber v-model="form.sleepScore" fluid placeholder="-" />
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="card-section">
        <h3 class="section-title">บันทึกเพิ่มเติม</h3>
        <div class="flex items-center justify-between gap-3 mb-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-gray-800">🍔 Cheat Day</span>
            <span class="text-[11px] text-gray-500">ปล่อยตัวกินได้ตามใจ ไม่ต้องรู้สึกผิด</span>
          </div>
          <ToggleSwitch v-model="form.isCheatDay" />
        </div>
        <Textarea v-model="form.notes" rows="2" class="w-full" placeholder="ความรู้สึกก่อนนอน..." autoResize />
      </div>

      <!-- AI Analysis -->
      <div class="card-section ai-analyzer bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
        <div class="flex items-center justify-between mb-2">
          <h3 class="section-title mb-0">🧠 วิเคราะห์ภาพรวม</h3>
          <span class="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">AI</span>
        </div>
        <div v-if="!hasAnyValue" class="text-sm text-gray-500">
          ยังไม่มีข้อมูลให้วิเคราะห์ — กรอกค่า หรือลองใช้ AI อ่านจากภาพ
        </div>
        <div v-else class="flex flex-col gap-3">
          <!-- Headline: calorie balance -->
          <div class="rounded-xl p-3 text-white shadow-sm" :class="balanceBannerClass">
            <div class="text-xs opacity-90">สมดุลแคลอรี่ (เผาผลาญ - กินเข้า)</div>
            <div class="text-2xl font-bold mt-1">
              {{ (calBalance ?? 0) > 0 ? '+' : '' }}{{ calBalance ?? '-' }} <span class="text-sm font-medium">kcal</span>
            </div>
            <div class="text-xs mt-1 opacity-90">{{ balanceHeadline }}</div>
          </div>

          <!-- Bullet insights -->
          <ul class="text-sm text-gray-700 space-y-1.5 list-disc list-inside">
            <li v-for="(line, i) in insights" :key="i" v-html="line" />
          </ul>

          <!-- Verdict -->
          <div class="rounded-xl bg-white border border-blue-100 p-3">
            <div class="text-xs text-gray-500 mb-1">สรุปก่อนนอน</div>
            <div class="text-sm font-medium text-gray-800">{{ verdict }}</div>
          </div>
        </div>
      </div>

      <Button
        :label="'บันทึกข้อมูลก่อนนอน'"
        icon="pi pi-check"
        :loading="saving"
        class="w-full"
        size="large"
        @click="handleSave"
      />

      <Button
        :label="bedtimeStore.currentSummary ? 'ล้างข้อมูลวันนี้' : 'ล้างค่าฟอร์ม'"
        icon="pi pi-trash"
        severity="danger"
        outlined
        :loading="clearing"
        class="w-full"
        @click="confirmClear"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DatePicker from 'primevue/datepicker'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useBedtimeStore } from '@/stores/bedtime'
import { useWeightStore } from '@/stores/weight'
import { useFoodStore } from '@/stores/food'
import { useExerciseStore } from '@/stores/exercise'
import { useGoalsStore } from '@/stores/goals'
import { useHealthStore } from '@/stores/health'
import { today, nDaysAgo } from '@/utils/date'
import { analyzeBedtimeImages } from '@/utils/bedtimeAI'
import type { BedtimeSummary } from '@/types'

const toast = useToast()
const confirm = useConfirm()
const bedtimeStore = useBedtimeStore()
const weightStore = useWeightStore()
const foodStore = useFoodStore()
const exerciseStore = useExerciseStore()
const goalsStore = useGoalsStore()
const healthStore = useHealthStore()

const saving = ref(false)
const clearing = ref(false)
const aiLoading = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const files = ref<File[]>([])
const filePreviews = ref<string[]>([])

const selectedDateObj = ref(new Date())
const selectedDate = computed(() => {
  const d = selectedDateObj.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

type Form = Omit<BedtimeSummary, 'id' | 'date' | 'createdAt' | 'updatedAt' | 'imageUrls' | 'sleepStages'>
const form = reactive<Form>({})

function resetForm() {
  Object.keys(form).forEach((k) => delete (form as any)[k])
  form.isCheatDay = false
}

function applyDefaults() {
  // For an unsaved date: keep all metrics empty (data should be per-day),
  // only default the latest known weight as a convenience.
  if (weightStore.latestWeight !== undefined) {
    form.latestWeight = weightStore.latestWeight
  }
}

async function loadFor(date: string) {
  await bedtimeStore.fetchByDate(date)
  resetForm()
  if (bedtimeStore.currentSummary) {
    Object.assign(form, bedtimeStore.currentSummary)
  } else {
    applyDefaults()
  }
  // Always make sure weight reflects the most-recent recorded value
  if (form.latestWeight == null && weightStore.latestWeight !== undefined) {
    form.latestWeight = weightStore.latestWeight
  }
  await Promise.all([
    foodStore.fetchByDate(date),
    exerciseStore.fetchByDate(date)
  ])
}

watch(selectedDate, loadFor)

onMounted(async () => {
  await Promise.all([
    bedtimeStore.fetchLatest(),
    weightStore.fetchRange(nDaysAgo(14), today()),
    goalsStore.fetch()
  ])
  await loadFor(selectedDate.value)
})

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const list = input.files
  if (!list) return
  const arr = Array.from(list)
  files.value.push(...arr)
  arr.forEach((f) => {
    const url = URL.createObjectURL(f)
    filePreviews.value.push(url)
  })
  input.value = ''
}

function removeFile(i: number) {
  URL.revokeObjectURL(filePreviews.value[i])
  files.value.splice(i, 1)
  filePreviews.value.splice(i, 1)
}

async function runAI() {
  if (!files.value.length) return
  aiLoading.value = true
  try {
    const parsed = await analyzeBedtimeImages(files.value)
    let count = 0
    ;(Object.keys(parsed) as Array<keyof typeof parsed>).forEach((k) => {
      const v = parsed[k]
      if (v === undefined || v === null) return
      if (k === 'sleepStages') return
      ;(form as any)[k] = v
      count++
    })
    toast.add({
      severity: 'success',
      summary: 'AI อ่านสำเร็จ',
      detail: `เติมค่าให้ ${count} รายการ — ตรวจสอบและแก้ไขได้ตามต้องการ`,
      life: 2500
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'AI วิเคราะห์ไม่สำเร็จ',
      detail: e?.message ?? 'ลองใหม่อีกครั้ง',
      life: 4000
    })
  } finally {
    aiLoading.value = false
  }
}

// ----- Analysis -----

const todayCalIn = computed(() =>
  foodStore.meals
    .filter((m) => m.date === selectedDate.value)
    .reduce((s, m) => s + m.totalCalories, 0)
)

const hasAnyValue = computed(() =>
  Object.values(form).some((v) => v !== undefined && v !== null && v !== '')
)

const calBalance = computed<number | null>(() => {
  const burn = form.totalCalories
  if (burn == null) return null
  return Math.round(burn - todayCalIn.value)
})

const balanceBannerClass = computed(() => {
  const b = calBalance.value
  if (b == null) return 'bg-gray-400'
  if (b > 500) return 'bg-green-500'
  if (b > 0) return 'bg-emerald-500'
  if (b > -300) return 'bg-amber-500'
  return 'bg-red-500'
})

const balanceHeadline = computed(() => {
  const b = calBalance.value
  if (b == null) return 'ยังไม่มีข้อมูลแคลอรี่ที่เผาผลาญ'
  const burn = form.totalCalories ?? 0
  const ate = todayCalIn.value
  const goal = goalsStore.goals.dailyCalorieTarget
  if (b > 500) return `เผา ${burn} • กิน ${ate} → ขาดดุลสูง เหมาะกับการลดไขมัน`
  if (b > 0) return `เผา ${burn} • กิน ${ate} → ขาดดุลพอเหมาะ`
  if (b > -300) return `เผา ${burn} • กิน ${ate} → เกือบสมดุล${goal ? ` (เป้า ${goal} kcal)` : ''}`
  return `เผา ${burn} • กิน ${ate} → เกินดุลเยอะ ระวังน้ำหนักขึ้น`
})

const insights = computed<string[]>(() => {
  const out: string[] = []
  const burn = form.totalCalories
  const ate = todayCalIn.value
  const bal = calBalance.value

  // 1. Calorie focus (most weight)
  if (burn != null) {
    const ratio = ate > 0 ? Math.round((ate / burn) * 100) : 0
    out.push(
      `🔥 <b>แคลอรี่ก่อนนอน</b>: เผา <b>${burn.toLocaleString()}</b> kcal, กินเข้า <b>${ate.toLocaleString()}</b> kcal (${ratio}%)`
    )
    if (bal != null && bal > 700) {
      out.push('⚠️ ขาดดุลเยอะกว่า 700 kcal — ระวังพักไม่พอ ควรเพิ่มโปรตีน/คาร์บคืนนี้')
    }
    if (bal != null && bal < -300) {
      out.push('⚠️ กินเกินที่เผา — พรุ่งนี้ลองเพิ่มกิจกรรม หรือคุมอาหารมื้อเช้า')
    }
  }

  // 2. Sleep & recovery
  if (form.sleepDuration != null) {
    if (form.sleepDuration < 6) out.push(`😴 นอน ${form.sleepDuration} ชม. — น้อยเกินไป รบกวนการฟื้นตัว`)
    else if (form.sleepDuration >= 7) out.push(`😴 นอน ${form.sleepDuration} ชม. — เพียงพอ ฟื้นตัวได้ดี`)
    else out.push(`😴 นอน ${form.sleepDuration} ชม. — พอใช้ พยายามให้ถึง 7 ชม.`)
  }
  if (form.sleepScore != null) {
    out.push(`🌙 คะแนนการนอน <b>${form.sleepScore}</b>/100`)
  }

  // 3. Body battery & stress
  if (form.bodyBattery != null) {
    if (form.bodyBattery < 25) out.push(`🔋 Body Battery ${form.bodyBattery} — ต่ำมาก ร่างกายต้องการพัก`)
    else if (form.bodyBattery < 50) out.push(`🔋 Body Battery ${form.bodyBattery} — ปานกลาง`)
    else out.push(`🔋 Body Battery ${form.bodyBattery} — ดี พร้อมซ้อมพรุ่งนี้`)
  }
  if (form.stressScore != null) {
    if (form.stressScore >= 50) out.push(`😰 ความเครียด ${form.stressScore} — สูง ลองหายใจช้าๆ ก่อนนอน`)
    else out.push(`🧘 ความเครียด ${form.stressScore} — อยู่ในเกณฑ์ดี`)
  }

  // 4. Steps
  if (form.steps != null) {
    if (form.steps >= 10000) out.push(`👟 เดิน <b>${form.steps.toLocaleString()}</b> ก้าว — ดีเยี่ยม`)
    else if (form.steps >= 7000) out.push(`👟 เดิน ${form.steps.toLocaleString()} ก้าว — ใช้ได้`)
    else out.push(`👟 เดิน ${form.steps.toLocaleString()} ก้าว — ค่อนข้างน้อย`)
  }

  // 5. Weight delta
  if (form.latestWeight != null && weightStore.latestWeight !== undefined) {
    const diff = +(form.latestWeight - weightStore.latestWeight).toFixed(2)
    if (Math.abs(diff) >= 0.1) {
      out.push(
        `⚖️ น้ำหนัก ${form.latestWeight} kg (${diff > 0 ? '+' : ''}${diff} จากค่าล่าสุด)`
      )
    }
  }

  return out
})

const verdict = computed(() => {
  // Final emphasis: drives off latest calories balance
  const bal = calBalance.value
  const sleep = form.sleepDuration
  const bb = form.bodyBattery

  if (bal == null) return 'ยังขาดข้อมูลแคลอรี่เผาผลาญ — ใส่ค่าเพื่อรับสรุปฉบับเต็ม'

  if (bal > 500 && (sleep ?? 7) >= 7 && (bb ?? 50) >= 40) {
    return '✅ วันนี้เป็นวันที่ดีมาก — ขาดดุลแคลอรี่ + พักเพียงพอ พรุ่งนี้พร้อมซ้อมหนักได้'
  }
  if (bal > 500 && ((sleep ?? 0) < 6 || (bb ?? 100) < 25)) {
    return '⚠️ ขาดดุลแคลอรี่ดีก็จริง แต่ร่างกายฟื้นตัวไม่ทัน พรุ่งนี้เน้นพักหรือซ้อมเบา'
  }
  if (bal > 0) {
    return '🟢 ขาดดุลเล็กน้อย เหมาะกับการรักษาน้ำหนัก/ค่อยๆ ลด'
  }
  if (bal > -300) {
    return '🟡 พลังงานเกือบสมดุล — ถ้าเป้าหมายลดไขมัน ลองเพิ่มเดิน/ลดมื้อเย็นพรุ่งนี้'
  }
  return '🔴 พลังงานเกินดุลเยอะ — พรุ่งนี้ควรเพิ่มกิจกรรมและคุมอาหารให้เข้มขึ้น'
})

async function handleSave() {
  saving.value = true
  try {
    const summary: BedtimeSummary = {
      date: selectedDate.value,
      ...form
    }
    await bedtimeStore.save(summary)

    // Mirror sleep / stress / body battery into healthStore so Dashboard / RecoveryView reuse it
    if (
      form.sleepDuration != null ||
      form.sleepScore != null ||
      form.stressScore != null ||
      form.bodyBattery != null ||
      form.restingHR != null
    ) {
      await healthStore.save({
        date: selectedDate.value,
        sleepDuration: form.sleepDuration,
        sleepScore: form.sleepScore,
        stressScore: form.stressScore,
        bodyBattery: form.bodyBattery,
        restingHR: form.restingHR
      })
    }

    // Mirror weight into weightStore (beforeSleep)
    if (form.latestWeight != null) {
      await weightStore.save({
        date: selectedDate.value,
        beforeSleep: form.latestWeight
      })
    }

    toast.add({
      severity: 'success',
      summary: 'บันทึกสำเร็จ',
      detail: 'ภาพรวมก่อนนอนถูกบันทึกแล้ว',
      life: 2500
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'เกิดข้อผิดพลาด',
      detail: e?.message ?? 'ไม่สามารถบันทึกได้',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

function confirmClear() {
  const hasSaved = !!bedtimeStore.currentSummary
  confirm.require({
    message: hasSaved
      ? `ต้องการลบข้อมูลภาพรวมก่อนนอนของวัน ${selectedDate.value} หรือไม่?`
      : 'ต้องการล้างค่าที่กรอกในฟอร์มทั้งหมดหรือไม่?',
    header: hasSaved ? 'ยืนยันการลบข้อมูล' : 'ยืนยันการล้างฟอร์ม',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: hasSaved ? 'ลบข้อมูล' : 'ล้างค่า',
    rejectLabel: 'ยกเลิก',
    acceptClass: 'p-button-danger',
    accept: clearData
  })
}

async function clearData() {
  clearing.value = true
  try {
    if (bedtimeStore.currentSummary) {
      await bedtimeStore.deleteByDate(selectedDate.value)
    }
    resetForm()
    applyDefaults()
    files.value.forEach((_, i) => URL.revokeObjectURL(filePreviews.value[i]))
    files.value = []
    filePreviews.value = []
    toast.add({
      severity: 'success',
      summary: 'ล้างข้อมูลแล้ว',
      life: 2500
    })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'ล้างข้อมูลไม่สำเร็จ',
      detail: e?.message,
      life: 3000
    })
  } finally {
    clearing.value = false
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
</style>
