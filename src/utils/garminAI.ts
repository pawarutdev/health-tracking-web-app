/**
 * Gemini Vision OCR for Garmin / smartwatch screenshots
 * Sends one or more images to Gemini and returns a structured JSON
 * matching ExerciseActivity field names.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
const MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

export interface ParsedActivity {
  type?: string
  startTime?: string
  endTime?: string
  duration?: number          // นาที
  distance?: number          // km
  steps?: number
  calories?: number
  restingCalories?: number
  activeCalories?: number
  totalCalories?: number
  avgHR?: number
  maxHR?: number
  restingHR?: number
  aerobicTE?: number
  anaerobicTE?: number
  vo2Max?: number
  avgPace?: string
  bestPace?: string
  movingPace?: string
  avgSpeed?: number
  maxSpeed?: number
  movingSpeed?: number
  avgCadence?: number
  maxCadence?: number
  avgStrideLength?: number
  elevationGain?: number
  elevationLoss?: number
  minElevation?: number
  maxElevation?: number
  movingTime?: string
  elapsedTime?: string
  runTime?: string
  walkTime?: string
  standingTime?: string
  sweatLossMl?: number
  avgTempC?: number
  minTempC?: number
  maxTempC?: number
  moderateIntensityMin?: number
  vigorousIntensityMin?: number
  totalIntensityMin?: number
  primaryBenefit?: string
  trainingLoad?: number
  bodyBattery?: number
  bodyBatteryCharged?: number
  bodyBatteryDrained?: number
  stressScore?: number
  sleepDuration?: number     // ชม.
  sleepScore?: number
  sleepStages?: {
    deepMin?: number
    lightMin?: number
    remMin?: number
    awakeMin?: number
  }
  hrZones?: {
    zone1?: number
    zone2?: number
    zone3?: number
    zone4?: number
    zone5?: number
  }
  weather?: {
    tempC?: number
    condition?: string
  }
  location?: string
  notes?: string
}

const PROMPT = `คุณเป็น OCR ที่อ่านภาพหน้าจอจากนาฬิกา Garmin / Apple Watch / Fitbit / แอปออกกำลังกาย
อ่านข้อมูลจากภาพทั้งหมด (อาจมีหลายภาพรวมกัน) แล้วส่งกลับเป็น JSON เท่านั้น (ไม่มีข้อความอื่น ไม่มี markdown code fence)

โครงสร้าง JSON ที่ต้องการ (ใส่เฉพาะ field ที่อ่านได้จากภาพ ตัด field ที่ไม่มีออก):
{
  "type": "วิ่ง" | "เดิน" | "จักรยาน" | "ยิม" | "ว่ายน้ำ" | "อื่นๆ",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "duration": number (นาที, แปลงจาก mm:ss หรือ hh:mm:ss),
  "distance": number (กิโลเมตร),
  "steps": number,
  "calories": number (kcal รวม),
  "restingCalories": number,
  "activeCalories": number,
  "totalCalories": number,
  "avgHR": number (bpm),
  "maxHR": number,
  "restingHR": number,
  "aerobicTE": number (0-5),
  "anaerobicTE": number (0-5),
  "vo2Max": number,
  "avgPace": "mm:ss" (เพซเฉลี่ย /km),
  "bestPace": "mm:ss",
  "movingPace": "mm:ss",
  "avgSpeed": number (km/h),
  "maxSpeed": number,
  "movingSpeed": number,
  "avgCadence": number (spm),
  "maxCadence": number,
  "avgStrideLength": number (เมตร),
  "elevationGain": number (เมตร),
  "elevationLoss": number,
  "minElevation": number,
  "maxElevation": number,
  "movingTime": "hh:mm:ss",
  "elapsedTime": "hh:mm:ss",
  "runTime": "mm:ss",
  "walkTime": "mm:ss",
  "standingTime": "mm:ss",
  "sweatLossMl": number,
  "avgTempC": number,
  "minTempC": number,
  "maxTempC": number,
  "moderateIntensityMin": number,
  "vigorousIntensityMin": number,
  "totalIntensityMin": number,
  "primaryBenefit": string (เช่น "Threshold", "แอโรบิก"),
  "trainingLoad": number,
  "bodyBattery": number (0-100),
  "bodyBatteryCharged": number,
  "bodyBatteryDrained": number,
  "stressScore": number (0-100),
  "sleepDuration": number (ชั่วโมง รวม เช่น 6h 29m -> 6.48),
  "sleepScore": number (0-100),
  "sleepStages": { "deepMin": number, "lightMin": number, "remMin": number, "awakeMin": number },
  "hrZones": { "zone1": number, "zone2": number, "zone3": number, "zone4": number, "zone5": number } (ตัวเลขเป็น "นาที" รวมในโซนนั้น แปลงจาก mm:ss),
  "weather": { "tempC": number, "condition": "sunny"|"cloudy"|"rainy" },
  "location": string (ชื่อสถานที่),
  "notes": string (สรุปสั้นๆ จากชื่อกิจกรรม)
}

กฎสำคัญ:
- ถ้าค่าใดอ่านไม่ออกหรือไม่มีในภาพ ให้ "ละเว้น" field นั้นทั้งหมด ห้ามใส่ null/undefined/0
- duration คือ นาที เท่านั้น เช่น 58:51 -> 58.85, 1h 5m -> 65
- sleepDuration คือ ชั่วโมง เช่น 6h 29m -> 6.48
- hrZones.* ให้แปลงจาก mm:ss เป็น "นาที" (ทศนิยมได้) เช่น 28:55 -> 28.92
- ส่งกลับเป็น JSON เปล่าเท่านั้น ไม่ต้องห่อด้วย \`\`\`json`

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip "data:image/...;base64," prefix
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function compressImage(file: File, maxSize = 1280, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('compress failed'))), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load failed')) }
    img.src = url
  })
}

export async function analyzeGarminImages(files: File[]): Promise<ParsedActivity> {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY ไม่ได้ตั้งค่า')
  if (!files.length) throw new Error('ไม่มีรูปภาพ')

  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
    { text: PROMPT }
  ]

  for (const f of files) {
    const blob = await compressImage(f)
    const b64 = await fileToBase64(new File([blob], f.name, { type: 'image/jpeg' }))
    parts.push({ inline_data: { mime_type: 'image/jpeg', data: b64 } })
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json'
      }
    })
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${err}`)
  }

  const json = await res.json()
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) throw new Error('Gemini ไม่ส่งข้อมูลกลับ')

  // strip code fence ถ้ามี
  const clean = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()

  try {
    return JSON.parse(clean) as ParsedActivity
  } catch (e) {
    throw new Error('Parse JSON ล้มเหลว: ' + clean.slice(0, 200))
  }
}
