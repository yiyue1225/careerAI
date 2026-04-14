<template>
  <div ref="chartRef" style="width: 100%; height: 100%; min-height: 300px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  data: {
    indicator: Array<{ name: string; max: number }>
    series: Array<{ name: string; type?: string; data: number[][] }>
  }
}>()

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

// 每条 series 的独立颜色（含渐变用的 rgba stops）
const PALETTE = [
  { color: '#5470c6', g0: 'rgba(84,112,198,0.65)', g1: 'rgba(84,112,198,0.06)' },
  { color: '#ee6666', g0: 'rgba(238,102,102,0.65)', g1: 'rgba(238,102,102,0.06)' },
  { color: '#91cc75', g0: 'rgba(145,204,117,0.65)', g1: 'rgba(145,204,117,0.06)' },
  { color: '#fac858', g0: 'rgba(250,200,88,0.65)',  g1: 'rgba(250,200,88,0.06)'  },
  { color: '#73c0de', g0: 'rgba(115,192,222,0.65)', g1: 'rgba(115,192,222,0.06)' },
]

// 核心配置逻辑
function updateChart() {
  if (!chart) return

  // 1. 如果数据不完整，显示空状态
  if (!props.data || !props.data.series || props.data.series.length === 0) {
    chart.setOption({
      title: {
        text: '暂无画像数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#909399', fontWeight: 'normal', fontSize: 14 }
      },
      series: []
    }, true)
    return
  }

  const allSeries = props.data.series
  const indicator = props.data.indicator

  // 2. 有数据时的正常逻辑
  const option = {
    color: PALETTE.map(p => p.color),
    tooltip: {
      trigger: 'item',
      enterable: false,
      formatter: () => {
        // 始终显示所有 series 的完整维度数值
        const COLORS = PALETTE.map(p => p.color)
        let html = '<div style="font-size:13px;line-height:1.8;min-width:200px">'
        indicator.forEach((ind: any, i: number) => {
          html += `<div><span style="color:#606266">${ind.name}</span>：`
          allSeries.forEach((s: any, si: number) => {
            const val = (s.data?.[0] || [])[i] ?? 0
            html += `<span style="color:${COLORS[si % COLORS.length]};font-weight:700;margin-left:10px">${val}</span>`
            if (allSeries.length > 1) {
              html += `<span style="color:#909399;font-size:11px"> ${s.name}</span>`
            }
          })
          html += '</div>'
        })
        html += '</div>'
        return html
      }
    },
    legend: {
      bottom: '5',
      data: allSeries.map((s: any) => s.name),
      textStyle: { fontSize: 13 },
      itemGap: 20,
    },
    radar: {
      indicator: indicator || [],
      splitNumber: 5,
      axisName: { color: '#555', fontSize: 12 },
      splitLine: { lineStyle: { color: ['#e4e7ed'] } },
      splitArea: { areaStyle: { color: ['rgba(255,255,255,0)', 'rgba(240,244,250,0.3)'] } },
    },
    series: allSeries.map((s: any, idx: number) => {
      const p = PALETTE[idx % PALETTE.length]
      return {
        name: s.name,
        type: 'radar',
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { color: p.color, width: 2 },
        itemStyle: { color: p.color },
        areaStyle: {
          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
            { offset: 0, color: p.g1 },   // 中心：浅
            { offset: 1, color: p.g0 },   // 边缘：深
          ])
        },
        data: (s.data || []).map((valArray: number[]) => ({
          value: valArray,
          name: s.name,
        })),
      }
    }),
  }
  chart.setOption(option, true)
}

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
  chart = null // 显式释放引用
})
</script>