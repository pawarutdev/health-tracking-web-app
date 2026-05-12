/**
 * Gemini text analyzer สำหรับวิเคราะห์โภชนาการจากข้อความ
 * ผู้ใช้พิมพ์รายละเอียดอาหาร (เช่น "ข้าวผัดกระเพราไก่ไข่ดาว 1 จาน")
 * ระบบส่งกลับเป็นรายการ MealItem พร้อมแคลอรี่และโภชนาการ
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string
const MODEL = 'gemini-2.5-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`

import type { FoodCategory } from '@/types'

export interface ParsedFoodItem {
  name: string
  portion: string
  calories: number
  protein: number
  carb: number
  fat: number
  sodium: number
  category: FoodCategory
}

export interface ParsedFoodResult {
  items: ParsedFoodItem[]
  notes?: string
}

const PROMPT = `คุณเป็นนักโภชนาการที่วิเคราะห์อาหารไทย/สากลจากคำอธิบาย
ผู้ใช้จะพิมพ์รายละเอียดอาหาร เช่น "ข้าวผัดกระเพราไก่ไข่ดาว 1 จาน + ชาเขียว 1 แก้ว"
หน้าที่: แตกออกเป็นรายการย่อย แต่ละรายการประมาณค่าโภชนาการตามมาตรฐานอาหารไทย (USDA/INMU)
ส่งกลับเป็น JSON เท่านั้น ไม่มี markdown code fence

โครงสร้าง:
{
  "items": [
    {
      "name": string (ชื่ออาหารกระชับ ภาษาไทย),
      "portion": string (เช่น "1 จาน", "1 แก้ว", "100 g"),
      "calories": number (kcal ต่อรายการ),
      "protein": number (g),
      "carb": number (g),
      "fat": number (g),
      "sodium": number (mg, ใส่ 0 ถ้าไม่ทราบ),
      "category": "protein" | "carb" | "vegetable" | "fried" | "dessert" | "drink"
    }
  ],
  "notes": string (สรุปสั้นๆ เกี่ยวกับมื้อนี้ เช่น "มื้อโปรตีนสูง" หรือคำแนะนำสั้นๆ)
}

กฎ:
- ประมาณค่าจากปริมาณจริงที่ผู้ใช้บอก ถ้าไม่บอกให้ใช้หน่วยมาตรฐาน (1 จาน, 1 แก้ว, 100g)
- category เลือกจากส่วนประกอบหลัก: ทอด→fried, ข้าว/เส้น→carb, เนื้อ/ไข่→protein, ผัก→vegetable, ขนม→dessert, เครื่องดื่ม→drink
- ตัวเลขทุกค่าเป็น number (ไม่ใส่ "approx", ไม่ใส่ string)
- ส่งกลับ JSON เปล่าเท่านั้น`

export async function analyzeFoodDescription(description: string): Promise<ParsedFoodResult> {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY ไม่ได้ตั้งค่า')
  if (!description.trim()) throw new Error('กรุณาพิมพ์รายละเอียดอาหาร')

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { text: `\n\nรายละเอียดอาหารที่ผู้ใช้พิมพ์:\n${description}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.2,
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
    const parsed = JSON.parse(clean) as ParsedFoodResult
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('รูปแบบข้อมูลไม่ถูกต้อง')
    }
    return parsed
  } catch (e: any) {
    throw new Error('Parse JSON ล้มเหลว: ' + clean.slice(0, 200))
  }
}
