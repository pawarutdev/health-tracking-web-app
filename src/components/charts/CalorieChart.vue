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
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = withDefaults(defineProps<{
  title?: string
  dates: string[]
  caloriesIn: number[]
  caloriesOut: number[]
  height?: number
}>(), {
  title: 'แคลอรี่รับเข้า / เผาผลาญ',
  height: 220
})

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      const lines = params.map((p: any) => `${p.seriesName}: ${p.value} kcal`)
      return [params[0].axisValue, ...lines].join('<br/>')
    }
  },
  legend: {
    bottom: 0,
    data: ['รับเข้า', 'เผาผลาญ'],
    textStyle: { fontSize: 11, color: '#6b7280' }
  },
  grid: { left: 44, right: 16, top: 16, bottom: 44 },
  xAxis: {
    type: 'category',
    data: props.dates,
    axisLabel: { fontSize: 10, color: '#6b7280' },
    axisLine: { lineStyle: { color: '#e5e7eb' } }
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 10, color: '#6b7280', formatter: '{value}' },
    splitLine: { lineStyle: { color: '#f3f4f6' } }
  },
  series: [
    {
      name: 'รับเข้า',
      type: 'bar',
      data: props.caloriesIn,
      barMaxWidth: 20,
      itemStyle: { color: '#f97316', borderRadius: [4, 4, 0, 0] }
    },
    {
      name: 'เผาผลาญ',
      type: 'bar',
      data: props.caloriesOut,
      barMaxWidth: 20,
      itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }
    }
  ]
}))
</script>
