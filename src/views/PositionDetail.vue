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

// 岗位发展路径映射表
const jobPathMap: Record<string, { promotion: string[], transform: string[] }> = {
  // 后端开发类
  'Java后端工程师': {
    promotion: ['高级Java工程师', '技术主管', '技术总监'],
    transform: ['产品经理', '解决方案架构师', '技术合伙人']
  },
  'Python后端开发工程师': {
    promotion: ['高级Python工程师', '技术主管', '技术总监'],
    transform: ['数据分析师', '产品经理', 'AI工程师']
  },
  'Node.js后端工程师': {
    promotion: ['高级Node.js工程师', '技术主管', '技术总监'],
    transform: ['全栈工程师', '产品经理', 'DevOps工程师']
  },
  '后端开发工程师': {
    promotion: ['高级后端工程师', '技术主管', '技术总监'],
    transform: ['产品经理', '架构师', '解决方案工程师']
  },

  // 前端开发类
  '前端开发工程师': {
    promotion: ['高级前端工程师', '技术主管', '技术总监'],
    transform: ['全栈工程师', '产品经理', '用户体验工程师']
  },
  'React开发工程师': {
    promotion: ['高级React工程师', '技术主管', '技术总监'],
    transform: ['全栈工程师', '产品经理', '架构师']
  },
  'Vue开发工程师': {
    promotion: ['高级Vue工程师', '技术主管', '技术总监'],
    transform: ['全栈工程师', '产品经理', '架构师']
  },

  // 数据相关
  '数据分析师': {
    promotion: ['高级数据分析师', '数据总监', '首席数据官'],
    transform: ['产品经理', '商业智能工程师', '数据科学家']
  },
  '大数据工程师': {
    promotion: ['高级大数据工程师', '大数据架构师', '数据总监'],
    transform: ['数据分析师', '机器学习工程师', '数据科学家']
  },
  '数据库管理员': {
    promotion: ['高级DBA', '数据库架构师', '技术总监'],
    transform: ['数据工程师', '云数据库专家', '解决方案架构师']
  },

  // 产品和运营
  '产品经理': {
    promotion: ['高级产品经理', '产品总监', '首席产品官'],
    transform: ['商业分析师', '项目经理', '创业者']
  },
  '运营经理': {
    promotion: ['高级运营经理', '运营总监', '首席运营官'],
    transform: ['产品经理', '数据分析师', '市场经理']
  },

  // 测试相关
  '测试工程师': {
    promotion: ['高级测试工程师', '测试主管', '质量总监'],
    transform: ['自动化测试工程师', '性能测试工程师', '产品经理']
  },
  '自动化测试工程师': {
    promotion: ['高级自动化测试工程师', '测试架构师', '测试总监'],
    transform: ['后端开发工程师', 'DevOps工程师', '质量保证经理']
  },

  // 运维和基础设施
  'DevOps工程师': {
    promotion: ['高级DevOps工程师', 'DevOps架构师', '技术总监'],
    transform: ['云解决方案架构师', '系统工程师', '基础设施经理']
  },
  '系统管理员': {
    promotion: ['高级系统管理员', '系统架构师', '运维总监'],
    transform: ['DevOps工程师', '云计算工程师', '安全工程师']
  },
  '网络工程师': {
    promotion: ['高级网络工程师', '网络架构师', '技术总监'],
    transform: ['网络安全工程师', 'DevOps工程师', '系统架构师']
  },

  // 安全相关
  '安全工程师': {
    promotion: ['高级安全工程师', '安全架构师', '首席安全官'],
    transform: ['渗透测试工程师', '安全研究员', '信息安全总监']
  },
  '安全运维工程师': {
    promotion: ['安全架构师', '安全总监', '首席信息安全官'],
    transform: ['安全工程师', '合规官', '风险管理专家']
  },

  // 架构和技术专家
  '技术架构师': {
    promotion: ['首席架构师', '技术VP', '首席技术官'],
    transform: ['产品总监', '技术总监', '咨询顾问']
  },
  '解决方案架构师': {
    promotion: ['首席解决方案架构师', '技术总监', '技术VP'],
    transform: ['产品经理', '咨询顾问', '项目经理']
  },

  // 机器学习和AI
  '机器学习工程师': {
    promotion: ['高级机器学习工程师', '算法架构师', '首席AI官'],
    transform: ['数据科学家', '产品经理', '研究科学家']
  },
  '算法工程师': {
    promotion: ['高级算法工程师', '算法架构师', '技术总监'],
    transform: ['机器学习工程师', '产品经理', '数据科学家']
  },

  // 移动开发
  'iOS开发工程师': {
    promotion: ['高级iOS工程师', '移动技术主管', '技术总监'],
    transform: ['全栈工程师', '产品经理', '架构师']
  },
  'Android开发工程师': {
    promotion: ['高级Android工程师', '移动技术主管', '技术总监'],
    transform: ['全栈工程师', '产品经理', '架构师']
  },

  // 项目和管理
  '项目经理': {
    promotion: ['高级项目经理', '项目总监', '首席项目官'],
    transform: ['产品经理', '资深顾问', '运营总监']
  },
  'Scrum Master': {
    promotion: ['高级Scrum Master', '敏捷教练', '敏捷总监'],
    transform: ['项目经理', '产品经理', '组织变革专家']
  },
}

const graph = computed(() => {
  const currentName = position.value?.name || '未知岗位'

  // 查找当前岗位的发展路径
  let pathInfo = jobPathMap[currentName]

  // 如果完全匹配不到，尝试模糊匹配（包含关键词）
  if (!pathInfo) {
    const keys = Object.keys(jobPathMap)
    const matched = keys.find(k =>
      currentName.includes(k.split('').slice(0, 3).join('')) ||
      k.includes(currentName.split('').slice(0, 3).join(''))
    )
    pathInfo = matched ? jobPathMap[matched] : null
  }

  // 如果仍未找到，使用默认路径
  if (!pathInfo) {
    pathInfo = {
      promotion: ['高级岗位', '管理岗位', '专家级别'],
      transform: ['产品方向', '管理方向', '创业方向']
    }
  }

  // 构建节点和链接
  const nodes: any[] = [
    { id: '0', name: currentName, category: '当前', value: 100, itemStyle: { color: '#409EFF' } }
  ]
  const links: any[] = []

  let nodeId = 1

  // 添加晋升路径节点
  pathInfo.promotion.forEach((job, idx) => {
    nodes.push({
      id: String(nodeId),
      name: job,
      category: '晋升',
      value: 80 - idx * 10,
      itemStyle: { color: '#67c23a' }
    })
    links.push({
      source: idx === 0 ? '0' : String(nodeId - 1),
      target: String(nodeId),
      label: '晋升路径',
      type: 'promotion'
    })
    nodeId++
  })

  // 添加转换方向节点
  pathInfo.transform.forEach((job, idx) => {
    nodes.push({
      id: String(nodeId),
      name: job,
      category: '转换',
      value: 70,
      itemStyle: { color: '#e6a23c' }
    })
    links.push({
      source: '0',
      target: String(nodeId),
      label: '转换方向',
      type: 'transform'
    })
    nodeId++
  })

  return { nodes, links }
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