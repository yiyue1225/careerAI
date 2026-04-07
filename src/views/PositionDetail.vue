<template>
  <div v-if="position" class="position-detail">
    <el-page-header @back="$router.back()" content="岗位详情" />
    <el-card class="detail-card">
      <h2>{{ position.name }}</h2>
      <p>{{ position.company }} | {{ position.industry }} | {{ position.location }}</p>
      <p class="salary">{{ position.salary }}</p>
      <el-divider />
      <h3>岗位描述</h3>
      <p>{{ position.description }}</p>
      <h3>任职要求</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="专业技能">
          <el-tag v-for="s in position.requirements.professionalSkills" :key="s">{{ s }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="证书要求">
          {{ position.requirements.certificates.join('、') || '无' }}
        </el-descriptions-item>
        <el-descriptions-item label="创新能力">{{ position.requirements.innovation }} /5</el-descriptions-item>
        <el-descriptions-item label="学习能力">{{ position.requirements.learningAbility }} /5</el-descriptions-item>
        <el-descriptions-item label="抗压能力">{{ position.requirements.stressTolerance }} /5</el-descriptions-item>
        <el-descriptions-item label="沟通能力">{{ position.requirements.communication }} /5</el-descriptions-item>
        <el-descriptions-item label="实习经验">{{ position.requirements.internship.join('；') }}</el-descriptions-item>
      </el-descriptions>
      <h3>能力要求雷达图</h3>
      <RadarChart :data="radarData" />
      <h3>岗位关联图谱</h3>
      <RelationGraph :nodes="graph.nodes" :links="graph.links" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue' // 引入 watch 和 ref
import { useRoute } from 'vue-router'
import axios from 'axios'
import { graphData } from '@/mock/graph'
import RadarChart from '@/components/RadarChart.vue'
import RelationGraph from '@/components/RelationGraph.vue'

const route = useRoute()
const position = ref<any>(null) 

// 封装获取详情的方法
const fetchDetail = async () => {
  try {
    // 保持和列表页一样的 baseURL 逻辑
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    const res = await axios.get(`${baseURL}/api/positions`)
    
    if (res.data.code === 0) {
      // 从后端返回的数组中匹配当前 ID
      const target = res.data.data.find((p: any) => String(p.id) === String(route.params.id))
      if (target) {
        position.value = target
      } else {
        console.error("未找到该岗位详情")
      }
    }
  } catch (error) {
    console.error("获取详情失败:", error)
  }
}

// 当你从一个岗位跳到另一个岗位时，这个监听能确保页面刷新
watch(() => route.params.id, () => {
  fetchDetail()
}, { immediate: true })

const radarData = computed(() => {
  // 增加严谨判断，防止后端数据缺失 dimensions 导致报错
  if (!position.value || !position.value.dimensions) return { indicator: [], series: [] }
  
  const dims = position.value.dimensions
  return {
    indicator: [
      { name: '专业技能', max: 100 },
      { name: '证书要求', max: 100 },
      { name: '创新能力', max: 100 },
      { name: '学习能力', max: 100 },
      { name: '抗压能力', max: 100 },
      { name: '沟通能力', max: 100 },
      { name: '实习经验', max: 100 },
    ],


    series: [{ 
      name: position.value.name, 
      value: [
        dims.professional || 0,
        dims.certificate || 0,
        dims.innovation || 0,
        dims.learning || 0,
        dims.stress || 0,
        dims.communication || 0,
        dims.internship || 0
      ] 
    }],
  }
})

const graph = graphData
</script>
</script>