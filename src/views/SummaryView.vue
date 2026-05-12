<template>
  <AppLayout>
    <!-- Date range + filters -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">ตั้งแต่วันที่</label>
          <DatePicker v-model="startDateObj" dateFormat="dd-mm-yy" class="w-full" showIcon />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500">ถึงวันที่</label>
          <DatePicker v-model="endDateObj" dateFormat="dd-mm-yy" class="w-full" showIcon />
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <Button
          v-for="p in presets"
          :key="p.label"
          :label="p.label"
          severity="secondary"
          size="small"
          outlined
          @click="applyPreset(p.days)"
        />
        <Button label="โหลดข้อมูล" icon="pi pi-refresh" size="small" :loading="loading" @click="loadData" />
      </div>
    </div>

    <!-- Tab Switcher -->
    <div class="flex gap-2 mb-4">
      <button
        class="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
        :class="activeTab === 'exercise' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'"
        @click="activeTab = 'exercise'"
      >
        🏃 กิจกรรม ({{ filteredActivities.length }})
      </button>
      <button
        class="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
        :class="activeTab === 'food' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'"
        @click="activeTab = 'food'"
      >
        🍚 การกิน ({{ filteredMeals.length }})
      </button>
    </div>

    <!-- Summary numbers -->
    <div v-if="activeTab === 'exercise'" class="grid grid-cols-3 gap-2 mb-4">
      <div class="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
        <div class="text-base font-bold text-blue-600">{{ exerciseTotals.duration }} นาที</div>
        <div class="text-[10px] text-gray-500">เวลารวม</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
        <div class="text-base font-bold text-green-600">{{ exerciseTotals.distance.toFixed(1) }} กม.</div>
        <div class="text-[10px] text-gray-500">ระยะรวม</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
        <div class="text-base font-bold text-orange-500">{{ exerciseTotals.calories }} kcal</div>
        <div class="text-[10px] text-gray-500">แคลอรี่รวม</div>
      </div>
    </div>

    <div v-if="activeTab === 'food'" class="grid grid-cols-4 gap-2 mb-4">
      <div class="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
        <div class="text-base font-bold text-orange-500">{{ foodTotals.calories }}</div>
        <div class="text-[10px] text-gray-500">kcal</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
        <div class="text-base font-bold text-blue-600">{{ foodTotals.protein }}g</div>
        <div class="text-[10px] text-gray-500">โปรตีน</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
        <div class="text-base font-bold text-yellow-500">{{ foodTotals.carb }}g</div>
        <div class="text-[10px] text-gray-500">คาร์บ</div>
      </div>
      <div class="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
        <div class="text-base font-bold text-red-400">{{ foodTotals.fat }}g</div>
        <div class="text-[10px] text-gray-500">ไขมัน</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 mb-3">
      <div class="flex items-center gap-2">
        <i class="pi pi-search text-gray-400" />
        <InputText
          v-model="searchText"
          :placeholder="activeTab === 'exercise' ? 'ค้นหาประเภท / โน๊ต' : 'ค้นหาเมนู / โน๊ต'"
          class="flex-1"
        />
        <Select
          v-if="activeTab === 'exercise'"
          v-model="filterType"
          :options="['ทั้งหมด', ...activityTypeOptions]"
          class="w-32"
        />
        <Select
          v-if="activeTab === 'food'"
          v-model="filterMealType"
          :options="mealTypeFilterOptions"
          optionLabel="label"
          optionValue="value"
          class="w-32"
        />
      </div>
    </div>

    <!-- Exercise table -->
    <div v-if="activeTab === 'exercise'" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTable
        :value="filteredActivities"
        :paginator="filteredActivities.length > 10"
        :rows="10"
        responsiveLayout="scroll"
        stripedRows
        size="small"
        sortField="date"
        :sortOrder="-1"
        :rowHover="true"
        @row-click="onActivityRowClick"
        class="cursor-pointer"
      >
        <template #empty>
          <div class="text-center text-sm text-gray-500 py-6">ไม่มีข้อมูล</div>
        </template>
        <Column field="date" header="วันที่" sortable :pt="{ bodyCell: { class: 'text-xs' } }">
          <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </Column>
        <Column field="type" header="ประเภท" sortable :pt="{ bodyCell: { class: 'text-xs' } }" />
        <Column field="duration" header="นาที" sortable :pt="{ bodyCell: { class: 'text-xs text-right' } }">
          <template #body="{ data }">{{ data.duration ?? '-' }}</template>
        </Column>
        <Column field="distance" header="กม." sortable :pt="{ bodyCell: { class: 'text-xs text-right' } }">
          <template #body="{ data }">{{ data.distance ?? '-' }}</template>
        </Column>
        <Column field="calories" header="kcal" sortable :pt="{ bodyCell: { class: 'text-xs text-right' } }">
          <template #body="{ data }">{{ data.calories ?? '-' }}</template>
        </Column>
      </DataTable>
    </div>

    <!-- Food table -->
    <div v-if="activeTab === 'food'" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <DataTable
        :value="filteredMeals"
        :paginator="filteredMeals.length > 10"
        :rows="10"
        responsiveLayout="scroll"
        stripedRows
        size="small"
        sortField="date"
        :sortOrder="-1"
        :rowHover="true"
        @row-click="onMealRowClick"
        class="cursor-pointer"
      >
        <template #empty>
          <div class="text-center text-sm text-gray-500 py-6">ไม่มีข้อมูล</div>
        </template>
        <Column field="date" header="วันที่" sortable :pt="{ bodyCell: { class: 'text-xs' } }">
          <template #body="{ data }">{{ formatDate(data.date) }}</template>
        </Column>
        <Column field="type" header="มื้อ" sortable :pt="{ bodyCell: { class: 'text-xs' } }">
          <template #body="{ data }">{{ mealTypeLabel(data.type) }}</template>
        </Column>
        <Column header="เมนู" :pt="{ bodyCell: { class: 'text-xs' } }">
          <template #body="{ data }">
            <span class="line-clamp-1">{{ mealItemNames(data) }}</span>
          </template>
        </Column>
        <Column field="totalCalories" header="kcal" sortable :pt="{ bodyCell: { class: 'text-xs text-right' } }" />
        <Column field="totalProtein" header="P" sortable :pt="{ bodyCell: { class: 'text-xs text-right' } }">
          <template #body="{ data }">{{ Math.round(data.totalProtein) }}</template>
        </Column>
      </DataTable>
    </div>

    <!-- Activity Detail Dialog -->
    <Dialog
      v-model:visible="activityDialogVisible"
      :header="selectedActivity?.type ?? 'รายละเอียดกิจกรรม'"
      modal
      :style="{ width: '95vw', maxWidth: '480px' }"
    >
      <div v-if="selectedActivity" class="flex flex-col gap-2 text-sm">
        <div class="text-xs text-gray-500">{{ formatDate(selectedActivity.date) }} {{ selectedActivity.startTime ?? '' }}</div>
        <div class="grid grid-cols-2 gap-2 mt-2">
          <DetailRow label="ระยะเวลา" :value="selectedActivity.duration" suffix=" นาที" />
          <DetailRow label="ระยะทาง" :value="selectedActivity.distance" suffix=" กม." />
          <DetailRow label="ก้าว" :value="selectedActivity.steps" />
          <DetailRow label="แคลอรี่" :value="selectedActivity.calories" suffix=" kcal" />
          <DetailRow label="ชีพจรเฉลี่ย" :value="selectedActivity.avgHR" suffix=" bpm" />
          <DetailRow label="ชีพจรสูงสุด" :value="selectedActivity.maxHR" suffix=" bpm" />
          <DetailRow label="เพซเฉลี่ย" :value="selectedActivity.avgPace" />
          <DetailRow label="VO2 Max" :value="selectedActivity.vo2Max" />
          <DetailRow label="Aerobic TE" :value="selectedActivity.aerobicTE" />
          <DetailRow label="Anaerobic TE" :value="selectedActivity.anaerobicTE" />
          <DetailRow label="ความเร็วเฉลี่ย" :value="selectedActivity.avgSpeed" suffix=" km/h" />
          <DetailRow label="รอบขา" :value="selectedActivity.avgCadence" suffix=" spm" />
          <DetailRow label="ขึ้น" :value="selectedActivity.elevationGain" suffix=" ม." />
          <DetailRow label="ลง" :value="selectedActivity.elevationLoss" suffix=" ม." />
          <DetailRow label="โหลดการฝึก" :value="selectedActivity.trainingLoad" />
          <DetailRow label="Body Battery" :value="selectedActivity.bodyBattery" />
          <DetailRow label="ความเครียด" :value="selectedActivity.stressScore" />
          <DetailRow label="น้ำหนัก" :value="selectedActivity.weight" suffix=" kg" />
          <DetailRow label="สถานที่" :value="selectedActivity.location" />
        </div>
        <div v-if="selectedActivity.notes" class="mt-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
          {{ selectedActivity.notes }}
        </div>
      </div>
    </Dialog>

    <!-- Meal Detail Dialog -->
    <Dialog
      v-model:visible="mealDialogVisible"
      :header="selectedMeal ? mealTypeLabel(selectedMeal.type) : 'รายละเอียดมื้ออาหาร'"
      modal
      :style="{ width: '95vw', maxWidth: '480px' }"
    >
      <div v-if="selectedMeal" class="flex flex-col gap-2 text-sm">
        <div class="text-xs text-gray-500">{{ formatDate(selectedMeal.date) }}</div>
        <div class="grid grid-cols-4 gap-2 mt-2 text-center">
          <div class="bg-orange-50 rounded-lg p-2">
            <div class="text-sm font-bold text-orange-600">{{ selectedMeal.totalCalories }}</div>
            <div class="text-[10px] text-gray-500">kcal</div>
          </div>
          <div class="bg-blue-50 rounded-lg p-2">
            <div class="text-sm font-bold text-blue-600">{{ Math.round(selectedMeal.totalProtein) }}g</div>
            <div class="text-[10px] text-gray-500">โปรตีน</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-2">
            <div class="text-sm font-bold text-yellow-600">{{ Math.round(selectedMeal.totalCarb) }}g</div>
            <div class="text-[10px] text-gray-500">คาร์บ</div>
          </div>
          <div class="bg-red-50 rounded-lg p-2">
            <div class="text-sm font-bold text-red-500">{{ Math.round(selectedMeal.totalFat) }}g</div>
            <div class="text-[10px] text-gray-500">ไขมัน</div>
          </div>
        </div>
        <div class="mt-2">
          <div class="text-xs font-semibold text-gray-600 mb-2">รายการอาหาร</div>
          <div
            v-for="item in selectedMeal.items"
            :key="item.id"
            class="flex justify-between py-2 border-b border-gray-50 last:border-0 text-xs"
          >
            <span class="text-gray-700">{{ item.name }} <span class="text-gray-400">({{ item.portion }})</span></span>
            <span class="font-medium text-gray-600">{{ item.calories }} kcal</span>
          </div>
        </div>
        <div v-if="selectedMeal.flags?.length" class="flex gap-1 flex-wrap mt-2">
          <span
            v-for="flag in selectedMeal.flags"
            :key="flag"
            class="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"
          >{{ flag }}</span>
        </div>
        <div v-if="selectedMeal.notes" class="mt-2 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
          {{ selectedMeal.notes }}
        </div>
      </div>
    </Dialog>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import DatePicker from 'primevue/datepicker'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Button from 'primevue/button'
