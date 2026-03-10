<template>
  <div ref="graphRef" style="width: 100%; height: 400px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps<{
  nodes: any[]
  links: any[]
}>()

const graphRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null

onMounted(() => {
  chart = echarts.init(graphRef.value!)
  updateGraph()
})

function updateGraph() {
  if (!chart) return
  const categories = [
    { name: '初级', itemStyle: { color: '#67c23a' } },
    { name: '中级', itemStyle: { color: '#e6a23c' } },
    { name: '高级', itemStyle: { color: '#f56c6c' } },
    { name: '管理', itemStyle: { color: '#909399' } },
    { name: '换岗', itemStyle: { color: '#409eff' } },
  ]
  const option = {
    tooltip: {},
    legend: { data: categories.map(c => c.name), bottom: 0 },
    series: [
      {
        type: 'graph',
        layout: 'force',
        symbolSize: 50,
        roam: true,
        label: { show: true, position: 'bottom' },
        edgeSymbol: ['none', 'arrow'],
        edgeLabel: { fontSize: 10 },
        categories,
        data: props.nodes.map(node => ({
          ...node,
          category: node.category,
          itemStyle: { color: categories.find(c => c.name === node.category)?.itemStyle.color },
        })),
        links: props.links.map(link => ({
          source: link.source,
          target: link.target,
          label: { show: true, formatter: link.type === 'promotion' ? '晋升' : '转换' },
          lineStyle: { color: link.type === 'promotion' ? '#f56c6c' : '#409eff', width: 2, curveness: 0.2 },
        })),
        force: { repulsion: 1000, edgeLength: 200 },
      },
    ],
  }
  chart.setOption(option)
}
</script>