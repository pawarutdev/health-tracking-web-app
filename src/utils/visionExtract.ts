import type { ExerciseActivity, HRZones, SleepStages, Weather } from '@/types'

const GEMINI_MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

export interface ExtractedExerciseFields extends Partial<ExerciseActivity> {
  hrZones?: HRZones
  sleepStages?: SleepStages
  weather?: Weather
}

const SCHEMA_HINT = `{
  "type": "string (วิ่ง|เดิน|จักรยาน|ยิม|ว่ายน้ำ|...)",
  "startTime": "HH:MM (24h)"
  "endTime": "HH:MM",
  "duration": "minutes (number, total elapsed in minutes)",
  "distance": "km (number)",
  "steps": "number",
  "calories": "kcal active (number)",
  "restingCalories": "number",
  "activeCalories": "number",
  "totalCalories": "number",
  "avgHR": "bpm",
  "maxHR": "bpm",
  "restingHR": "bpm",
  "aerobicTE": "0-5",
  "anaerobicTE": "0-5",
  "vo2Max": "number",
  "primaryBenefit": "string e.g. Threshold, Aerobic Base, Tempo",
  "trainingLoad": "number",
  "avgPace": "M:SS /km",
  "bestPace": "M:SS /km",
  "movingPace": "M:SS /km",
  "avgSpeed": "km/h",
  "movingSpeed": "km/h",
  "maxSpeed": "km/h",
  "movingTime": "MM:SS or HH:MM:SS",
  "elapsedTime": "MM:SS or HH:MM:SS",
  "runTime": "MM:SS",
  "walkTime": "MM:SS",
  "standingTime": "MM:SS",
  "avgCadence": "spm",
  "maxCadence": "spm",
  "avgStrideLength": "m",
  "elevationGain": "m",
  "elevationLoss": "m",
  "minElevation": "m",
  "maxElevation": "m",
  "sweatLossMl": "ml",
  "avgTempC": "celsius",
  "minTempC": "celsius",
  "maxTempC": "celsius",
  "moderateIntensityMin": "minutes",
  "vigorousIntensityMin": "minutes",
  "totalIntensityMin": "minutes",
  "hrZones": { "zone1": "minutes in zone1", "zone2": "...", "zone3": "...", "zone4": "...", "zone5": "..." },
  "bodyBattery": "0-100",
  "bodyBatteryCharged": "number",
  "bodyBatteryDrained": "number",
  "stressScore": "0-100",
  "sleepDuration": "hours (decimal)",
  "sleepScore": "0-100",
  "sleepStages": { "deepMin": "minutes", "lightMin": "minutes", "remMin": "minutes", "awakeMin": "minutes" },
  "weight": "kg",
  "weather": { "tempC": "celsius", "condition": "string", "windKph": "km/h" },
  "location": "string"
}`

