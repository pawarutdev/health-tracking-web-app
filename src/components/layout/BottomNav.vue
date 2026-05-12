<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
    style="padding-bottom: env(safe-area-inset-bottom)"
  >
    <div class="flex justify-around items-center h-16 max-w-lg mx-auto">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
        :class="isActive(item.to) ? 'text-blue-600' : 'text-gray-500'"
      >
        <i :class="[item.icon, 'text-xl']" />
        <span class="text-xs font-medium">{{ item.label }}</span>
      </router-link>

      <button
        type="button"
        class="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-gray-500 hover:text-blue-600 transition-colors"
        @click="emit('toggleMenu')"
      >
        <i class="pi pi-bars text-xl" />
        <span class="text-xs font-medium">เมนู</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const emit = defineEmits<{ toggleMenu: [] }>()

const navItems = [
  { to: '/dashboard', icon: 'pi pi-home', label: 'หน้าหลัก' },
  { to: '/exercise', icon: 'pi pi-bolt', label: 'กิจกรรม' },
  { to: '/food', icon: 'pi pi-apple', label: 'อาหาร' },
  { to: '/bedtime', icon: 'pi pi-moon', label: 'ก่อนนอน' }
]

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
