<template>
  <div ref="graphRef" style="width: 100%; height: 400px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
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

// 监听props变化
watch(() => [props.nodes, props.links], () => {
  updateGraph()
}, { deep: true })

function updateGraph() {
  if (!chart) return

  const nodes = props.nodes && props.nodes.length > 0 ? props.nodes : [
    { id: '0', name: 'Java后端工程师', category: '当前', value: 100, itemStyle: { color: '#409EFF' } },
    { id: '1', name: '高级Java工程师', category: '晋升', value: 80, itemStyle: { color: '#67c23a' } },
    { id: '2', name: '技术主管', category: '晋升', value: 70, itemStyle: { color: '#67c23a' } },
    { id: '3', name: '技术总监', category: '晋升', value: 60, itemStyle: { color: '#67c23a' } },
    { id: '4', name: '产品经理', category: '转换', value: 70, itemStyle: { color: '#e6a23c' } },
    { id: '5', name: '解决方案架构师', category: '转换', value: 70, itemStyle: { color: '#e6a23c' } },
  ]

  const links = props.links && props.links.length > 0 ? props.links : [
    { source: '0', target: '1', label: '晋升路径', type: 'promotion' },
    { source: '1', target: '2', label: '晋升路径', type: 'promotion' },
    { source: '2', target: '3', label: '晋升路径', type: 'promotion' },
    { source: '0', target: '4', label: '转换方向', type: 'transform' },
    { source: '0', target: '5', label: '转换方向', type: 'transform' },
  ]

  // 动态创建分类
  const categories = [
    { name: '当前', itemStyle: { color: '#409EFF' } },
    { name: '晋升', itemStyle: { color: '#67c23a' } },
    { name: '转换', itemStyle: { color: '#e6a23c' } },
  ]

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.componentSubType === 'graph') {
          return `<div style="font-size:13px;font-weight:bold">${params.data?.name || '岗位'}</div>`
        }
        return params.value || ''
      }
    },
    legend: {
      data: categories.map(c => c.name),
      bottom: 10,
      textStyle: { fontSize: 12 },
      itemGap: 15,
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        symbolSize: 60,
        roam: true,
        label: {
          show: true,
          position: 'bottom',
          fontSize: 12,
          color: '#333',
          formatter: '{b}',
          distance: 8,
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 16],
        edgeLabel: {
          fontSize: 11,
          distance: 8,
          color: '#666',
          backgroundColor: '#fff',
          borderRadius: 3,
          padding: [2, 4],
        },
        categories,
        data: nodes.map((node: any) => {
          // 获取节点的颜色
          const nodeColor = node.itemStyle?.color || '#409EFF'
          return {
            id: node.id || node.name,
            name: node.name,
            category: node.category,  // 保留category用于图例
            itemStyle: {
              color: nodeColor,
              borderColor: '#fff',
              borderWidth: 2,
            },
            label: {
              show: true,
              position: 'bottom',
              fontSize: 12,
              formatter: '{b}',
              distance: 8,
              color: '#333',
            },
          }
        }),
        links: links.map((link: any) => {
          const isPromotion = link.type === 'promotion'
          return {
            source: typeof link.source === 'number' ? nodes[link.source]?.id || link.source : link.source,
            target: typeof link.target === 'number' ? nodes[link.target]?.id || link.target : link.target,
            label: {
              show: true,
              formatter: link.label || (isPromotion ? '晋升' : '转换'),
              distance: 10,
              color: isPromotion ? '#f56c6c' : '#409eff',
              fontSize: 11,
              fontWeight: 'bold',
              backgroundColor: '#fff',
              borderRadius: 3,
              padding: [3, 6],
              borderWidth: 1,
              borderColor: isPromotion ? '#f56c6c' : '#409eff',
            },
            lineStyle: {
              color: isPromotion ? '#f56c6c' : '#409eff',
              width: 2.5,
              curveness: 0.15,
              type: isPromotion ? 'solid' : 'dashed',
            },
          }
        }),
        force: {
          repulsion: 1500,
          edgeLength: 280,
          gravity: 0.08,
        },
      },
    ],
  }
  chart.setOption(option, true)
}
</script>