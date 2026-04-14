<template>
  <div v-if="position" class="position-detail">
    <el-page-header @back="$router.back()" content="岗位详情" />

    <el-card class="detail-card" v-loading="!position.name">
      <div class="header-section">
        <h2>{{ position.name || '加载中...' }}</h2>
        <p class="info-text">
          {{ position.company || '未知公司' }} | 
          {{ position.industry || '未知行业' }} | 
          {{ position.location || '未知地点' }}
        </p>
        <p class="salary">{{ position.salary || '薪资面议' }}</p>
      </div>

      <el-divider />

      <section class="info-block">
        <h3>岗位描述</h3>
        <p class="desc-content">{{ position.description || '暂无详细描述' }}</p>
      </section>

      <section class="info-block">
        <h3>任职要求</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="专业技能">
            <template v-if="position.requirements?.professionalSkills?.length">
              <el-tag
                v-for="s in position.requirements.professionalSkills"
                :key="s"
                class="skill-tag skill-tag-clickable"
                @click="goToPositionsWithSkill(s)"
                title="点击查看需要该技能的岗位"
              >
                {{ s }}
              </el-tag>
            </template>
            <span v-else class="text-secondary">暂无具体技能要求</span>
          </el-descriptions-item>

          <el-descriptions-item label="证书要求">
            {{ position.requirements?.certificates?.join('、') || '无' }}
          </el-descriptions-item>

          <el-descriptions-item label="创新能力">
            {{ position.requirements?.innovation ?? 0 }} / 5
          </el-descriptions-item>
          
          <el-descriptions-item label="学习能力">
            {{ position.requirements?.learningAbility ?? 0 }} / 5
          </el-descriptions-item>
          
          <el-descriptions-item label="抗压能力">
            {{ position.requirements?.stressTolerance ?? 0 }} / 5
          </el-descriptions-item>
          
          <el-descriptions-item label="沟通能力">
            {{ position.requirements?.communication ?? 0 }} / 5
          </el-descriptions-item>

          <el-descriptions-item label="实习经验" :span="2">
            {{ position.requirements?.internship?.join('；') || '无要求' }}
          </el-descriptions-item>
        </el-descriptions>
      </section>

      <el-row :gutter="20" class="charts-section">
        <el-col :span="12">
          <h3>能力要求雷达图</h3>
          <div class="chart-container">
            <div v-if="hasDimensions" style="height:360px;width:100%">
              <RadarChart :data="radarData" />
            </div>
            <el-empty v-else description="暂无能力维度数据" :image-size="80" />
          </div>
        </el-col>
        <el-col :span="12">
          <h3>岗位关联图谱</h3>
          <div class="chart-container">
            <RelationGraph :nodes="graph.nodes" :links="graph.links" />
          </div>
        </el-col>
      </el-row>
      
      <div class="footer-actions">
        <el-button type="primary" size="large" @click="$router.push('/match')">开始人岗匹配</el-button>
        <el-button link @click="$router.push('/positions')">返回列表</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { graphData } from '@/mock/graph'
import RadarChart from '@/components/RadarChart.vue'
import RelationGraph from '@/components/RelationGraph.vue'

const route = useRoute()
const router = useRouter()

// 1. 初始化一个结构完整的对象，避免初次渲染时访问深度属性报错
const position = ref<any>({
  name: '',
  company: '',
  requirements: {
    professionalSkills: [],
    certificates: [],
    internship: []
  },
  dimensions: {}
})

// 获取详情的方法 —— 直接用 /api/positions/:id，无需遍历分页
const fetchDetail = async () => {
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? '';
    const res = await axios.get(`${baseURL}/api/positions/${route.params.id}`)
    if (res.data.code === 0) {
      const target = res.data.data
      position.value = {
        ...target,
        requirements: target.requirements || { professionalSkills: [], certificates: [], internship: [] },
        dimensions: target.dimensions || {}
      }
    }
  } catch (error) {
    console.error("获取详情失败:", error)
  }
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) fetchDetail()
}, { immediate: true })


const hasDimensions = computed(() => {
  const d = position.value?.dimensions || {}
  return Object.values(d).some((v: any) => v > 0)
})

const radarData = computed(() => {
  const d = position.value?.dimensions || {}
  return {
    indicator: [
      { name: '专业技能', max: 100 }, // 对应 d.professional
      { name: '证书要求', max: 100 }, // 对应 d.certificate
      { name: '创新能力', max: 100 }, // 对应 d.innovation
      { name: '学习能力', max: 100 }, // 对应 d.learning
      { name: '抗压能力', max: 100 }, // 对应 d.stress
      { name: '沟通能力', max: 100 }, // 对应 d.communication
      { name: '实习经验', max: 100 }  // 对应 d.internship
    ],
    series: [{
      name: '能力画像',
      type: 'radar',
      // 这个数组的数值顺序必须和上面的 indicator 顺序完全一致！
      data: [[
        d.professional || 0,
        d.certificate || 0,
        d.innovation || 0,
        d.learning || 0,
        d.stress || 0,
        d.communication || 0,
        d.internship || 0
      ]]
    }]
  }
})

const goToPositionsWithSkill = (skill: string) => {
  // 用专用 skill 参数，后端用 JSON_CONTAINS 匹配 professionalSkills
  router.push({ path: '/positions', query: { skill } })
}

const graph = computed(() => {
  const currentName = position.value?.name || '未知岗位';
  
  // 基础节点：中心是当前岗位，周围是核心维度
  return {
    nodes: [
      { id: '0', name: currentName, symbolSize: 80, itemStyle: { color: '#409EFF' } },
      { id: '1', name: '专业背景', symbolSize: 50 },
      { id: '2', name: '核心技能', symbolSize: 50 },
      { id: '3', name: '行业领域', symbolSize: 50 },
      { id: '4', name: '发展空间', symbolSize: 50 },
    ],
    links: [
      { source: '0', target: '1' },
      { source: '0', target: '2' },
      { source: '0', target: '3' },
      { source: '0', target: '4' },
    ]
  };
});
</script>

<style scoped>
.position-detail {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.detail-card {
  margin-top: 20px;
  border-radius: 12px;
}
.salary {
  font-size: 24px;
  color: #f56c6c;
  font-weight: bold;
  margin: 10px 0;
}
.info-text {
  color: #606266;
}
.info-block {
  margin-bottom: 30px;
}
.desc-content {
  line-height: 1.8;
  color: #303133;
  white-space: pre-wrap;
}
.skill-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}
.skill-tag-clickable {
  cursor: pointer;
  transition: all 0.2s;
}
.skill-tag-clickable:hover {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(64,158,255,0.4);
}
.charts-section {
  margin-top: 40px;
}
.chart-container {
  height: 400px;
  background: #fcfcfc;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.footer-actions {
  margin-top: 40px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}
.text-secondary {
  color: #909399;
  font-style: italic;
}
</style>