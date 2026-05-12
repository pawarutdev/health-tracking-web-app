<template>
  <div class="app-layout min-h-screen bg-gray-50 font-thai">
    <!-- Sidebar Overlay -->
    <Transition name="fade">
      <div
        v-if="sidebarOpen"
        class="fixed inset-0 z-40 bg-black/40"
        @click="sidebarOpen = false"
      />
    </Transition>

    <!-- Sidebar Panel (slides from right) -->
    <Transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="fixed top-0 right-0 z-50 h-full w-56 bg-white shadow-2xl flex flex-col"
        style="padding-top: env(safe-area-inset-top)"
      >
        <!-- User Info Header -->
        <div class="sidebar-user-header relative px-5 py-5 text-white shrink-0 overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10" />
          <div class="absolute -bottom-12 -left-8 w-28 h-28 rounded-full bg-white/5" />
          <div class="relative flex items-center gap-3">
            <div
              class="w-14 h-14 rounded-full overflow-hidden bg-white/25 flex items-center justify-center text-white font-bold text-lg shrink-0 ring-2 ring-white/40 shadow-md"
            >
              <img v-if="avatarUrl" :src="avatarUrl" class="w-full h-full object-cover" />
              <span v-else>{{ userInitial }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div v-if="displayName" class="text-sm font-semibold truncate drop-shadow-sm">{{ displayName }}</div>
              <div class="text-[10px] text-white/80 truncate">{{ authStore.user?.email }}</div>
            </div>
            <button class="relative p-2 rounded-full bg-white/10 hover:bg-white/25 transition" title="ปิด" @click="sidebarOpen = false">
              <i class="pi pi-times text-sm" />
            </button>
          </div>
        </div>

        <!-- Nav Items -->
        <nav class="flex-1 overflow-y-auto py-3">
          <div class="flex flex-col gap-2 px-3">
            <button
              v-for="item in navItems"
              :key="item.to"
              type="button"
              class="flex items-center gap-3 py-3 px-4 rounded-xl transition-colors text-left"
              :class="route.path === item.to ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-gray-700 hover:bg-gray-50 border border-transparent'"
              @click="navigate(item.to)"
            >
              <span class="text-xl leading-none w-6 text-center">{{ item.emoji }}</span>
              <span class="text-sm font-medium">{{ item.label }}</span>
            </button>
          </div>

          <!-- Edit profile -->
          <div
            class="mt-3 mx-3 flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer transition-colors text-blue-600  hover:bg-blue-50"
            @click="openProfile"
          >
            <i class="pi pi-user-edit" />
            <span class="text-sm font-medium">แก้ไขโปรไฟล์</span>
          </div>

          <!-- Logout -->
          <div
            class="mt-2 mx-3 flex items-center gap-2 px-3 py-3 rounded-xl cursor-pointer transition-colors text-red-500  hover:bg-red-50"
            @click="handleLogout"
          >
            <i class="pi pi-sign-out" />
            <span class="text-sm font-medium">ออกจากระบบ</span>
          </div>
        </nav>
      </aside>
    </Transition>

    <!-- Main Content -->
    <main class="main-content pb-20">
      <div class="container-mobile">
        <slot />
      </div>
    </main>

    <!-- Bottom Navigation -->
    <BottomNav @toggle-menu="sidebarOpen = !sidebarOpen" />

    <!-- Toast -->
    <Toast position="top-center" />
    <ConfirmDialog />

    <!-- Profile Edit Dialog -->
    <Dialog
      v-model:visible="profileDialogOpen"
      modal
      header="แก้ไขโปรไฟล์"
      :style="{ width: '92vw', maxWidth: '420px' }"
      :draggable="false"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col items-center gap-3">
          <div class="w-24 h-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-2 border-blue-200">
            <img v-if="profileForm.photoBase64" :src="profileForm.photoBase64" class="w-full h-full object-cover" />
            <i v-else class="pi pi-user text-blue-400 text-4xl" />
          </div>
          <div class="flex gap-2">
            <Button label="เลือกรูป" icon="pi pi-image" severity="secondary" outlined size="small" @click="avatarInput?.click()" />
            <Button
              v-if="profileForm.photoBase64"
              label="ลบรูป"
              icon="pi pi-trash"
              severity="danger"
              outlined
              size="small"
              @click="profileForm.photoBase64 = ''"
            />
            <input
              ref="avatarInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarChange"
            />
          </div>
          <p class="text-[11px] text-gray-400">รูปจะถูกย่อและเก็บเป็น base64 ขนาดสูงสุด 256×256</p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">ชื่อที่แสดง</label>
          <InputText v-model="profileForm.displayName" placeholder="ชื่อของคุณ" class="w-full" />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-gray-600">อีเมล</label>
          <InputText :model-value="authStore.user?.email ?? ''" disabled class="w-full" />
        </div>

        <!-- Theme toggle -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div class="flex items-center gap-3">
            <i :class="themeStore.mode === 'dark' ? 'pi pi-moon text-indigo-400' : 'pi pi-sun text-amber-500'" class="text-xl" />
            <div class="flex flex-col">
              <span class="text-[11px] text-gray-500">{{ themeStore.mode === 'dark' ? '🌙 โหมดมืด' : '☀️ โหมดสว่าง' }}</span>
            </div>
          </div>
          <ToggleSwitch :model-value="themeStore.mode === 'dark'" @update:model-value="(v: boolean) => themeStore.set(v ? 'dark' : 'light')" />
        </div>

        <div class="flex gap-2 mt-2">
          <Button label="ยกเลิก" severity="secondary" class="flex-1" @click="profileDialogOpen = false" />
          <Button :label="savingProfile ? 'กำลังบันทึก...' : 'บันทึก'" icon="pi pi-check" :loading="savingProfile" class="flex-1" @click="saveProfile" />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import ToggleSwitch from 'primevue/toggleswitch'
import { useToast } from 'primevue/usetoast'
import BottomNav from './BottomNav.vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const profileStore = useProfileStore()
const themeStore = useThemeStore()

const sidebarOpen = ref(false)
const profileDialogOpen = ref(false)
const savingProfile = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const profileForm = reactive<{ displayName: string; photoBase64: string }>({
  displayName: '',
  photoBase64: ''
})

const routeTitles: Record<string, string> = {
  dashboard: '🏠 แดชบอร์ด',
  daily: '📝 บันทึกประจำวัน',
  exercise: '🏃 ออกกำลังกาย',
  food: '🍚 บันทึกอาหาร',
  weight: '⚖️ น้ำหนัก',
  summary: '📋 สรุปทั้งหมด',
  recovery: '💤 สุขภาพ & ฟื้นฟู',
  bedtime: '🌙 ภาพรวมก่อนนอน',
  goals: '🎯 เป้าหมาย',
  reports: '📊 รายงาน',
  import: '📥 นำเข้าข้อมูล'
}

const navItems = [
  { to: '/summary', emoji: '📋', label: 'สรุป' },
  { to: '/goals', emoji: '🎯', label: 'เป้าหมาย' },
  { to: '/reports', emoji: '📊', label: 'รายงาน' },
  { to: '/import', emoji: '📥', label: 'นำเข้า' }
]

const pageTitle = computed(() => routeTitles[route.name as string] ?? 'Health Tracker')

const displayName = computed(
  () => profileStore.profile?.displayName || authStore.user?.displayName || ''
)
const avatarUrl = computed(
  () => profileStore.profile?.photoBase64 || authStore.user?.photoURL || ''
)
const userInitial = computed(() => {
  const name = displayName.value || authStore.user?.email || 'U'
  return name.charAt(0).toUpperCase()
})

function openProfile() {
  profileForm.displayName = displayName.value
  profileForm.photoBase64 = profileStore.profile?.photoBase64 || ''
  profileDialogOpen.value = true
  sidebarOpen.value = false
}

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    profileForm.photoBase64 = await compressToBase64(file, 256, 0.85)
  } catch {
    toast.add({ severity: 'error', summary: 'อ่านรูปไม่สำเร็จ', life: 2500 })
  }
  ;(e.target as HTMLInputElement).value = ''
}

