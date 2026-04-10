<template>
  <div ref="chartRef" style="width: 100%; height: 400px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  data: {
    indicator: Array<{ name: string; max: number }>
    // 这里统一一下格式，建议用 Array<{ name: string; data: number[] }> 
    // 或者直接按照你之前 PositionDetail 传过来的结构处理
    series: Array<{ name: string; type?: string; data: number[][] }>
  }
}>()

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

// 核心配置逻辑
function updateChart() {
  if (!chart) return
  
  // 防御性编程：如果数据还没传过来，直接返回，避免报错
  if (!props.data || !props.data.indicator || props.data.indicator.length === 0) {
    return
  }

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      bottom: '5',
      data: props.data.series.map(s => s.name)
    },
    radar: {
      indicator: props.data.indicator,
      center: ['50%', '50%'],
      radius: '65%',
      shape: 'polygon',
      axisName: {
        color: '#666',
        borderRadius: 3,
        padding: [3, 5]
      },
      splitArea: {
        areaStyle: {
          color: ['#fff', '#f6f6f6']
        }
      }
    },
    series: props.data.series.map(s => ({
      name: s.name,
      type: 'radar',
      // 注意：ECharts 雷达图的数据结构是 data: [{ value: [...] }]
      data: s.data.map(valArray => ({
        value: valArray,
        name: s.name,
        // 根据名称分配颜色，默认蓝色，对比色红色
        areaStyle: {
          color: s.name === '能力画像' ? 'rgba(64,158,255,0.4)' : 'rgba(245,108,108,0.4)'
        },
        lineStyle: {
          width: 2
        }
      })),
      symbol: 'circle',
      symbolSize: 6,
      // 开启数据更新动画
      animationDuration: 1000
    }))
  }
  
  // setOption 的第二个参数 true 表示不合并旧数据，完全覆盖（防止数据切换时残余旧线条）
  chart.setOption(option, true)
}

// 监听窗口大小变化，防止图表变形
const handleResize = () => {
  chart?.resize()
}

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
    window.addEventListener('resize', handleResize)
  }
})

// 深度监听数据变化
watch(() => props.data, () => {
  updateChart()
}, { deep: true })

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>