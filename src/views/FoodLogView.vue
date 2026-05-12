<template>
  <AppLayout>
    <!-- Date Selector -->
    <div class="flex items-center gap-2 mb-4">
      <label class="text-sm font-medium text-gray-600">วันที่</label>
      <DatePicker v-model="selectedDateObj" dateFormat="dd-mm-yy" class="flex-1" showIcon />
    </div>

    <!-- Meals List (Collapsible) -->
    <div v-if="todayMeals.length" class="mb-4">
      <button
        class="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100"
        @click="showMeals = !showMeals"
      >
        <span class="text-sm font-semibold text-gray-700">🍽️ มื้ออาหารวันนี้ ({{ todayMeals.length }} มื้อ · {{ dailyTotals.calories }} kcal)</span>
        <i :class="showMeals ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" class="text-gray-500 text-sm" />
      </button>
      <div v-if="showMeals" class="flex flex-col gap-3 mt-3">
      <div
        v-for="meal in todayMeals"
        :key="meal.id"
        class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <div class="flex items-center gap-2">
            <span class="text-base">{{ mealEmoji(meal.type) }}</span>
            <span class="font-semibold text-gray-800 text-sm">{{ mealTypeLabel(meal.type) }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold text-orange-500">{{ meal.totalCalories }} kcal</span>
            <button class="text-blue-500 p-1" @click="editMeal(meal)"><i class="pi pi-pencil text-sm" /></button>
            <button class="text-red-400 p-1" @click="deleteMeal(meal.id!)"><i class="pi pi-trash text-sm" /></button>
          </div>
        </div>
        <div class="px-4 py-2">
          <div v-for="item in meal.items" :key="item.id" class="flex justify-between py-1.5 border-b border-gray-50 last:border-0 text-sm">
            <span class="text-gray-700">{{ item.name }} <span class="text-gray-400 text-xs">({{ item.portion }})</span></span>
            <span class="text-gray-600 font-medium">{{ item.calories }} kcal</span>
          </div>
        </div>
      </div>
      </div>
    </div>

    <!-- Add Meal Form -->
    <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">{{ editId ? 'แก้ไขมื้ออาหาร' : 'เพิ่มมื้ออาหาร' }}</h3>

      <!-- AI Analyzer -->
      <div class="ai-analyzer mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-sparkles text-purple-500" />
          <span class="text-sm font-semibold text-gray-700">วิเคราะห์แคลอรี่จากอาหารด้วย AI</span>
        </div>
        <Textarea
          v-model="aiInput"
          rows="2"
          autoResize
          placeholder="เช่น ก๋วยเตี๋ยวไก่ 1 ชาม กาแฟละต้นไม้ 1 แก้ว ..."
          class="w-full text-sm"
        />
        <Button
          :label="aiLoading ? 'กำลังวิเคราะห์...' : '✨ วิเคราะห์ด้วย AI'"
          :loading="aiLoading"
          :disabled="!aiInput.trim()"
          severity="info"
          size="small"
          class="w-full mt-2"
          @click="runFoodAI"
        />
      </div>

      <!-- Meal Type -->
      <div class="flex gap-2 mb-4">
        <button
          v-for="mt in mealTypes"
          :key="mt.value"
          class="flex-1 py-2 rounded-xl text-xs font-medium border transition-all"
          :class="form.type === mt.value ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-50 text-gray-600 border-gray-200'"
          @click="form.type = mt.value"
        >
          {{ mt.label }}
        </button>
      </div>

      <!-- Food Items -->
      <div class="flex flex-col gap-3 mb-4">
        <div
          v-for="(item, idx) in form.items"
          :key="item.id"
          class="bg-gray-50 rounded-xl p-3"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">รายการที่ {{ idx + 1 }}</span>
            <button class="text-red-400 p-1" @click="removeItem(idx)"><i class="pi pi-times text-sm" /></button>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2">
              <label class="text-xs text-gray-500 block mb-1">ชื่ออาหาร</label>
              <InputText v-model="item.name" placeholder="เช่น กาแฟดำ" class="w-full text-sm" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">ปริมาณ</label>
              <InputText v-model="item.portion" placeholder="เช่น 1 แก้ว" class="w-full text-sm" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">หมวดหมู่</label>
              <Select v-model="item.category" :options="categoryOptions" optionLabel="label" optionValue="value" placeholder="เลือก" class="w-full" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">แคลอรี่ (kcal)</label>
              <InputNumber v-model="item.calories" placeholder="0" fluid :min="0" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">โปรตีน (g)</label>
              <InputNumber v-model="item.protein" placeholder="0" fluid :min="0" :minFractionDigits="1" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">คาร์บ (g)</label>
              <InputNumber v-model="item.carb" placeholder="0" fluid :min="0" :minFractionDigits="1" />
            </div>
            <div>
              <label class="text-xs text-gray-500 block mb-1">ไขมัน (g)</label>
              <InputNumber v-model="item.fat" placeholder="0" fluid :min="0" :minFractionDigits="1" />
            </div>
          </div>
        </div>
        <Button label="+ เพิ่มรายการอาหาร" severity="secondary" size="small" class="w-full" @click="addItem" />
      </div>

      <!-- Notes -->
      <div class="mb-4">
        <Textarea v-model="form.notes" placeholder="หมายเหตุ..." rows="2" class="w-full" autoResize />
      </div>

      <!-- Buttons -->
      <div class="flex gap-3">
        <Button v-if="editId" label="ยกเลิก" severity="secondary" class="flex-1" @click="resetForm" />
        <Button
          :label="editId ? 'อัพเดต' : 'บันทึกมื้ออาหาร'"
          icon="pi pi-check"
          :loading="saving"
          class="flex-1"
          @click="handleSave"
        />
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import DatePicker from 'primevue/datepicker'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Select from 'primevue/select'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useFoodStore } from '@/stores/food'
import { today } from '@/utils/date'
import { analyzeFoodDescription } from '@/utils/foodAI'
import { v4 as uuidv4 } from 'uuid'
import type { Meal, MealType, MealItem, FoodCategory } from '@/types'

