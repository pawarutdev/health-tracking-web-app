/**
 * Gemini Vision OCR สำหรับหน้า "ภาพรวม" ของ Garmin Connect / นาฬิกาสุขภาพ
 * รับภาพหน้าจอภาพรวมตอนก่อนนอน (อาจหลายภาพ) แล้วส่งกลับเป็น JSON
 * ตามฟิลด์ของ BedtimeSummary
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
const MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

export interface ParsedBedtimeSummary {
  vo2Max?: number
  stressScore?: number
  bodyBattery?: number
  bodyBatteryCharged?: number
  bodyBatteryDrained?: number
  totalCalories?: number
  activeCalories?: number
  restingCalories?: number
  steps?: number
  latestWeight?: number
  restingHR?: number
  sleepDuration?: number
  sleepScore?: number
  sleepStages?: {
    deepMin?: number
    lightMin?: number
    remMin?: number
    awakeMin?: number
  }
  intensityMinutes?: number
  notes?: string
}

const PROMPT = `คุณเป็น OCR ที่อ่านภาพหน้าจอ "ภาพรวม" จาก Garmin Connect / นาฬิกาสุขภาพ
ภาพอาจมีหลายใบ (เช่น VO2 Max, ความเครียด, Body Battery, แคลอรี่, ก้าว, การนอน)
อ่านค่าจากภาพทั้งหมด แล้วส่งกลับเป็น JSON เท่านั้น (ไม่มีข้อความอื่น ไม่มี markdown code fence)

โครงสร้าง JSON ที่ต้องการ (ใส่เฉพาะ field ที่อ่านได้จากภาพ ตัด field ที่ไม่มีออก):
{
  "vo2Max": number,
  "stressScore": number (0-100, ค่าความเครียดเฉลี่ยที่แสดงตรงกลางวงแหวน),
  "bodyBattery": number (0-100, ค่าตรงกลางวงแหวน Body Battery),
  "bodyBatteryCharged": number (เครื่องหมาย + เช่น "+61"),
  "bodyBatteryDrained": number (เครื่องหมาย - เช่น "-84" ให้ใส่เป็นเลขบวก 84),
  "totalCalories": number (แคลอรี่ที่เผาผลาญ ค่าใหญ่ตรงกลาง เช่น 3,308),
  "activeCalories": number (แอคทีฟ),
  "restingCalories": number (ขณะพัก),
  "steps": number (ก้าว ค่าใหญ่ตรงกลาง เช่น 13,116),
  "latestWeight": number (กิโลกรัม ถ้ามีในภาพ),
  "restingHR": number (bpm ขณะพัก เช่น 47),
  "sleepDuration": number (ชั่วโมง รวม เช่น 7h 45m -> 7.75),
  "sleepScore": number (0-100 คะแนนการนอนหลับ),
  "sleepStages": { "deepMin": number, "lightMin": number, "remMin": number, "awakeMin": number },
  "intensityMinutes": number (นาทีความเข้มข้น เช่น 309),
  "notes": string (สั้นๆ สรุปสภาพรวม ถ้ามีข้อสังเกต)
}

กฎสำคัญ:
- ถ้าค่าใดอ่านไม่ออกหรือไม่มีในภาพ ให้ "ละเว้น" field นั้นทั้งหมด ห้ามใส่ null/undefined/0
- ตัวเลขมีคอมมาให้ตัดออก เช่น "13,116" -> 13116
- sleepDuration คิดเป็นชั่วโมงทศนิยม เช่น 7h 45m -> 7.75
- bodyBatteryDrained ให้ใส่เป็นเลขบวก (ระบบรู้ว่ามันคือค่าที่ใช้ไป)
- totalCalories คือค่ารวมที่เผาผลาญทั้งวัน (active + resting) ตามที่ Garmin แสดง
- ส่งกลับเป็น JSON เปล่าเท่านั้น`

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
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
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('compress failed'))),
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('img load failed'))
    }
    img.src = url
  })
}

export async function analyzeBedtimeImages(files: File[]): Promise<ParsedBedtimeSummary> {
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

  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  try {
    return JSON.parse(clean) as ParsedBedtimeSummary
  } catch {
    throw new Error('Parse JSON ล้มเหลว: ' + clean.slice(0, 200))
  }
}
