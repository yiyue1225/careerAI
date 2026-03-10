<template>
  <div ref="chartRef" style="width: 100%; height: 300px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  data: {
    indicator: Array<{ name: string; max: number }>
    series: Array<{ name: string; value: number[] }>
  }
}>()

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

onMounted(() => {
  chart = echarts.init(chartRef.value!)
  updateChart()
})

watch(() => props.data, updateChart, { deep: true })

function updateChart() {
  if (!chart) return
  const option = {
    radar: {
      indicator: props.data.indicator,
      center: ['50%', '50%'],
      radius: '60%',
    },
    series: props.data.series.map(s => ({
      name: s.name,
      type: 'radar',
      data: [{ value: s.value, name: s.name, areaStyle: { color: s.name === '学生' ? 'rgba(64,158,255,0.3)' : 'rgba(245,108,108,0.3)' } }],
    })),
    tooltip: {},
    legend: { show: true, bottom: 0 },
  }
  chart.setOption(option)
}
</script>