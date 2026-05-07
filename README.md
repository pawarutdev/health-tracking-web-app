# Health Tracking Web App

แอปติดตามสุขภาพส่วนตัว สร้างด้วย Vue 3 + PrimeVue + TypeScript + Tailwind + Firebase

## คุณสมบัติ (MVP)

- 🔐 Login / Register
- 🏠 แดชบอร์ดสรุปข้อมูล
- 📝 บันทึกประจำวัน (Daily Log)
- 🏃 บันทึกการออกกำลังกาย
- 🍚 บันทึกอาหาร (พร้อมโภชนาการ)
- ⚖️ ติดตามน้ำหนัก (พร้อมกราฟ)
- 💤 ข้อมูลสุขภาพ & ฟื้นฟู
- 🎯 ตั้งเป้าหมาย
- 📊 รายงาน (7/30 วัน / เดือน)
- 📥 นำเข้าข้อมูล CSV
- 📤 Export Excel / CSV

## เทคโนโลยี

- **Frontend**: Vue 3 + TypeScript + Composition API
- **UI**: PrimeVue 4 (Aura theme) + Tailwind CSS
- **Charts**: ECharts (vue-echarts)
- **State**: Pinia
- **Router**: Vue Router 4
- **Backend**: Firebase (Auth + Firestore + Storage + Hosting)
- **Export**: SheetJS (xlsx)
- **Date**: Day.js (Thai locale)

## การติดตั้ง

### 1. ตั้งค่า Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. สร้างโปรเจกต์ใหม่
3. เปิดใช้: **Authentication** (Email/Password), **Firestore Database**, **Storage**, **Hosting**
4. ไปที่ Project Settings > General > Your apps > Web app
5. คัดลอก config

### 2. ตั้งค่า Environment

```bash
cp .env.example .env
```

แก้ไขไฟล์ `.env` ด้วยค่า Firebase ของคุณ:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 3. ตั้งค่า Firebase Project ID

แก้ไขไฟล์ `.firebaserc`:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### 4. ติดตั้ง Dependencies

```bash
npm install
```

### 5. รัน Development Server

```bash
npm run dev
```

### 6. Build & Deploy

```bash
# Install Firebase CLI (ครั้งแรก)
npm install -g firebase-tools

# Login
firebase login

# Deploy
npm run deploy
```

## โครงสร้างโปรเจกต์

```
src/
├── assets/          # CSS global
├── components/
│   ├── charts/      # ECharts components
│   ├── common/      # StatCard, LoadingSpinner
│   └── layout/      # AppLayout, AppNavbar, BottomNav
├── firebase/        # Firebase config
├── router/          # Vue Router
├── stores/          # Pinia stores (auth, exercise, food, weight, health, goals)
├── types/           # TypeScript interfaces
├── utils/           # date.ts, export.ts
└── views/           # All pages
```

## การนำเข้าข้อมูล CSV

### exercise.csv
```
date,type,duration,distance,calories,avg_hr,max_hr,device
2024-01-01,วิ่ง,45,8.5,420,155,178,manual
```

### weight.csv
```
date,morning,post_workout,before_sleep,waist,body_fat
2024-01-01,75.5,74.8,76.0,82,18.5
```

### meals.csv
```
date,meal_type,food_name,portion,calories,protein,carb,fat
2024-01-01,breakfast,ข้าวต้ม,1 ถ้วย,150,5,30,1
```
# health-tracking-web-app
