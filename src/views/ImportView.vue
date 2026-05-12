<template>
  <AppLayout>
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white">
        <h2 class="text-base font-bold mb-1">📥 นำเข้าข้อมูล CSV</h2>
        <p class="text-sm opacity-90">รองรับไฟล์ CSV: exercise, meals, weight</p>
      </div>

      <!-- Import Type -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">ประเภทข้อมูล</h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="t in importTypes"
            :key="t.value"
            class="py-3 rounded-xl text-sm font-medium border transition-all"
            :class="importType === t.value ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-600 border-gray-200'"
            @click="importType = t.value; clearFile()"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <!-- Template Download -->
      <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-info-circle text-blue-500" />
          <span class="text-sm font-semibold text-blue-700">รูปแบบไฟล์ที่รองรับ</span>
        </div>
        <p class="text-xs text-blue-600 mb-3">{{ currentTemplate.description }}</p>
        <div class="bg-white rounded-xl p-3 font-mono text-xs text-gray-600 overflow-x-auto">
          {{ currentTemplate.headers }}
        </div>
        <Button
          label="ดาวน์โหลด Template"
          icon="pi pi-download"
          severity="secondary"
          size="small"
          class="mt-3 w-full"
          @click="downloadTemplate"
        />
      </div>

      <!-- File Upload -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">เลือกไฟล์ CSV</h3>
        <label
          class="flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all"
          :class="selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-purple-400'"
        >
          <i class="pi pi-upload text-3xl" :class="selectedFile ? 'text-green-500' : 'text-gray-400'" />
          <div class="text-center">
            <p class="text-sm font-medium" :class="selectedFile ? 'text-green-700' : 'text-gray-600'">
              {{ selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์ CSV' }}
            </p>
            <p v-if="selectedFile" class="text-xs text-green-500">{{ parsedRows.length }} แถวข้อมูล</p>
          </div>
          <input type="file" class="hidden" accept=".csv" @change="handleFileSelect" />
        </label>
        <Button v-if="selectedFile" label="ล้างไฟล์" icon="pi pi-times" severity="secondary" size="small" class="mt-2 w-full" @click="clearFile" />
      </div>

      <!-- Preview Table -->
      <div v-if="parsedRows.length" class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-700">ตัวอย่างข้อมูล ({{ parsedRows.length }} แถว)</h3>
          <span v-if="validationErrors.length" class="text-xs text-red-500">{{ validationErrors.length }} แถวมีปัญหา</span>
          <span v-else class="text-xs text-green-600">✅ ข้อมูลถูกต้อง</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-gray-50">
              <tr>
                <th v-for="col in previewCols" :key="col" class="px-3 py-2 text-left text-gray-600 font-medium">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in parsedRows.slice(0, 10)"
                :key="idx"
                class="border-t border-gray-50"
                :class="validationErrors.includes(idx) ? 'bg-red-50' : ''"
              >
                <td v-for="col in previewCols" :key="col" class="px-3 py-2 text-gray-700">{{ row[col] ?? '-' }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="parsedRows.length > 10" class="px-4 py-2 text-xs text-gray-400 text-center">
            และอีก {{ parsedRows.length - 10 }} แถว...
          </div>
        </div>
      </div>

      <!-- Validation Errors -->
      <div v-if="validationErrors.length" class="bg-red-50 border border-red-100 rounded-2xl p-4">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-exclamation-triangle text-red-500" />
          <span class="text-sm font-semibold text-red-700">พบข้อผิดพลาด</span>
        </div>
        <ul class="text-xs text-red-600 list-disc list-inside">
          <li v-for="(err, idx) in validationErrors.slice(0, 5)" :key="idx">แถวที่ {{ err + 2 }}: ข้อมูลไม่ครบถ้วน</li>
        </ul>
      </div>

      <!-- Import Button -->
      <Button
        v-if="parsedRows.length && !validationErrors.length"
        :label="`นำเข้าข้อมูล ${parsedRows.length} แถว`"
        icon="pi pi-check"
        :loading="importing"
        class="w-full"
        size="large"
        @click="handleImport"
      />

      <!-- Import Result -->
      <div v-if="importResult" class="bg-green-50 border border-green-200 rounded-2xl p-4">
        <div class="flex items-center gap-2">
          <i class="pi pi-check-circle text-green-500 text-xl" />
          <div>
            <p class="text-sm font-semibold text-green-700">นำเข้าสำเร็จ!</p>
            <p class="text-xs text-green-600">{{ importResult }}</p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import AppLayout from '@/components/layout/AppLayout.vue'
import { parseCSVFile, type ParsedCSVRow } from '@/utils/export'
import { useExerciseStore } from '@/stores/exercise'
import { useFoodStore } from '@/stores/food'
import { useWeightStore } from '@/stores/weight'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'

const toast = useToast()
const exerciseStore = useExerciseStore()
const foodStore = useFoodStore()
const weightStore = useWeightStore()

type ImportType = 'exercise' | 'meals' | 'weight'
const importType = ref<ImportType>('exercise')
const selectedFile = ref<File | null>(null)
const parsedRows = ref<ParsedCSVRow[]>([])
const importing = ref(false)
const importResult = ref('')

const importTypes = [
  { label: '🏃 การออกกำลังกาย', value: 'exercise' as ImportType },
  { label: '🍚 อาหาร', value: 'meals' as ImportType },
  { label: '⚖️ น้ำหนัก', value: 'weight' as ImportType },
  { label: '⌚ Garmin Export', value: 'exercise' as ImportType }
]

const templates = {
  exercise: {
    description: 'ไฟล์ CSV สำหรับบันทึกการออกกำลังกาย',
    headers: 'date,type,duration,distance,calories,avg_hr,max_hr,device',
    example: [
      { date: '2024-01-01', type: 'วิ่ง', duration: '45', distance: '8.5', calories: '420', avg_hr: '155', max_hr: '178', device: 'manual' }
    ]
  },
  meals: {
    description: 'ไฟล์ CSV สำหรับบันทึกอาหาร',
    headers: 'date,meal_type,food_name,portion,calories,protein,carb,fat',
    example: [
      { date: '2024-01-01', meal_type: 'breakfast', food_name: 'ข้าวต้ม', portion: '1 ถ้วย', calories: '150', protein: '5', carb: '30', fat: '1' }
    ]
  },
  weight: {
    description: 'ไฟล์ CSV สำหรับบันทึกน้ำหนัก',
    headers: 'date,morning,post_workout,before_sleep,waist,body_fat',
    example: [
      { date: '2024-01-01', morning: '75.5', post_workout: '74.8', before_sleep: '76.0', waist: '82', body_fat: '18.5' }
    ]
  }
}

const currentTemplate = computed(() => templates[importType.value])
const previewCols = computed(() => parsedRows.value.length ? Object.keys(parsedRows.value[0]) : [])

const validationErrors = computed<number[]>(() => {
  if (!parsedRows.value.length) return []
  const errors: number[] = []
  parsedRows.value.forEach((row, idx) => {
    if (!row['date'] || !/^\d{4}-\d{2}-\d{2}$/.test(row['date'])) {
      errors.push(idx)
    }
  })
  return errors
})

function clearFile() {
  selectedFile.value = null
  parsedRows.value = []
  importResult.value = ''
}

async function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  selectedFile.value = file
  importResult.value = ''
  try {
    parsedRows.value = await parseCSVFile(file)
  } catch {
    toast.add({ severity: 'error', summary: 'ไม่สามารถอ่านไฟล์ได้', life: 3000 })
    clearFile()
  }
}

function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet(templates[importType.value].example)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'template')
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `template_${importType.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

async function handleImport() {
  if (!parsedRows.value.length) return
  importing.value = true
  let count = 0
  try {
    if (importType.value === 'exercise') {
      for (const row of parsedRows.value) {
        await exerciseStore.add({
          date: row['date'],
          type: row['type'] ?? 'ออกกำลังกาย',
          device: (row['device'] as any) ?? 'manual',
          duration: row['duration'] ? +row['duration'] : undefined,
          distance: row['distance'] ? +row['distance'] : undefined,
          calories: row['calories'] ? +row['calories'] : undefined,
          avgHR: row['avg_hr'] ? +row['avg_hr'] : undefined,
          maxHR: row['max_hr'] ? +row['max_hr'] : undefined
        })
        count++
      }
    } else if (importType.value === 'weight') {
      for (const row of parsedRows.value) {
        await weightStore.save({
          date: row['date'],
          morning: row['morning'] ? +row['morning'] : undefined,
          postWorkout: row['post_workout'] ? +row['post_workout'] : undefined,
          beforeSleep: row['before_sleep'] ? +row['before_sleep'] : undefined,
          waist: row['waist'] ? +row['waist'] : undefined,
          bodyFat: row['body_fat'] ? +row['body_fat'] : undefined
        })
        count++
      }
    } else if (importType.value === 'meals') {
      for (const row of parsedRows.value) {
        await foodStore.add({
          date: row['date'],
          type: (row['meal_type'] as any) ?? 'lunch',
          items: [{
            id: uuidv4(),
            name: row['food_name'] ?? '',
            portion: row['portion'] ?? '',
            calories: +(row['calories'] ?? 0),
            protein: +(row['protein'] ?? 0),
            carb: +(row['carb'] ?? 0),
            fat: +(row['fat'] ?? 0),
            sodium: +(row['sodium'] ?? 0),
            category: 'protein'
          }],
          flags: [],
          imageUrls: []
        })
        count++
      }
    }
    importResult.value = `นำเข้าสำเร็จ ${count} รายการ`
    toast.add({ severity: 'success', summary: `นำเข้าสำเร็จ ${count} รายการ`, life: 3000 })
    clearFile()
  } catch (err) {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาดในการนำเข้า', life: 3000 })
  } finally {
    importing.value = false
  }
}
</script>
