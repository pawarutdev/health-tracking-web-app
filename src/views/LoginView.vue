<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center px-4" style="padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom)">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg mb-4">
          <i class="pi pi-heart text-blue-600 text-4xl" />
        </div>
        <h1 class="text-2xl font-bold text-white">Health Tracker</h1>
        <p class="text-blue-100 text-sm mt-1">ติดตามสุขภาพของคุณ</p>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-3xl shadow-2xl p-6">
        <!-- Tab Toggle -->
        <div class="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            :class="mode === 'login' ? 'bg-white shadow text-blue-600' : 'text-gray-500'"
            @click="mode = 'login'"
          >
            เข้าสู่ระบบ
          </button>
          <button
            class="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            :class="mode === 'register' ? 'bg-white shadow text-blue-600' : 'text-gray-500'"
            @click="mode = 'register'"
          >
            สมัครสมาชิก
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <!-- Display name (register only) -->
          <div v-if="mode === 'register'" class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">ชื่อ</label>
            <InputText
              v-model="form.displayName"
              placeholder="ชื่อของคุณ"
              class="w-full"
              :class="{ 'p-invalid': errors.displayName }"
            />
            <small v-if="errors.displayName" class="text-red-500">{{ errors.displayName }}</small>
          </div>

          <!-- Email -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">อีเมล</label>
            <InputText
              v-model="form.email"
              type="email"
              placeholder="email@example.com"
              class="w-full"
              :class="{ 'p-invalid': errors.email }"
            />
            <small v-if="errors.email" class="text-red-500">{{ errors.email }}</small>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium text-gray-700">รหัสผ่าน</label>
            <Password
              v-model="form.password"
              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
              class="w-full"
              :feedback="mode === 'register'"
              toggleMask
              input-class="w-full"
              :class="{ 'p-invalid': errors.password }"
            />
            <small v-if="errors.password" class="text-red-500">{{ errors.password }}</small>
          </div>

          <!-- Error message -->
          <div v-if="errorMsg" class="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
            {{ errorMsg }}
          </div>

          <!-- Submit -->
          <Button
            type="submit"
            :label="mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'"
            :loading="loading"
            class="w-full mt-2"
            size="large"
          />
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  email: '',
  password: '',
  displayName: ''
})

const errors = reactive({
  email: '',
  password: '',
  displayName: ''
})

function validate(): boolean {
  errors.email = ''
  errors.password = ''
  errors.displayName = ''
  let valid = true
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'กรุณากรอกอีเมลที่ถูกต้อง'
    valid = false
  }
  if (!form.password || form.password.length < 6) {
    errors.password = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
    valid = false
  }
  if (mode.value === 'register' && !form.displayName.trim()) {
    errors.displayName = 'กรุณากรอกชื่อ'
    valid = false
  }
  return valid
}

async function handleSubmit() {
  if (!validate()) return
  errorMsg.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await authStore.login(form.email, form.password)
    } else {
      await authStore.register(form.email, form.password, form.displayName)
    }
    router.push('/dashboard')
  } catch (err: any) {
    const codes: Record<string, string> = {
      'auth/user-not-found': 'ไม่พบบัญชีผู้ใช้นี้',
      'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
      'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/email-already-in-use': 'อีเมลนี้ถูกใช้งานแล้ว',
      'auth/too-many-requests': 'ลองใหม่อีกครั้งภายหลัง'
    }
    errorMsg.value = codes[err.code] ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่'
  } finally {
    loading.value = false
  }
}
</script>
