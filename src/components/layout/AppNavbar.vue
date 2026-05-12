<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white shadow-md" style="padding-top: env(safe-area-inset-top)">
    <div class="flex items-center gap-3 px-4 h-14">
      <button
        class="p-2 -ml-1 rounded-full hover:bg-blue-700 transition"
        @click="emit('toggleSidebar')"
      >
        <i class="pi pi-bars text-white text-lg" />
      </button>
      <h1 class="text-base font-semibold truncate flex-1">{{ title }}</h1>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
const emit = defineEmits<{ toggleSidebar: [] }>()
</script>
