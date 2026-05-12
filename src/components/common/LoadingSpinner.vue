<template>
  <div class="flex items-center justify-center py-8">
    <div class="flex flex-col items-center gap-3">
      <div class="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      <span class="text-sm text-gray-500">{{ message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), {
  message: 'กำลังโหลด...'
})
</script>