const toast = useToast()
const confirm = useConfirm()
const foodStore = useFoodStore()

const selectedDateObj = ref(new Date())
const selectedDate = computed(() => {
  const d = selectedDateObj.value
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})

const saving = ref(false)
const editId = ref<string | null>(null)
const aiInput = ref('')
const aiLoading = ref(false)
const showMeals = ref(false)

const mealTypes = [
  { label: '🌅 เช้า', value: 'breakfast' as MealType },
  { label: '🌞 กลางวัน', value: 'lunch' as MealType },
  { label: '🌙 เย็น', value: 'dinner' as MealType },
  { label: '🍎 ของว่าง', value: 'snack' as MealType },
  { label: '☕ เครื่องดื่ม', value: 'beverage' as MealType }
]

const categoryOptions = [
  { label: '🥩 โปรตีน', value: 'protein' as FoodCategory },
  { label: '🌾 คาร์บ', value: 'carb' as FoodCategory },
  { label: '🥦 ผัก', value: 'vegetable' as FoodCategory },
  { label: '🍟 ทอด', value: 'fried' as FoodCategory },
  { label: '🍰 ขนม', value: 'dessert' as FoodCategory },
  { label: '☕ เครื่องดื่ม', value: 'drink' as FoodCategory }
]

const newItem = (): MealItem => ({
  id: uuidv4(),
  name: '',
  portion: '',
  calories: 0,
  protein: 0,
  carb: 0,
  fat: 0,
  sodium: 0,
  category: 'protein'
})

const form = reactive<{
  type: MealType
  items: MealItem[]
  notes: string
}>({
  type: 'breakfast',
  items: [newItem()],
  notes: ''
})

