import { Timestamp } from 'firebase/firestore'

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
}

export type PhysicalFeeling = 'fresh' | 'tired' | 'sore' | 'stressed'
export type DailyGoal = 'fat_loss' | 'training' | 'rest' | 'diet_control'
export type DamageLevel = 'low' | 'medium' | 'high'
export type RecoveryStatus = 'ready' | 'light' | 'rest' | 'overtraining'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beverage'
export type FoodCategory = 'protein' | 'carb' | 'vegetable' | 'fried' | 'dessert' | 'drink'
export type FoodFlag = 'spicy' | 'sweet' | 'salty' | 'clean' | 'cheat'
export type ExerciseDevice = 'garmin' | 'manual'
export type InjurySeverity = 'mild' | 'moderate' | 'severe'

export interface HRZones {
  zone1?: number
  zone2?: number
  zone3?: number
  zone4?: number
  zone5?: number
}

export interface Weather {
  tempC?: number
  condition?: string
  windKph?: number
  humidity?: number
}

export interface SleepStages {
  deepMin?: number
  lightMin?: number
  remMin?: number
  awakeMin?: number
}

export interface DailyLog {
  id?: string
  date: string
  morningWeight?: number
  postWorkoutWeight?: number
  physicalFeeling: PhysicalFeeling
  goal: DailyGoal
  notes?: string
  isCheatDay: boolean
  cheatReason?: string
  alcoholAmount?: number
  damageLevel?: DamageLevel
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface ExerciseActivity {
  id?: string
  date: string
  type: string
  startTime?: string
  endTime?: string
  duration?: number
  distance?: number
  steps?: number
  calories?: number
  avgHR?: number
  maxHR?: number
  aerobicTE?: number
  anaerobicTE?: number
  vo2Max?: number
  weight?: number
  sleepDuration?: number
  sleepScore?: number
  pace?: string
  hrZones?: HRZones
  device: ExerciseDevice
  notes?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp

  avgPace?: string
  bestPace?: string
  movingPace?: string
  avgSpeed?: number
  movingSpeed?: number
  maxSpeed?: number

  movingTime?: string
  elapsedTime?: string
  runTime?: string
  walkTime?: string
  standingTime?: string

  avgCadence?: number
  maxCadence?: number
  avgStrideLength?: number

  elevationGain?: number
  elevationLoss?: number
  minElevation?: number
  maxElevation?: number

  restingCalories?: number
  activeCalories?: number
  totalCalories?: number
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
  restingHR?: number

  sleepStages?: SleepStages
  weather?: Weather
  location?: string
}

export interface MealItem {
  id: string
  name: string
  portion: string
  calories: number
  protein: number
  carb: number
  fat: number
  sodium: number
  category: FoodCategory
}

export interface Meal {
  id?: string
  date: string
  type: MealType
  items: MealItem[]
  totalCalories: number
  totalProtein: number
  totalCarb: number
  totalFat: number
  totalSodium: number
  imageUrls?: string[]
  notes?: string
  flags: FoodFlag[]
  createdAt?: Timestamp
}

export interface WeightLog {
  id?: string
  date: string
  morning?: number
  postWorkout?: number
  beforeSleep?: number
  waist?: number
  bodyFat?: number
  createdAt?: Timestamp
}

export interface Injury {
  location: string
  severity: InjurySeverity
  notes?: string
}

export interface HealthMetrics {
  id?: string
  date: string
  sleepDuration?: number
  sleepScore?: number
  stressScore?: number
  bodyBattery?: number
  restingHR?: number
  hrv?: number
  recoveryTime?: number
  recoveryStatus?: RecoveryStatus
  injuries?: Injury[]
  createdAt?: Timestamp
}

export interface BedtimeSummary {
  id?: string
  date: string
  vo2Max?: number
  stressScore?: number
  bodyBattery?: number
  bodyBatteryCharged?: number
  bodyBatteryDrained?: number
  totalCalories?: number      // แคลอรี่รวมที่เผาผลาญทั้งวัน (ค่าล่าสุดก่อนนอน)
  activeCalories?: number
  restingCalories?: number
  steps?: number
  latestWeight?: number       // น้ำหนักล่าสุด ณ ก่อนนอน
  restingHR?: number
  sleepDuration?: number      // ชั่วโมง
  sleepScore?: number
  sleepStages?: SleepStages
  intensityMinutes?: number
  isCheatDay?: boolean
  notes?: string
  imageUrls?: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface Goals {
  id?: string
  targetWeight?: number
  monthlyDistance?: number
  dailyProteinTarget?: number
  workoutFrequency?: number
  restDayRequirement?: number
  dailyCalorieTarget?: number
  dailyCalorieBurn?: number
  updatedAt?: Timestamp
}

export interface ImportBatch {
  id?: string
  type: 'exercise' | 'meals' | 'weight' | 'garmin'
  fileName: string
  recordCount: number
  importedAt?: Timestamp
}

export interface DashboardData {
  latestWeight?: number
  weightChange?: number
  todayCaloriesIn: number
  todayCaloriesOut: number
  todayDistance: number
  todayDuration: number
  avgHR?: number
  stressScore?: number
  sleepDuration?: number
  bodyBattery?: number
  recoveryStatus?: RecoveryStatus
}
