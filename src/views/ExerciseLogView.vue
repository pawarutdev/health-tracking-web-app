<template>
  <AppLayout>
    <!-- Activity List for today -->
    <div v-if="todayActivities.length" class="mb-4">
      <button
        class="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
        @click="showActivities = !showActivities"
      >
        <span class="text-sm font-semibold text-gray-700">🏃 กิจกรรมวันนี้ ({{ todayActivities.length }} รายการ)</span>
        <i :class="showActivities ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-gray-500 text-sm" />
      </button>
      <div v-if="showActivities" class="flex flex-col gap-3 mt-3">
        <div
          v-for="act in todayActivities"
          :key="act.id"
          class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
        <div class="flex items-start justify-between mb-2">
          <span class="text-base font-semibold text-gray-800">{{ act.type }}</span>
          <div class="flex gap-2">
            <button class="p-1.5 text-blue-500" @click="editActivity(act)"><i class="pi pi-pencil" /></button>
            <button class="p-1.5 text-red-400" @click="deleteActivity(act.id!)"><i class="pi pi-trash" /></button>
          </div>
        </div>
        <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          <div v-if="act.duration"><i class="pi pi-clock text-gray-400 mr-1" />{{ act.duration }} นาที</div>
          <div v-if="act.distance"><i class="pi pi-map-marker text-gray-400 mr-1" />{{ act.distance }} กม.</div>
          <div v-if="act.calories"><i class="pi pi-bolt text-gray-400 mr-1" />{{ act.calories }} kcal</div>
          <div v-if="act.avgHR"><i class="pi pi-heart text-gray-400 mr-1" />{{ act.avgHR }} bpm</div>
          <div v-if="act.steps"><i class="pi pi-map text-gray-400 mr-1" />{{ act.steps }} ก้าว</div>
          <div v-if="act.vo2Max"><i class="pi pi-chart-line text-gray-400 mr-1" />VO2: {{ act.vo2Max }}</div>
          <div v-if="act.avgPace"><i class="pi pi-stopwatch text-gray-400 mr-1" />{{ act.avgPace }}/km</div>
        </div>
        <div v-if="act.notes" class="mt-2 text-xs text-gray-500">{{ act.notes }}</div>
      </div>
      </div>
    </div>

    <!-- Quick Rest Day (ซ่อนเมื่อมีกิจกรรมของวันแล้ว เพื่อลดการซ้ำซ้อน) -->
    <div v-if="!editId && !todayActivities.length" class="rest-day-banner mb-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100 flex items-center justify-between">
      <div>
        <div class="text-sm font-semibold text-gray-700">😴 วันนี้ไม่ได้ออกกำลังกาย</div>
        <div class="text-xs text-gray-500">บันทึกเป็น “วันพัก” ได้เลยไม่ต้องกรอกข้อมูล</div>
      </div>
      <Button label="บันทึกวันพัก" icon="pi pi-moon" severity="warn" size="small" :loading="savingRest" @click="handleSaveRestDay" />
    </div>

    <!-- Add / Edit Form -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">

      <!-- AI Analyzer -->
      <div class="ai-analyzer mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-sparkles text-purple-500" />
          <span class="text-sm font-semibold text-gray-700">วิเคราะห์รูปภาพอัตโนมัติ</span>
        </div>
        <p class="text-xs text-gray-500 mb-2">อัพโหลดภาพหน้าจอจากนาฬิกา/แอป (เลือกหลายภาพได้) AI จะดึงค่าให้</p>
        <label class="flex items-center gap-2 p-3 bg-white border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:border-blue-500 transition">
          <i class="pi pi-image text-blue-400" />
          <span class="text-sm text-gray-600 flex-1">{{ analyzeFiles.length ? `${analyzeFiles.length} ภาพพร้อมวิเคราะห์` : 'เลือกภาพ' }}</span>
          <input ref="fileInputRef" type="file" class="hidden" multiple accept="image/*" @change="handleAnalyzeFileChange" />
        </label>
        <div v-if="analyzePreviews.length" class="flex gap-2 flex-wrap mt-2">
          <div v-for="(url, i) in analyzePreviews" :key="i" class="relative">
            <img :src="url" class="w-14 h-14 object-cover rounded-lg" />
            <button class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" @click="removeAnalyzeImage(i)">×</button>
          </div>
        </div>
        <Button
          v-if="analyzeFiles.length"
          :label="analyzing ? 'กำลังวิเคราะห์...' : '✨ วิเคราะห์ด้วย AI'"
          :loading="analyzing"
          severity="info"
          size="small"
          class="w-full mt-2"
          @click="handleAnalyze"
        />
      </div>

      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">วันที่</label>
            <DatePicker v-model="selectedDateObj" dateFormat="dd-mm-yy" class="w-full" showIcon />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">ประเภทกิจกรรม *</label>
            <Select v-model="form.type" :options="activityTypes" placeholder="เลือก" editable class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">เวลาเริ่ม</label>
            <InputText v-model="form.startTime" type="time" class="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">เวลาสิ้นสุด</label>
            <InputText v-model="form.endTime" type="time" class="w-full" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">เวลา (นาที)</label>
            <InputNumber v-model="form.duration" fluid :minFractionDigits="0" :maxFractionDigits="2" :min="0" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">ระยะ (กม.)</label>
            <InputNumber v-model="form.distance" fluid :minFractionDigits="2" :min="0" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">ก้าว</label>
            <InputNumber v-model="form.steps" fluid :min="0" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">แคลอรี่ (kcal)</label>
            <InputNumber v-model="form.calories" fluid :min="0" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">ชีพจรเฉลี่ย</label>
            <InputNumber v-model="form.avgHR" fluid :min="0" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">ชีพจรสูงสุด</label>
            <InputNumber v-model="form.maxHR" fluid :min="0" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Aerobic TE</label>
            <InputNumber v-model="form.aerobicTE" fluid :minFractionDigits="1" :min="0" :max="5" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">Anaerobic TE</label>
            <InputNumber v-model="form.anaerobicTE" fluid :minFractionDigits="1" :min="0" :max="5" />
          </div>
        </div>

        <button
          class="text-xs text-blue-500 self-start flex items-center gap-1"
          @click="showAdvanced = !showAdvanced"
        >
          <i :class="showAdvanced ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
          {{ showAdvanced ? 'ซ่อนข้อมูลขั้นสูง' : 'แสดงข้อมูลขั้นสูง (เพซ, ความสูง, HR Zones, ฯลฯ)' }}
        </button>

        <div v-if="showAdvanced" class="flex flex-col gap-4 pt-2 border-t border-gray-100">
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">VO2 Max</label>
              <InputNumber v-model="form.vo2Max" fluid :minFractionDigits="1" :min="0" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">เพซเฉลี่ย (mm:ss/km)</label>
              <InputText v-model="form.avgPace" placeholder="8:52" class="w-full" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">เพซดีที่สุด</label>
              <InputText v-model="form.bestPace" placeholder="5:11" class="w-full" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">ความเร็วเฉลี่ย (km/h)</label>
              <InputNumber v-model="form.avgSpeed" fluid :minFractionDigits="1" :min="0" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">ความเร็วสูงสุด</label>
              <InputNumber v-model="form.maxSpeed" fluid :minFractionDigits="1" :min="0" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">รอบขาเฉลี่ย (spm)</label>
              <InputNumber v-model="form.avgCadence" fluid :min="0" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">ช่วงก้าวยาวเฉลี่ย (ม.)</label>
              <InputNumber v-model="form.avgStrideLength" fluid :minFractionDigits="2" :min="0" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">ขึ้นทั้งหมด (ม.)</label>
              <InputNumber v-model="form.elevationGain" fluid :min="0" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">ลงทั้งหมด (ม.)</label>
              <InputNumber v-model="form.elevationLoss" fluid :min="0" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">แคลขณะพัก</label>
              <InputNumber v-model="form.restingCalories" fluid :min="0" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">แคลที่ใช้</label>
              <InputNumber v-model="form.activeCalories" fluid :min="0" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">เหงื่อ (มล.)</label>
              <InputNumber v-model="form.sweatLossMl" fluid :min="0" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">อุณหภูมิเฉลี่ย (°C)</label>
              <InputNumber v-model="form.avgTempC" fluid :min="-50" :max="60" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">ปานกลาง (นาที)</label>
              <InputNumber v-model="form.moderateIntensityMin" fluid :min="0" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">หนัก (นาที)</label>
              <InputNumber v-model="form.vigorousIntensityMin" fluid :min="0" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">โหลดการฝึก</label>
              <InputNumber v-model="form.trainingLoad" fluid :min="0" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">สิทธิประโยชน์หลัก</label>
              <InputText v-model="form.primaryBenefit" placeholder="Threshold" class="w-full" />
            </div>
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">HR Zones (นาที)</label>
            <div class="grid grid-cols-5 gap-2">
              <InputNumber v-model="form.zone1" fluid :minFractionDigits="0" :maxFractionDigits="2" :min="0" placeholder="Z1" />
              <InputNumber v-model="form.zone2" fluid :minFractionDigits="0" :maxFractionDigits="2" :min="0" placeholder="Z2" />
              <InputNumber v-model="form.zone3" fluid :minFractionDigits="0" :maxFractionDigits="2" :min="0" placeholder="Z3" />
              <InputNumber v-model="form.zone4" fluid :minFractionDigits="0" :maxFractionDigits="2" :min="0" placeholder="Z4" />
              <InputNumber v-model="form.zone5" fluid :minFractionDigits="0" :maxFractionDigits="2" :min="0" placeholder="Z5" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">Body Battery</label>
              <InputNumber v-model="form.bodyBattery" fluid :min="0" :max="100" />
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm text-gray-600">ความเครียด</label>
              <InputNumber v-model="form.stressScore" fluid :min="0" :max="100" />
            </div>
          </div>
          <div>
            <label class="text-sm text-gray-600 mb-1 block">ระยะการนอน (นาที)</label>
            <div class="grid grid-cols-4 gap-2">
              <InputNumber v-model="form.deepMin" fluid :min="0" placeholder="ลึก" />
              <InputNumber v-model="form.lightMin" fluid :min="0" placeholder="ตื้น" />
              <InputNumber v-model="form.remMin" fluid :min="0" placeholder="REM" />
              <InputNumber v-model="form.awakeMin" fluid :min="0" placeholder="ตื่น" />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm text-gray-600">สถานที่</label>
            <InputText v-model="form.location" placeholder="เช่น สวนวชิรเบญจทัศ" class="w-full" />
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">หมายเหตุ</label>
          <Textarea v-model="form.notes" rows="2" class="w-full" autoResize />
        </div>

        <div class="flex gap-3">
          <Button v-if="editId" label="ยกเลิก" severity="secondary" class="flex-1" @click="resetForm" />
          <Button
            :label="editId ? 'อัพเดต' : 'บันทึกกิจกรรม'"
            icon="pi pi-check"
            :loading="saving"
            class="flex-1"
            @click="handleSave"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import AppLayout from '@/components/layout/AppLayout.vue'
