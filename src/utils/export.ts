import * as XLSX from 'xlsx'
import type { ExerciseActivity, Meal, WeightLog, HealthMetrics } from '@/types'
import { formatDate } from './date'

// ─── Excel / CSV Export ────────────────────────────────────────────────────

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function workbookToBlob(wb: XLSX.WorkBook): Blob {
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ─── Exercise ───────────────────────────────────────────────────────────────

export function exportExerciseExcel(activities: ExerciseActivity[], filename = 'exercise') {
  const rows = activities.map((a) => ({
    วันที่: a.date,
    ประเภท: a.type,
    เริ่ม: a.startTime ?? '',
    สิ้นสุด: a.endTime ?? '',
    'ระยะเวลา (นาที)': a.duration ?? '',
    'ระยะทาง (กม.)': a.distance ?? '',
    ก้าว: a.steps ?? '',
    'แคลอรี่ (kcal)': a.calories ?? '',
    'ชีพจรเฉลี่ย': a.avgHR ?? '',
    'ชีพจรสูงสุด': a.maxHR ?? '',
    'VO2 Max': a.vo2Max ?? '',
    'Aerobic TE': a.aerobicTE ?? '',
    'Anaerobic TE': a.anaerobicTE ?? '',
    อุปกรณ์: a.device,
    หมายเหตุ: a.notes ?? ''
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ออกกำลังกาย')
  download(workbookToBlob(wb), `${filename}_${Date.now()}.xlsx`)
}

export function exportExerciseCSV(activities: ExerciseActivity[], filename = 'exercise') {
  const rows = activities.map((a) => ({
    date: a.date,
    type: a.type,
    duration: a.duration ?? '',
    distance: a.distance ?? '',
    calories: a.calories ?? '',
    avg_hr: a.avgHR ?? '',
    max_hr: a.maxHR ?? ''
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  download(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), `${filename}_${Date.now()}.csv`)
}

// ─── Meals ──────────────────────────────────────────────────────────────────

export function exportMealsExcel(meals: Meal[], filename = 'meals') {
  const rows = meals.map((m) => ({
    วันที่: m.date,
    มื้อ: m.type,
    'แคลอรี่รวม': m.totalCalories,
    'โปรตีน (g)': m.totalProtein,
    'คาร์บ (g)': m.totalCarb,
    'ไขมัน (g)': m.totalFat,
    'โซเดียม (mg)': m.totalSodium,
    แท็ก: m.flags.join(', ')
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'อาหาร')
  download(workbookToBlob(wb), `${filename}_${Date.now()}.xlsx`)
}

// ─── Weight ─────────────────────────────────────────────────────────────────

export function exportWeightExcel(logs: WeightLog[], filename = 'weight') {
  const rows = logs.map((w) => ({
    วันที่: w.date,
    'น้ำหนักเช้า (kg)': w.morning ?? '',
    'น้ำหนักหลังออกกำลังกาย (kg)': w.postWorkout ?? '',
    'น้ำหนักก่อนนอน (kg)': w.beforeSleep ?? '',
    'รอบเอว (cm)': w.waist ?? '',
    'ไขมันร่างกาย (%)': w.bodyFat ?? ''
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'น้ำหนัก')
  download(workbookToBlob(wb), `${filename}_${Date.now()}.xlsx`)
}

export function exportWeightCSV(logs: WeightLog[], filename = 'weight') {
  const rows = logs.map((w) => ({
    date: w.date,
    morning: w.morning ?? '',
    post_workout: w.postWorkout ?? '',
    before_sleep: w.beforeSleep ?? '',
    waist: w.waist ?? '',
    body_fat: w.bodyFat ?? ''
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  download(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), `${filename}_${Date.now()}.csv`)
}

// ─── Weekly Report Excel ─────────────────────────────────────────────────────

export function exportWeeklyReportExcel(data: {
  exercises: ExerciseActivity[]
  meals: Meal[]
  weights: WeightLog[]
  health: HealthMetrics[]
  startDate: string
  endDate: string
}) {
  const wb = XLSX.utils.book_new()

  // Summary sheet
  const totalCalIn = data.meals.reduce((s, m) => s + m.totalCalories, 0)
  const totalCalOut = data.exercises.reduce((s, e) => s + (e.calories ?? 0), 0)
  const totalDist = data.exercises.reduce((s, e) => s + (e.distance ?? 0), 0)
  const summary = [
    { รายการ: 'ช่วงวันที่', ค่า: `${data.startDate} ถึง ${data.endDate}` },
    { รายการ: 'แคลอรี่รับเข้า (kcal)', ค่า: totalCalIn },
    { รายการ: 'แคลอรี่เผาผลาญ (kcal)', ค่า: totalCalOut },
    { รายการ: 'สมดุลแคลอรี่', ค่า: totalCalIn - totalCalOut },
    { รายการ: 'ระยะทางรวม (กม.)', ค่า: +totalDist.toFixed(2) },
    { รายการ: 'จำนวนครั้งออกกำลังกาย', ค่า: data.exercises.length }
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'สรุป')

  const exRows = data.exercises.map((a) => ({
    วันที่: a.date,
    ประเภท: a.type,
    'ระยะเวลา(นาที)': a.duration ?? '',
    'ระยะทาง(กม.)': a.distance ?? '',
    'แคลอรี่': a.calories ?? '',
    'ชีพจรเฉลี่ย': a.avgHR ?? ''
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exRows), 'ออกกำลังกาย')

  const wRows = data.weights.map((w) => ({
    วันที่: w.date,
    'น้ำหนักเช้า': w.morning ?? '',
    'น้ำหนักหลังออก': w.postWorkout ?? '',
    'รอบเอว': w.waist ?? ''
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wRows), 'น้ำหนัก')

  download(workbookToBlob(wb), `weekly_report_${data.startDate}_${data.endDate}.xlsx`)
}

// ─── CSV Import Parser ───────────────────────────────────────────────────────

export interface ParsedCSVRow {
  [key: string]: string
}

export function parseCSV(text: string): ParsedCSVRow[] {
  const wb = XLSX.read(text, { type: 'string' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<ParsedCSVRow>(ws, { raw: false })
}

export function parseCSVFile(file: File): Promise<ParsedCSVRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        resolve(parseCSV(text))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'))
    reader.readAsText(file, 'utf-8')
  })
}
