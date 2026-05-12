<template>
  <RouterView v-if="!authLoading" />
  <div v-else class="min-h-screen flex items-center justify-center bg-blue-50">
    <div class="flex flex-col items-center gap-4">
      <div class="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
        <i class="pi pi-heart text-blue-500 text-3xl animate-pulse" />
      </div>
      <p class="text-blue-600 font-medium font-thai">กำลังโหลด...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { loading: authLoading } = storeToRefs(authStore)

onMounted(() => authStore.init())
</script>