import { today, nDaysAgo } from '@/utils/date'
import { useExerciseStore } from '@/stores/exercise'
import { useWeightStore } from '@/stores/weight'
import { analyzeGarminImages, type ParsedActivity } from '@/utils/garminAI'
import type { ExerciseActivity } from '@/types'

const toast = useToast()
const confirm = useConfirm()
const exerciseStore = useExerciseStore()
const weightStore = useWeightStore()

const selectedDateObj = ref(new Date())
const selectedDate = computed(() => {
  const d = selectedDateObj.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const saving = ref(false)
const savingRest = ref(false)
const analyzing = ref(false)
const editId = ref<string | null>(null)
const showAdvanced = ref(false)
const showActivities = ref(false)

const analyzeFiles = ref<File[]>([])
const analyzePreviews = ref<string[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)

const activityTypes = ['วิ่ง+เดิน', 'วิ่ง', 'เดิน', 'จักรยาน', 'ยิม', 'ว่ายน้ำ', 'แบดมินตัน', 'ฟุตบอล', 'โยคะ', 'พัก / ไม่ได้ออกกำลังกาย', 'อื่นๆ']

const defaultForm = () => ({
  type: 'วิ่ง+เดิน',
  weight: weightStore.latestWeight ?? null as number | null,
  startTime: '',
  endTime: '',
  duration: null as number | null,
  distance: null as number | null,
  steps: null as number | null,
  calories: null as number | null,
  avgHR: null as number | null,
  maxHR: null as number | null,
  aerobicTE: null as number | null,
  anaerobicTE: null as number | null,
  vo2Max: null as number | null,
  sleepDuration: null as number | null,
  sleepScore: null as number | null,
  notes: '',
  avgPace: '',
  bestPace: '',
  avgSpeed: null as number | null,
  maxSpeed: null as number | null,
  avgCadence: null as number | null,
  avgStrideLength: null as number | null,
  elevationGain: null as number | null,
  elevationLoss: null as number | null,
  restingCalories: null as number | null,
  activeCalories: null as number | null,
  sweatLossMl: null as number | null,
  avgTempC: null as number | null,
  moderateIntensityMin: null as number | null,
  vigorousIntensityMin: null as number | null,
  trainingLoad: null as number | null,
  primaryBenefit: '',
  zone1: null as number | null,
  zone2: null as number | null,
  zone3: null as number | null,
  zone4: null as number | null,
  zone5: null as number | null,
  bodyBattery: null as number | null,
  stressScore: null as number | null,
  deepMin: null as number | null,
  lightMin: null as number | null,
  remMin: null as number | null,
  awakeMin: null as number | null,
  location: ''
})

const form = reactive(defaultForm())

onMounted(() => {
  weightStore.fetchRange(nDaysAgo(14), today())
  exerciseStore.fetchByDate(selectedDate.value)
})

watch(() => weightStore.latestWeight, (w: number | undefined) => {
  if (w !== undefined && form.weight === null && !editId.value) {
    form.weight = w
  }
})

const todayActivities = computed(() =>
  exerciseStore.activities.filter((a) => a.date === selectedDate.value)
)

function handleAnalyzeFileChange(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  analyzeFiles.value.push(...files)
  files.forEach((f) => analyzePreviews.value.push(URL.createObjectURL(f)))
}

function removeAnalyzeImage(i: number) {
  URL.revokeObjectURL(analyzePreviews.value[i])
  analyzeFiles.value.splice(i, 1)
  analyzePreviews.value.splice(i, 1)
}

function clearAnalyzeImages() {
  analyzePreviews.value.forEach((u) => URL.revokeObjectURL(u))
  analyzeFiles.value = []
  analyzePreviews.value = []
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function applyParsed(p: ParsedActivity) {
  if (p.type) form.type = p.type
  if (p.startTime) form.startTime = p.startTime
  if (p.endTime) form.endTime = p.endTime
  if (p.duration != null) form.duration = p.duration
  if (p.distance != null) form.distance = p.distance
  if (p.steps != null) form.steps = p.steps
  if (p.calories != null) form.calories = p.calories
  else if (p.totalCalories != null) form.calories = p.totalCalories
  if (p.avgHR != null) form.avgHR = p.avgHR
  if (p.maxHR != null) form.maxHR = p.maxHR
  if (p.aerobicTE != null) form.aerobicTE = p.aerobicTE
  if (p.anaerobicTE != null) form.anaerobicTE = p.anaerobicTE
  if (p.vo2Max != null) form.vo2Max = p.vo2Max
  if (p.sleepDuration != null) form.sleepDuration = p.sleepDuration
  if (p.sleepScore != null) form.sleepScore = p.sleepScore
  if (p.avgPace) form.avgPace = p.avgPace
  if (p.bestPace) form.bestPace = p.bestPace
  if (p.avgSpeed != null) form.avgSpeed = p.avgSpeed
  if (p.maxSpeed != null) form.maxSpeed = p.maxSpeed
  if (p.avgCadence != null) form.avgCadence = p.avgCadence
  if (p.avgStrideLength != null) form.avgStrideLength = p.avgStrideLength
  if (p.elevationGain != null) form.elevationGain = p.elevationGain
  if (p.elevationLoss != null) form.elevationLoss = p.elevationLoss
  if (p.restingCalories != null) form.restingCalories = p.restingCalories
  if (p.activeCalories != null) form.activeCalories = p.activeCalories
  if (p.sweatLossMl != null) form.sweatLossMl = p.sweatLossMl
  if (p.avgTempC != null) form.avgTempC = p.avgTempC
  if (p.moderateIntensityMin != null) form.moderateIntensityMin = p.moderateIntensityMin
  if (p.vigorousIntensityMin != null) form.vigorousIntensityMin = p.vigorousIntensityMin
  if (p.trainingLoad != null) form.trainingLoad = p.trainingLoad
  if (p.primaryBenefit) form.primaryBenefit = p.primaryBenefit
  if (p.bodyBattery != null) form.bodyBattery = p.bodyBattery
  if (p.stressScore != null) form.stressScore = p.stressScore
  if (p.location) form.location = p.location
  if (p.notes && !form.notes) form.notes = p.notes
  if (p.hrZones) {
    if (p.hrZones.zone1 != null) form.zone1 = p.hrZones.zone1
    if (p.hrZones.zone2 != null) form.zone2 = p.hrZones.zone2
    if (p.hrZones.zone3 != null) form.zone3 = p.hrZones.zone3
    if (p.hrZones.zone4 != null) form.zone4 = p.hrZones.zone4
    if (p.hrZones.zone5 != null) form.zone5 = p.hrZones.zone5
  }
  if (p.sleepStages) {
    if (p.sleepStages.deepMin != null) form.deepMin = p.sleepStages.deepMin
    if (p.sleepStages.lightMin != null) form.lightMin = p.sleepStages.lightMin
    if (p.sleepStages.remMin != null) form.remMin = p.sleepStages.remMin
    if (p.sleepStages.awakeMin != null) form.awakeMin = p.sleepStages.awakeMin
  }
}

async function handleAnalyze() {
  if (!analyzeFiles.value.length) return
  analyzing.value = true
  try {
    const parsed = await analyzeGarminImages(analyzeFiles.value)
    applyParsed(parsed)
    showAdvanced.value = true
    toast.add({ severity: 'success', summary: 'วิเคราะห์สำเร็จ', detail: 'เติมค่าให้แล้ว ตรวจสอบแล้วบันทึกได้เลย', life: 3000 })
    clearAnalyzeImages()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'เกิดข้อผิดพลาด'
    toast.add({ severity: 'error', summary: 'วิเคราะห์ไม่สำเร็จ', detail: msg, life: 4000 })
    console.error(e)
  } finally {
    analyzing.value = false
  }
}

function editActivity(act: ExerciseActivity) {
  editId.value = act.id!
  Object.assign(form, defaultForm(), {
    type: act.type,
    weight: act.weight ?? null,
    startTime: act.startTime ?? '',
    endTime: act.endTime ?? '',
    duration: act.duration ?? null,
    distance: act.distance ?? null,
    steps: act.steps ?? null,
    calories: act.calories ?? null,
    avgHR: act.avgHR ?? null,
    maxHR: act.maxHR ?? null,
    aerobicTE: act.aerobicTE ?? null,
    anaerobicTE: act.anaerobicTE ?? null,
    vo2Max: act.vo2Max ?? null,
    sleepDuration: act.sleepDuration ?? null,
    sleepScore: act.sleepScore ?? null,
    notes: act.notes ?? '',
    avgPace: act.avgPace ?? '',
    bestPace: act.bestPace ?? '',
    avgSpeed: act.avgSpeed ?? null,
    maxSpeed: act.maxSpeed ?? null,
    avgCadence: act.avgCadence ?? null,
    avgStrideLength: act.avgStrideLength ?? null,
    elevationGain: act.elevationGain ?? null,
    elevationLoss: act.elevationLoss ?? null,
    restingCalories: act.restingCalories ?? null,
    activeCalories: act.activeCalories ?? null,
    sweatLossMl: act.sweatLossMl ?? null,
    avgTempC: act.avgTempC ?? null,
    moderateIntensityMin: act.moderateIntensityMin ?? null,
    vigorousIntensityMin: act.vigorousIntensityMin ?? null,
    trainingLoad: act.trainingLoad ?? null,
    primaryBenefit: act.primaryBenefit ?? '',
    zone1: act.hrZones?.zone1 ?? null,
    zone2: act.hrZones?.zone2 ?? null,
    zone3: act.hrZones?.zone3 ?? null,
    zone4: act.hrZones?.zone4 ?? null,
    zone5: act.hrZones?.zone5 ?? null,
    bodyBattery: act.bodyBattery ?? null,
    stressScore: act.stressScore ?? null,
    deepMin: act.sleepStages?.deepMin ?? null,
    lightMin: act.sleepStages?.lightMin ?? null,
    remMin: act.sleepStages?.remMin ?? null,
    awakeMin: act.sleepStages?.awakeMin ?? null,
    location: act.location ?? ''
  })
  showAdvanced.value = true
}

function resetForm() {
  editId.value = null
  Object.assign(form, defaultForm())
  clearAnalyzeImages()
  showAdvanced.value = false
}

function deleteActivity(id: string) {
  confirm.require({
    message: 'ต้องการลบกิจกรรมนี้?',
    header: 'ยืนยันการลบ',
    icon: 'pi pi-trash',
    rejectLabel: 'ยกเลิก',
    acceptLabel: 'ลบ',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await exerciseStore.remove(id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 2000 })
    }
  })
}

function buildHrZones() {
  const z = {
    zone1: form.zone1 ?? undefined,
    zone2: form.zone2 ?? undefined,
    zone3: form.zone3 ?? undefined,
    zone4: form.zone4 ?? undefined,
    zone5: form.zone5 ?? undefined
  }
  return Object.values(z).some((v) => v !== undefined) ? z : undefined
}

function buildSleepStages() {
  const s = {
    deepMin: form.deepMin ?? undefined,
    lightMin: form.lightMin ?? undefined,
    remMin: form.remMin ?? undefined,
    awakeMin: form.awakeMin ?? undefined
  }
  return Object.values(s).some((v) => v !== undefined) ? s : undefined
}

async function handleSave() {
  if (!form.type) {
    toast.add({ severity: 'warn', summary: 'กรุณาระบุประเภทกิจกรรม', life: 2500 })
    return
  }
  saving.value = true
  try {
    const activity: ExerciseActivity = {
      date: selectedDate.value,
      type: form.type,
      device: 'manual',
      weight: form.weight ?? undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      duration: form.duration ?? undefined,
      distance: form.distance ?? undefined,
      steps: form.steps ?? undefined,
      calories: form.calories ?? undefined,
      avgHR: form.avgHR ?? undefined,
      maxHR: form.maxHR ?? undefined,
      aerobicTE: form.aerobicTE ?? undefined,
      anaerobicTE: form.anaerobicTE ?? undefined,
      vo2Max: form.vo2Max ?? undefined,
      sleepDuration: form.sleepDuration ?? undefined,
      sleepScore: form.sleepScore ?? undefined,
      notes: form.notes || undefined,
      avgPace: form.avgPace || undefined,
      bestPace: form.bestPace || undefined,
      avgSpeed: form.avgSpeed ?? undefined,
      maxSpeed: form.maxSpeed ?? undefined,
      avgCadence: form.avgCadence ?? undefined,
      avgStrideLength: form.avgStrideLength ?? undefined,
      elevationGain: form.elevationGain ?? undefined,
      elevationLoss: form.elevationLoss ?? undefined,
      restingCalories: form.restingCalories ?? undefined,
      activeCalories: form.activeCalories ?? undefined,
      sweatLossMl: form.sweatLossMl ?? undefined,
      avgTempC: form.avgTempC ?? undefined,
      moderateIntensityMin: form.moderateIntensityMin ?? undefined,
      vigorousIntensityMin: form.vigorousIntensityMin ?? undefined,
      trainingLoad: form.trainingLoad ?? undefined,
      primaryBenefit: form.primaryBenefit || undefined,
      bodyBattery: form.bodyBattery ?? undefined,
      stressScore: form.stressScore ?? undefined,
      hrZones: buildHrZones(),
      sleepStages: buildSleepStages(),
      location: form.location || undefined
    }
    if (editId.value) {
      await exerciseStore.update(editId.value, activity)
    } else {
      await exerciseStore.add(activity)
    }
    toast.add({ severity: 'success', summary: 'บันทึกสำเร็จ', life: 2500 })
    resetForm()
  } catch (e) {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', life: 3000 })
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function handleSaveRestDay() {
  const exists = todayActivities.value.some((a) => a.type === 'พัก / ไม่ได้ออกกำลังกาย')
  if (exists) {
    toast.add({ severity: 'info', summary: 'มีบันทึกวันพักของวันนี้แล้ว', life: 2500 })
    return
  }
  savingRest.value = true
  try {
    const activity: ExerciseActivity = {
      date: selectedDate.value,
      type: 'พัก / ไม่ได้ออกกำลังกาย',
      device: 'manual',
      weight: weightStore.latestWeight ?? undefined,
      notes: 'วันพัก'
    }
    await exerciseStore.add(activity)
    toast.add({ severity: 'success', summary: 'บันทึกวันพักสำเร็จ', life: 2500 })
  } catch (e) {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', life: 3000 })
    console.error(e)
  } finally {
    savingRest.value = false
  }
}

watch(selectedDate, (date: string) => exerciseStore.fetchByDate(date))
</script>