const PROMPT = `You are extracting workout/health data from Garmin Connect screenshots (Thai UI).
Analyze ALL provided images together as one activity session and return a SINGLE JSON object.

Rules:
- Return ONLY raw JSON, no markdown code fences, no commentary.
- Omit any field you cannot read with confidence (do NOT guess).
- Numbers must be numeric (no units, no commas). e.g. "503" not "503 kcal".
- Pace/time strings keep "M:SS" or "HH:MM:SS" format as displayed.
- Thai labels mapping: ระยะทาง=distance(km), เวลารวม=elapsedTime, เวลาที่เคลื่อนไหว=movingTime,
  เวลาวิ่ง=runTime, เวลาเดิน=walkTime, เวลาที่อยู่นิ่ง=standingTime,
  เพซเฉลี่ย=avgPace, เพซเคลื่อนที่เฉลี่ย=movingPace, เพซที่ดีที่สุด=bestPace,
  ความเร็วเฉลี่ย=avgSpeed, ความเร็วสูงสุด=maxSpeed,
  อัตราเต้นหัวใจเฉลี่ย=avgHR, อัตราเต้นหัวใจสูงสุด=maxHR,
  วิ่งรอบขาเฉลี่ย=avgCadence, รอบขาการวิ่งสูงสุด=maxCadence, ช่วงก้าวยาวเฉลี่ย=avgStrideLength,
  การขึ้นทั้งหมด=elevationGain, การลงทั้งหมด=elevationLoss,
  ระดับความสูงต่ำสุด=minElevation, ระดับความสูงสูงสุด=maxElevation,
  แคลอรี่ขณะพัก=restingCalories, แคลอรี่ที่ใช้=activeCalories, แคลอรี่ที่เผาผลาญทั้งหมด=totalCalories,
  ปริมาณเหงื่อที่เสียโดยประมาณ=sweatLossMl,
  อุณหภูมิเฉลี่ย=avgTempC, อุณหภูมิต่ำสุด=minTempC, อุณหภูมิสูงสุด=maxTempC,
  ปานกลาง=moderateIntensityMin, หนัก=vigorousIntensityMin, รวมทั้งหมด=totalIntensityMin,
  Aerobic=aerobicTE, Anaerobic=anaerobicTE, โหลดการออกกำลังกาย=trainingLoad, สิทธิประโยชน์หลัก=primaryBenefit,
  เวลานอนทั้งหมด=sleepDuration(hours), หลับลึก=sleepStages.deepMin, ตื้น=sleepStages.lightMin, REM=sleepStages.remMin, ตื่น=sleepStages.awakeMin,
  ความเครียด=stressScore, Body Battery=bodyBattery, ขณะพัก=restingHR, VO2 Max=vo2Max
- HR zones (โซน 1..5): extract minutes per zone -> hrZones.zone1..zone5 (convert M:SS to minutes decimal).
- duration: prefer total elapsed time in minutes (decimal). If you see "58:51" -> 58.85.
- If multiple images show the same value, use it once.

Schema (omit unknown fields):
${SCHEMA_HINT}`

function parseTimeToMinutes(s?: string): number | undefined {
  if (!s) return undefined
  const parts = s.split(':').map((p) => parseInt(p, 10))
  if (parts.some(isNaN)) return undefined
  if (parts.length === 2) return parts[0] + parts[1] / 60
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60
  return undefined
}

function normalizeHRZones(z: any): HRZones | undefined {
  if (!z || typeof z !== 'object') return undefined
  const get = (v: any) => (typeof v === 'number' ? v : parseTimeToMinutes(String(v)) ?? 0)
  const out: HRZones = {
    zone1: get(z.zone1), zone2: get(z.zone2), zone3: get(z.zone3),
    zone4: get(z.zone4), zone5: get(z.zone5)
  }
  const total = (out.zone1 ?? 0) + (out.zone2 ?? 0) + (out.zone3 ?? 0) + (out.zone4 ?? 0) + (out.zone5 ?? 0)
  return total > 0 ? out : undefined
}

async function fileToBase64Raw(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const [meta, data] = result.split(',')
      const mimeType = /data:(.*?);base64/.exec(meta)?.[1] ?? 'image/jpeg'
      resolve({ data, mimeType })
    }
    reader.onerror = () => reject(new Error('Read failed'))
    reader.readAsDataURL(file)
  })
}

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
}

export async function extractFromImages(files: File[]): Promise<ExtractedExerciseFields> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY ไม่ถูกตั้งค่าใน .env')
  if (!files.length) throw new Error('ไม่มีรูปภาพ')

  const images = await Promise.all(files.map(fileToBase64Raw))

  const body = {
    contents: [{
      parts: [
        { text: PROMPT },
        ...images.map((img) => ({ inline_data: { mime_type: img.mimeType, data: img.data } }))
      ]
    }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
  }

  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini error ${res.status}: ${errText.slice(0, 200)}`)
  }
  const json = await res.json()
  const text: string = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
  if (!text) throw new Error('ไม่ได้รับข้อมูลจาก AI')

  let parsed: any
  try {
    parsed = JSON.parse(stripJsonFences(text))
  } catch {
    throw new Error('AI ส่งผลลัพธ์ที่ไม่ใช่ JSON ที่ถูกต้อง')
  }

  if (parsed.hrZones) parsed.hrZones = normalizeHRZones(parsed.hrZones)
  if (parsed.duration == null && parsed.elapsedTime) {
    const m = parseTimeToMinutes(parsed.elapsedTime)
    if (m != null) parsed.duration = +m.toFixed(2)
  }

  for (const k of Object.keys(parsed)) {
    if (parsed[k] === '' || parsed[k] === null) delete parsed[k]
  }

  return parsed as ExtractedExerciseFields
}