import DataTable, { type DataTableRowClickEvent } from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useExerciseStore } from '@/stores/exercise'
import { useFoodStore } from '@/stores/food'
import { today, nDaysAgo, formatDate } from '@/utils/date'
import type { ExerciseActivity, Meal, MealType } from '@/types'

const exerciseStore = useExerciseStore()
const foodStore = useFoodStore()

const loading = ref(false)
const activeTab = ref<'exercise' | 'food'>('exercise')

const startDateObj = ref(new Date(nDaysAgo(30)))
const endDateObj = ref(new Date())

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const startDate = computed(() => fmt(startDateObj.value))
const endDate = computed(() => fmt(endDateObj.value))

const presets = [
  { label: '7 วัน', days: 7 },
  { label: '30 วัน', days: 30 },
  { label: '90 วัน', days: 90 }
]

function applyPreset(days: number) {
  endDateObj.value = new Date()
  startDateObj.value = new Date(nDaysAgo(days))
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    await Promise.all([
      exerciseStore.fetchRange(startDate.value, endDate.value),
      foodStore.fetchRange(startDate.value, endDate.value)
    ])
  } finally {
    loading.value = false
  }
}

// Filters
const searchText = ref('')
const filterType = ref<string>('ทั้งหมด')
const filterMealType = ref<MealType | 'all'>('all')

