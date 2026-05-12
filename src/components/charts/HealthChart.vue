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
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  title?: string
  dates: string[]
  sleep?: number[]
  stress?: number[]
  bodyBattery?: number[]
  height?: number
}>(), {
  title: 'การนอนหลับ & ความเครียด',
  height: 220
})

const option = computed(() => {
  const series: any[] = []
  if (props.sleep?.length) {
    series.push({
      name: 'การนอนหลับ (ชม.)',
      type: 'line',
      data: props.sleep,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#8b5cf6', width: 2 },
      itemStyle: { color: '#8b5cf6' },
      connectNulls: true
    })
  }
  if (props.stress?.length) {
    series.push({
      name: 'ความเครียด',
      type: 'line',
      data: props.stress,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#ef4444', width: 2 },
      itemStyle: { color: '#ef4444' },
      connectNulls: true
    })
  }
  if (props.bodyBattery?.length) {
    series.push({
      name: 'Body Battery',
      type: 'line',
      data: props.bodyBattery,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#22c55e', width: 2 },
      itemStyle: { color: '#22c55e' },
      connectNulls: true
    })
  }
  return {
    tooltip: { trigger: 'axis' },
    legend: {
      bottom: 0,
      textStyle: { fontSize: 10, color: '#6b7280' }
    },
    grid: { left: 36, right: 16, top: 16, bottom: 48 },
    xAxis: {
      type: 'category',
      data: props.dates,
      axisLabel: { fontSize: 10, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 10, color: '#6b7280' },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series
  }
})
</script>
