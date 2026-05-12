<template>
  <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
    <h3 class="text-sm font-semibold text-gray-600 mb-3">{{ title }}</h3>
    <v-chart
      class="w-full"
      :style="{ height: `${height}px` }"
      :option="option"
      :autoresize="true"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, DataZoomComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  title?: string
  dates: string[]
  weights: (number | null)[]
  targetWeight?: number
  height?: number
}>(), {
  title: 'แนวโน้มน้ำหนัก',
  height: 220
})

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      const p = params[0]
      return `${p.axisValue}<br/>${p.value != null ? p.value + ' kg' : 'ไม่มีข้อมูล'}`
    }
  },
  grid: { left: 40, right: 16, top: 16, bottom: 40 },
  xAxis: {
    type: 'category',
    data: props.dates,
    axisLabel: { fontSize: 10, color: '#6b7280' },
    axisLine: { lineStyle: { color: '#e5e7eb' } }
  },
  yAxis: {
    type: 'value',
    min: (value: { min: number }) => Math.floor(value.min - 1),
    max: (value: { max: number }) => Math.ceil(value.max + 1),
    axisLabel: { fontSize: 10, color: '#6b7280', formatter: '{value} kg' },
    splitLine: { lineStyle: { color: '#f3f4f6' } }
  },
  series: [
    {
      name: 'น้ำหนัก',
      type: 'line',
      data: props.weights,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: '#3b82f6', width: 2.5 },
      itemStyle: { color: '#3b82f6' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(59,130,246,0.25)' },
            { offset: 1, color: 'rgba(59,130,246,0.02)' }
          ]
        }
      },
      connectNulls: true,
      markLine: props.targetWeight
        ? {
            data: [{ yAxis: props.targetWeight, name: 'เป้าหมาย' }],
            lineStyle: { color: '#22c55e', type: 'dashed' },
            label: { formatter: 'เป้า: {c} kg', color: '#22c55e', fontSize: 10 },
            symbol: 'none'
          }
        : undefined
    }
  ]
}))
</script>