const activityTypeOptions = computed(() => {
  const set = new Set<string>()
  exerciseStore.activities.forEach((a) => a.type && set.add(a.type))
  return Array.from(set).sort()
})

const mealTypeFilterOptions = [
  { label: 'ทั้งหมด', value: 'all' },
  { label: 'มื้อเช้า', value: 'breakfast' },
  { label: 'มื้อเที่ยง', value: 'lunch' },
  { label: 'มื้อเย็น', value: 'dinner' },
  { label: 'ของว่าง', value: 'snack' },
  { label: 'เครื่องดื่ม', value: 'beverage' }
]

function mealTypeLabel(t: MealType): string {
  return mealTypeFilterOptions.find((o) => o.value === t)?.label ?? t
}

function mealItemNames(m: Meal): string {
  return m.items.map((i) => i.name).join(', ') || '-'
}

const filteredActivities = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  return exerciseStore.activities.filter((a) => {
    if (filterType.value !== 'ทั้งหมด' && a.type !== filterType.value) return false
    if (q) {
      const hay = `${a.type ?? ''} ${a.notes ?? ''} ${a.location ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const filteredMeals = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  return foodStore.meals.filter((m) => {
    if (filterMealType.value !== 'all' && m.type !== filterMealType.value) return false
    if (q) {
      const items = m.items.map((i) => i.name).join(' ')
      const hay = `${items} ${m.notes ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
})

const exerciseTotals = computed(() => ({
  duration: filteredActivities.value.reduce((s, a) => s + (a.duration ?? 0), 0),
  distance: filteredActivities.value.reduce((s, a) => s + (a.distance ?? 0), 0),
  calories: filteredActivities.value.reduce((s, a) => s + (a.calories ?? 0), 0)
}))

const foodTotals = computed(() => ({
  calories: filteredMeals.value.reduce((s, m) => s + (m.totalCalories ?? 0), 0),
  protein: Math.round(filteredMeals.value.reduce((s, m) => s + (m.totalProtein ?? 0), 0)),
  carb: Math.round(filteredMeals.value.reduce((s, m) => s + (m.totalCarb ?? 0), 0)),
  fat: Math.round(filteredMeals.value.reduce((s, m) => s + (m.totalFat ?? 0), 0))
}))

// Detail dialogs
const activityDialogVisible = ref(false)
const selectedActivity = ref<ExerciseActivity | null>(null)
const mealDialogVisible = ref(false)
const selectedMeal = ref<Meal | null>(null)

function onActivityRowClick(e: DataTableRowClickEvent) {
  selectedActivity.value = e.data as ExerciseActivity
  activityDialogVisible.value = true
}
function onMealRowClick(e: DataTableRowClickEvent) {
  selectedMeal.value = e.data as Meal
  mealDialogVisible.value = true
}

// Tiny inline detail row component
const DetailRow = (props: { label: string; value?: string | number | null; suffix?: string }) => {
  if (props.value === null || props.value === undefined || props.value === '') return null
  return h('div', { class: 'bg-gray-50 rounded-lg p-2' }, [
    h('div', { class: 'text-[10px] text-gray-500' }, props.label),
    h('div', { class: 'text-sm font-medium text-gray-800' }, `${props.value}${props.suffix ?? ''}`)
  ])
}

onMounted(loadData)
</script>