function compressToBase64(file: File, maxSize: number, quality: number): Promise<string> {
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
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('image load failed'))
    }
    img.src = url
  })
}

async function saveProfile() {
  if (!profileForm.displayName.trim()) {
    toast.add({ severity: 'warn', summary: 'กรุณาระบุชื่อ', life: 2500 })
    return
  }
  savingProfile.value = true
  try {
    await profileStore.save({
      displayName: profileForm.displayName.trim(),
      photoBase64: profileForm.photoBase64
    })
    toast.add({ severity: 'success', summary: 'บันทึกโปรไฟล์แล้ว', life: 2500 })
    profileDialogOpen.value = false
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'บันทึกไม่สำเร็จ', detail: e?.message, life: 3500 })
  } finally {
    savingProfile.value = false
  }
}

function navigate(path: string) {
  router.push(path)
  sidebarOpen.value = false
}

async function handleLogout() {
  sidebarOpen.value = false
  await authStore.logout()
  profileStore.clear()
  router.push('/login')
  toast.add({ severity: 'info', summary: 'ออกจากระบบแล้ว', life: 2000 })
}

onMounted(() => {
  if (authStore.user) profileStore.fetch()
})

watch(
  () => authStore.user?.uid,
  (uid) => {
    if (uid) profileStore.fetch()
    else profileStore.clear()
  }
)
</script>

<style scoped>
.container-mobile {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
}

/* User header gradient (light) */
.sidebar-user-header {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 55%, #7c3aed 100%);
}
:global(html.dark) .sidebar-user-header {
  background: linear-gradient(135deg, #0538a6 0%, #3b34ad 55%, #000200 100%);
}

/* Sidebar slide-in from right */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

/* Overlay fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.28s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