const todayMeals = computed(() => foodStore.meals.filter((m) => m.date === selectedDate.value))
const dailyTotals = computed(() => ({
  calories: todayMeals.value.reduce((s, m) => s + m.totalCalories, 0),
  protein: +todayMeals.value.reduce((s, m) => s + m.totalProtein, 0).toFixed(1),
  carb: +todayMeals.value.reduce((s, m) => s + m.totalCarb, 0).toFixed(1),
  fat: +todayMeals.value.reduce((s, m) => s + m.totalFat, 0).toFixed(1)
}))

function addItem() { form.items.push(newItem()) }
function removeItem(idx: number) { form.items.splice(idx, 1) }
function mealTypeLabel(type: string) {
  return ({ breakfast: 'มื้อเช้า', lunch: 'มื้อกลางวัน', dinner: 'มื้อเย็น', snack: 'ของว่าง', beverage: 'เครื่องดื่ม' }[type] ?? type)
}
function mealEmoji(type: string) {
  return ({ breakfast: '🌅', lunch: '🌞', dinner: '🌙', snack: '🍎', beverage: '☕' }[type] ?? '🍽️')
}

function resetForm() {
  editId.value = null
  form.type = 'breakfast'
  form.items = [newItem()]
  form.notes = ''
  aiInput.value = ''
}

function editMeal(meal: Meal) {
  editId.value = meal.id!
  form.type = meal.type
  form.items = JSON.parse(JSON.stringify(meal.items))
  form.notes = meal.notes ?? ''
}

function deleteMeal(id: string) {
  confirm.require({
    message: 'ต้องการลบมื้ออาหารนี้?',
    header: 'ยืนยันการลบ',
    icon: 'pi pi-trash',
    rejectLabel: 'ยกเลิก',
    acceptLabel: 'ลบ',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await foodStore.remove(id)
      toast.add({ severity: 'success', summary: 'ลบสำเร็จ', life: 2000 })
    }
  })
}

async function handleSave() {
  if (!form.items.some((i) => i.name)) {
    toast.add({ severity: 'warn', summary: 'กรุณาเพิ่มรายการอาหาร', life: 2500 })
    return
  }
  saving.value = true
  try {
    const mealData = {
      date: selectedDate.value,
      type: form.type,
      items: form.items.filter((i) => i.name),
      flags: [],
      notes: form.notes || undefined,
      imageUrls: []
    }
    if (editId.value) {
      await foodStore.update(editId.value, mealData)
    } else {
      await foodStore.add(mealData, [])
    }
    toast.add({ severity: 'success', summary: 'บันทึกสำเร็จ', life: 2500 })
    resetForm()
  } catch {
    toast.add({ severity: 'error', summary: 'เกิดข้อผิดพลาด', life: 3000 })
  } finally {
    saving.value = false
  }
}

async function runFoodAI() {
  if (!aiInput.value.trim()) return
  aiLoading.value = true
  try {
    const result = await analyzeFoodDescription(aiInput.value)
    // ล้างรายการว่างออก (ถ้ามีแค่รายเดียว default เปล่าๆ) แล้วเติมจาก AI
    const onlyEmpty =
      form.items.length === 1 && !form.items[0].name && !form.items[0].calories
    const items: MealItem[] = result.items.map((it) => ({
      id: uuidv4(),
      name: it.name,
      portion: it.portion ?? '1 ส่วน',
      calories: Math.round(it.calories ?? 0),
      protein: +(it.protein ?? 0).toFixed(1),
      carb: +(it.carb ?? 0).toFixed(1),
      fat: +(it.fat ?? 0).toFixed(1),
      sodium: Math.round(it.sodium ?? 0),
      category: it.category ?? 'protein'
    }))
    form.items = onlyEmpty ? items : [...form.items, ...items]
    if (result.notes && !form.notes) form.notes = result.notes
    aiInput.value = ''
    toast.add({
      severity: 'success',
      summary: 'AI วิเคราะห์สำเร็จ',
      detail: `เติม ${items.length} รายการ — ตรวจสอบและแก้ไขได้`,
      life: 2800
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

watch(selectedDate, (date) => foodStore.fetchByDate(date))
onMounted(() => foodStore.fetchByDate(selectedDate.value))
</script>
