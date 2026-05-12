<template>
  <div
    class="bg-white rounded-xl shadow-sm p-2.5 border border-gray-100"
    :class="colorClass"
  >
    <div class="flex items-center justify-between mb-1">
      <span class="text-[11px] text-gray-500 font-medium leading-tight">{{ label }}</span>
      <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0" :class="iconBg">
        <i :class="[icon, 'text-[11px]', iconColor]" />
      </div>
    </div>
    <div class="flex items-end gap-1">
      <span class="text-lg font-bold text-gray-800 leading-none">{{ displayValue }}</span>
      <span v-if="unit" class="text-[10px] text-gray-500 mb-0.5">{{ unit }}</span>
    </div>
    <div v-if="subtitle" class="text-[10px] mt-0.5 leading-tight" :class="subtitleColor">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  label: string
  value?: number | string | null
  unit?: string
  icon: string
  subtitle?: string
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'gray'
  subtitlePositive?: boolean
}>(), {
  color: 'blue'
})

const colorMap = {
  blue: { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', colorClass: '' },
  green: { iconBg: 'bg-green-100', iconColor: 'text-green-600', colorClass: '' },
  orange: { iconBg: 'bg-orange-100', iconColor: 'text-orange-600', colorClass: '' },
  red: { iconBg: 'bg-red-100', iconColor: 'text-red-600', colorClass: '' },
  purple: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', colorClass: '' },
  teal: { iconBg: 'bg-teal-100', iconColor: 'text-teal-600', colorClass: '' },
  gray: { iconBg: 'bg-gray-100', iconColor: 'text-gray-600', colorClass: '' }
}

const iconBg = computed(() => colorMap[props.color].iconBg)
const iconColor = computed(() => colorMap[props.color].iconColor)
const colorClass = computed(() => colorMap[props.color].colorClass)

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined) return '-'
  return props.value
})

const subtitleColor = computed(() => {
  if (props.subtitlePositive === undefined) return 'text-gray-400'
  return props.subtitlePositive ? 'text-green-600' : 'text-red-500'
})
</script>
