<template>
  <div class="match-report">
    <!-- 无简历提示 -->
    <el-result
      v-if="!studentProfile"
      icon="warning"
      title="请先上传简历"
      sub-title="职业匹配分析需要先完成能力画像解析"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/profile')">前往上传简历</el-button>
      </template>
    </el-result>

    <template v-else>
      <!-- 步骤指示器 -->
      <el-steps :active="activeStep" finish-status="success" class="steps-bar" align-center>
        <el-step title="选择岗位" description="搜索目标岗位" />
        <el-step title="匹配分析" description="能力差距对比" />
        <el-step title="发展路径" description="职业成长图谱" />
        <el-step title="行动计划" description="个性化学习路径" />
      </el-steps>

      <!-- ===================== 步骤 0：选择岗位 ===================== -->
      <div v-if="activeStep === 0" class="step-pane">
        <div class="step0-header">
          <h3>搜索并选择目标岗位</h3>
          <p class="step-hint">从 {{ totalCount.toLocaleString() }}+ 个岗位中选择你的目标</p>
        </div>

        <div class="search-bar">
          <el-input
            v-model="posSearch"
            placeholder="输入岗位名称搜索（如：Java、产品经理、数据分析）"
            size="large"
            clearable
            @input="onSearchInput"
            @clear="onSearchInput"
            style="max-width: 600px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>

        <div v-loading="searchLoading" class="pos-results">
          <el-empty v-if="searchResults.length === 0 && !searchLoading" description="暂无结果，换个关键词试试" :image-size="80" />
          <div
            v-for="pos in searchResults"
            :key="pos.id"
            :class="['pos-item', selectedPositionId === pos.id ? 'pos-item-selected' : '']"
            @click="selectPosition(pos)"
          >
            <div class="pos-item-body">
              <h4>{{ pos.name }}</h4>
              <p>{{ pos.company }} · {{ pos.location }} · <span class="salary-text">{{ pos.salary }}</span></p>
              <div class="pos-skills">
                <el-tag v-for="s in (pos.requirements?.professionalSkills || []).slice(0,4)" :key="s" size="small" effect="plain">{{ s }}</el-tag>
              </div>
            </div>
            <div class="pos-item-match">
              <el-progress
                type="dashboard"
                :percentage="calcMatchScore(studentProfile.dimensions, pos.dimensions || {})"
                :color="matchColors"
                :width="70"
                :stroke-width="6"
              />
              <span class="match-label">匹配度</span>
            </div>
            <el-icon v-if="selectedPositionId === pos.id" class="selected-check"><CircleCheckFilled /></el-icon>
          </div>
        </div>

        <div class="step-actions">
          <el-button
            type="primary"
            size="large"
            :disabled="!selectedPositionId"
            @click="goToAnalysis"
            round
          >
            开始匹配分析 →
          </el-button>
        </div>
      </div>

      <!-- ===================== 步骤 1：匹配分析 ===================== -->
      <div v-if="activeStep === 1" class="step-pane">
        <el-row :gutter="24">
          <!-- 左：雷达图 -->
          <el-col :span="14">
            <el-card shadow="hover" class="radar-card">
              <template #header>
                <div class="card-header-flex">
                  <span>能力维度对比</span>
                  <div class="legend-row">
                    <span class="legend-dot" style="background:#5470c6"></span> 我的能力
                    <span class="legend-dot" style="background:#ee6666;margin-left:16px"></span> {{ targetPosition?.name }}
                  </div>
                </div>
              </template>
              <div style="height:360px">
                <RadarChart :data="matchRadarData" />
              </div>
            </el-card>
          </el-col>

          <!-- 右：综合得分 + 优劣势 -->
          <el-col :span="10">
            <el-card shadow="hover" class="score-card">
              <template #header>综合匹配度</template>
              <div class="big-score-wrap">
                <el-progress type="dashboard" :percentage="matchScore" :color="matchColors" :width="160" :stroke-width="12">
                  <template #default>
                    <div class="score-inner">
                      <span class="score-num">{{ matchScore }}</span>
                      <span class="score-pct">%</span>
                    </div>
                  </template>
                </el-progress>
                <div class="score-desc">{{ matchScoreDesc }}</div>
              </div>
            </el-card>

            <el-card shadow="hover" style="margin-top:16px">
              <template #header>优势 / 待提升</template>
              <div class="strength-section">
                <div class="strength-label success-label">✅ 优势维度</div>
                <div class="tag-wrap">
                  <el-tag v-for="d in advantageDims" :key="d" type="success" effect="plain" style="margin:4px">{{ d }}</el-tag>
                  <span v-if="!advantageDims.length" class="no-data-tip">暂无明显优势维度</span>
                </div>
                <div class="strength-label danger-label" style="margin-top:12px">⚠️ 待提升维度</div>
                <div class="tag-wrap">
                  <el-tag v-for="d in weaknessDims" :key="d" type="danger" effect="plain" style="margin:4px">{{ d }}</el-tag>
                  <span v-if="!weaknessDims.length" class="no-data-tip">全部达标</span>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 维度对比详情表 -->
        <el-card shadow="hover" style="margin-top:20px">
          <template #header>维度得分详情</template>
          <el-table :data="matchDetails" stripe border>
            <el-table-column prop="dimension" label="维度" width="110" />
            <el-table-column label="我的得分" width="160">
              <template #default="{ row }">
                <el-progress :percentage="row.student" :stroke-width="8" color="#5470c6" :show-text="false" />
                <span style="font-size:12px;color:#606266">{{ row.student }}</span>
              </template>
            </el-table-column>
            <el-table-column label="岗位要求" width="160">
              <template #default="{ row }">
                <el-progress :percentage="row.position" :stroke-width="8" :color="row.deficit > 0 ? '#ee6666' : '#67c23a'" :show-text="false" />
                <span style="font-size:12px;color:#606266">{{ row.position }}</span>
              </template>
            </el-table-column>
            <el-table-column label="差距" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.deficit > 0 ? 'danger' : 'success'" size="small">
                  {{ row.deficit > 0 ? `-${row.deficit}` : '✓' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="suggestion" label="建议" min-width="160" />
          </el-table>
        </el-card>

        <!-- 其他推荐岗位 -->
        <div style="margin-top:24px">
          <h4 style="margin:0 0 12px;color:#303133">同行业其他推荐岗位</h4>
          <el-row :gutter="16">
            <el-col :span="8" v-for="job in otherJobs" :key="job.id">
              <el-card class="other-job-card" shadow="hover" @click="switchPosition(job)">
                <div class="other-job-info">
                  <h4>{{ job.name }}</h4>
                  <p>{{ job.company }} · {{ job.location }}</p>
                </div>
                <el-progress :percentage="job.matchScore" :stroke-width="8" :color="matchColors" />
                <span class="other-match">{{ job.matchScore }}%</span>
              </el-card>
            </el-col>
          </el-row>
        </div>

        <div class="step-actions">
          <el-button @click="activeStep = 0">← 重新选择</el-button>
          <el-button type="primary" @click="activeStep = 2">下一步 →</el-button>
        </div>
      </div>

      <!-- ===================== 步骤 2：发展路径 ===================== -->
      <div v-if="activeStep === 2" class="step-pane">
        <el-row :gutter="24">
          <el-col :span="14">
            <el-card shadow="hover">
              <template #header>职业成长图谱</template>
              <div style="height:400px">
                <RelationGraph :nodes="careerGraph.nodes" :links="careerGraph.links" />
              </div>
            </el-card>
          </el-col>
          <el-col :span="10">
            <el-card shadow="hover">
              <template #header>行业趋势与发展空间</template>
              <el-descriptions :column="1" border>
                <el-descriptions-item label="目标岗位">{{ targetPosition?.name }}</el-descriptions-item>
                <el-descriptions-item label="所在行业">{{ industryTrend.industry }}</el-descriptions-item>
                <el-descriptions-item label="需求趋势">{{ industryTrend.demand }}</el-descriptions-item>
                <el-descriptions-item label="薪资趋势">{{ industryTrend.salary }}</el-descriptions-item>
                <el-descriptions-item label="热门城市">{{ industryTrend.cities }}</el-descriptions-item>
                <el-descriptions-item label="紧缺技能">{{ industryTrend.hotSkills }}</el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card shadow="hover" style="margin-top:16px">
              <template #header>职业晋升路径</template>
              <el-timeline>
                <el-timeline-item
                  v-for="(stage, i) in careerStages"
                  :key="i"
                  :timestamp="stage.period"
                  :type="stage.type"
                  placement="top"
                >
                  <strong>{{ stage.title }}</strong>
                  <p style="margin:4px 0 0;font-size:13px;color:#606266">{{ stage.desc }}</p>
                </el-timeline-item>
              </el-timeline>
            </el-card>
          </el-col>
        </el-row>

        <div class="step-actions">
          <el-button @click="activeStep = 1">← 上一步</el-button>
          <el-button type="primary" @click="activeStep = 3">下一步 →</el-button>
        </div>
      </div>

      <!-- ===================== 步骤 3：行动计划 ===================== -->
      <div v-if="activeStep === 3" class="step-pane" id="reportContent" ref="reportContent">
        <!-- 报告头 -->
        <div class="report-header">
          <h2>📋 职业发展行动计划</h2>
          <p>目标岗位：<strong>{{ targetPosition?.name }}</strong> &nbsp;|&nbsp; 综合匹配度：<strong style="color:#409eff">{{ matchScore }}%</strong> &nbsp;|&nbsp; 生成时间：{{ reportDate }}</p>
        </div>

        <!-- 缺失技能 -->
        <el-card shadow="hover" style="margin-bottom:20px" v-if="missingSkills.length">
          <template #header>🔧 待补充技能（岗位要求但简历未涵盖）</template>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <el-tag v-for="s in missingSkills" :key="s" type="danger" effect="plain" size="large">{{ s }}</el-tag>
          </div>
        </el-card>

        <!-- 动态行动计划时间线 -->
        <el-card shadow="hover" style="margin-bottom:20px">
          <template #header>📅 个性化行动计划（基于你的实际差距生成）</template>
          <el-timeline>
            <el-timeline-item
              v-for="(plan, i) in actionPlans"
              :key="i"
              :timestamp="plan.period"
              :type="plan.type"
              placement="top"
            >
              <el-card shadow="never" style="border:1px solid #ebeef5">
                <h4 style="margin:0 0 8px;color:#303133">{{ plan.title }}</h4>
                <div v-for="item in plan.items" :key="item" style="font-size:14px;color:#606266;line-height:1.8">
                  • {{ item }}
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>

        <!-- 评估指标 -->
        <el-card shadow="hover" style="margin-bottom:20px">
          <template #header>📊 阶段评估指标</template>
          <el-table :data="evaluationMetrics" border stripe>
            <el-table-column prop="stage" label="阶段" width="100" />
            <el-table-column prop="metric" label="评估指标" />
            <el-table-column prop="target" label="目标" width="150" />
          </el-table>
        </el-card>

        <div class="step-actions">
          <el-button @click="activeStep = 2">← 上一步</el-button>
          <el-button type="primary" @click="showReportDialog = true">生成完整报告</el-button>
        </div>
      </div>
    </template>

    <!-- 报告对话框 -->
    <el-dialog v-model="showReportDialog" title="职业生涯发展报告" width="70%">
      <div ref="reportDialogRef" style="font-family:'Microsoft YaHei',sans-serif;padding:20px;background:#fff">
        <div style="text-align:center;margin-bottom:30px">
          <h1 style="font-size:26px;color:#303133;margin:0">职业生涯发展报告</h1>
          <p style="color:#909399;font-size:14px;margin-top:8px">生成时间：{{ reportDate }}</p>
        </div>

        <div style="display:flex;gap:20px;margin-bottom:24px">
          <div style="flex:1;background:#f5f7fa;padding:16px;border-radius:8px">
            <h3 style="margin-top:0;color:#409eff">👤 学生信息</h3>
            <p><strong>姓名：</strong>{{ studentProfile?.name || '未填写' }}</p>
            <p><strong>专业：</strong>{{ studentProfile?.major || '未填写' }}</p>
            <p><strong>年级：</strong>{{ studentProfile?.grade || '未填写' }}</p>
          </div>
          <div style="flex:1;background:#f5f7fa;padding:16px;border-radius:8px">
            <h3 style="margin-top:0;color:#e6a23c">🎯 目标岗位</h3>
            <p><strong>岗位名称：</strong>{{ targetPosition?.name }}</p>
            <p><strong>公司：</strong>{{ targetPosition?.company }}</p>
            <p><strong>综合匹配度：</strong><span style="color:#409eff;font-weight:700;font-size:18px">{{ matchScore }}%</span></p>
          </div>
        </div>

        <div style="background:#fff;border:1px solid #ebeef5;border-radius:8px;padding:16px;margin-bottom:20px">
          <h3 style="margin-top:0">📊 维度对比</h3>
          <table style="width:100%;border-collapse:collapse;border:1px solid #ebeef5">
            <thead><tr style="background:#f5f7fa">
              <th style="padding:8px;text-align:left">维度</th>
              <th style="padding:8px;text-align:left">我的得分</th>
              <th style="padding:8px;text-align:left">岗位要求</th>
              <th style="padding:8px;text-align:left">差距</th>
            </tr></thead>
            <tbody>
              <tr v-for="item in matchDetails" :key="item.dimension">
                <td style="padding:8px;border-bottom:1px solid #ebeef5">{{ item.dimension }}</td>
                <td style="padding:8px;border-bottom:1px solid #ebeef5">{{ item.student }}</td>
                <td style="padding:8px;border-bottom:1px solid #ebeef5">{{ item.position }}</td>
                <td style="padding:8px;border-bottom:1px solid #ebeef5;color:{{ item.deficit > 0 ? '#f56c6c' : '#67c23a' }}">{{ item.deficit > 0 ? `-${item.deficit}` : '✓ 达标' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="background:#fff;border:1px solid #ebeef5;border-radius:8px;padding:16px">
          <h3 style="margin-top:0">📅 行动计划</h3>
          <div v-for="plan in actionPlans" :key="plan.period" style="margin-bottom:16px;padding-left:16px;border-left:3px solid #409eff">
            <strong>{{ plan.period }} — {{ plan.title }}</strong>
            <ul style="margin:8px 0;padding-left:20px">
              <li v-for="item in plan.items" :key="item" style="font-size:13px;color:#606266;line-height:1.8">{{ item }}</li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showReportDialog = false">关闭</el-button>
        <el-button type="primary" @click="exportPDF">导出 PDF</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Search, CircleCheckFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store'
import RadarChart from '@/components/RadarChart.vue'
import RelationGraph from '@/components/RelationGraph.vue'
import html2pdf from 'html2pdf.js'
import { calcMatchScore, DIMS, DIM_LABELS, getMatchTagType } from '@/utils/match'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const studentProfile = computed(() => userStore.studentProfile)

const activeStep = ref(0)
const showReportDialog = ref(false)
const reportContent = ref<HTMLElement>()
const reportDialogRef = ref<HTMLElement>()
const reportDate = new Date().toLocaleDateString('zh-CN')

const matchColors = [
  { color: '#f56c6c', percentage: 50 },
  { color: '#e6a23c', percentage: 70 },
  { color: '#5cb87a', percentage: 100 },
]

// ==========================================
// 步骤 0：搜索 & 选择岗位
// ==========================================
const posSearch = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const selectedPositionId = ref('')
const targetPosition = ref<any>(null)
const totalCount = ref(10000)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const fetchTotalCount = async () => {
  try {
    const res = await axios.get('/api/stats')
    if (res.data.code === 0) totalCount.value = res.data.data.totalPositions
  } catch {}
}

const searchPositions = async (keyword: string) => {
  searchLoading.value = true
  try {
    const res = await axios.get('/api/positions', {
      params: { page: 1, size: 8, search: keyword || '' }
    })
    if (res.data.code === 0) {
      searchResults.value = res.data.data
    }
  } catch {
    ElMessage.error('搜索失败')
  } finally {
    searchLoading.value = false
  }
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => searchPositions(posSearch.value), 400)
}

const selectPosition = (pos: any) => {
  selectedPositionId.value = pos.id
  targetPosition.value = pos
  userStore.setTargetPosition(pos.id)
}

const switchPosition = (job: any) => {
  selectPosition(job)
  goToAnalysis()
}

const goToAnalysis = () => {
  if (!targetPosition.value) return
  activeStep.value = 1
}

// ==========================================
// 步骤 1：匹配分析
// ==========================================
const matchScore = computed(() => {
  if (!studentProfile.value || !targetPosition.value) return 0
  return calcMatchScore(studentProfile.value.dimensions, targetPosition.value.dimensions || {})
})

const matchScoreDesc = computed(() => {
  const s = matchScore.value
  if (s >= 85) return '高度匹配，你是这个岗位的有力竞争者！'
  if (s >= 70) return '匹配良好，针对差距补强即可胜任。'
  if (s >= 55) return '有一定基础，需要系统提升几个维度。'
  return '差距较大，建议先选择保底岗位积累经验。'
})

const matchRadarData = computed(() => {
  if (!studentProfile.value || !targetPosition.value) return { indicator: [], series: [] }
  const d = studentProfile.value.dimensions
  const p = targetPosition.value.dimensions || {}
  return {
    indicator: DIMS.map(k => ({ name: DIM_LABELS[k], max: 100 })),
    series: [
      { name: '我的能力', data: [DIMS.map(k => d[k] || 0)] },
      { name: targetPosition.value.name, data: [DIMS.map(k => p[k] || 0)] },
    ]
  }
})

const matchDetails = computed(() => {
  if (!studentProfile.value || !targetPosition.value) return []
  const d = studentProfile.value.dimensions
  const p = targetPosition.value.dimensions || {}
  return DIMS.map(k => {
    const s = d[k] || 0
    const j = p[k] || 0
    const deficit = Math.max(0, j - s)
    return {
      dimension: DIM_LABELS[k],
      student: s,
      position: j,
      deficit,
      suggestion: deficit > 20 ? `重点提升，差距${deficit}分` : deficit > 0 ? `小幅提升，差${deficit}分` : '继续保持',
    }
  })
})

const advantageDims = computed(() =>
  matchDetails.value.filter(d => d.deficit === 0 && d.student >= 60).map(d => d.dimension)
)
const weaknessDims = computed(() =>
  matchDetails.value.filter(d => d.deficit > 10).sort((a, b) => b.deficit - a.deficit).map(d => d.dimension)
)

const missingSkills = computed(() => {
  if (!studentProfile.value || !targetPosition.value) return []
  const jobSkills: string[] = targetPosition.value.requirements?.professionalSkills || []
  const mySkills: string[] = studentProfile.value.skills?.professionalSkills || []
  return jobSkills.filter(s =>
    !mySkills.some(ms => ms.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ms.toLowerCase()))
  )
})

// 其他推荐岗位（同行业前3）
const otherJobs = ref<any[]>([])
const fetchOtherJobs = async () => {
  if (!targetPosition.value || !studentProfile.value) return
  try {
    const industry = Array.isArray(targetPosition.value.clean_industry)
      ? targetPosition.value.clean_industry[0]
      : targetPosition.value.industry || ''
    const res = await axios.get('/api/positions', {
      params: { page: 1, size: 12, industry }
    })
    if (res.data.code === 0) {
      otherJobs.value = res.data.data
        .filter((p: any) => p.id !== targetPosition.value.id)
        .map((p: any) => ({
          id: p.id, name: p.name, company: p.company, location: p.location,
          matchScore: calcMatchScore(studentProfile.value!.dimensions, p.dimensions || {})
        }))
        .sort((a: any, b: any) => b.matchScore - a.matchScore)
        .slice(0, 3)
    }
  } catch {}
}

watch(() => targetPosition.value, fetchOtherJobs)

// ==========================================
// 步骤 2：发展路径
// ==========================================
const detectJobType = (name: string): string => {
  const n = name.toLowerCase()
  if (n.includes('java') || n.includes('后端') || n.includes('服务端')) return 'backend'
  if (n.includes('前端') || n.includes('web') || n.includes('react') || n.includes('vue')) return 'frontend'
  if (n.includes('数据') || n.includes('算法') || n.includes('ai') || n.includes('机器学习')) return 'data'
  if (n.includes('产品') || n.includes('product')) return 'product'
  if (n.includes('运营') || n.includes('市场')) return 'ops'
  if (n.includes('测试') || n.includes('qa')) return 'qa'
  return 'general'
}

const JOB_TYPE_CONFIG: Record<string, { stages: any[]; trend: any; nodes: any[]; links: any[] }> = {
  backend: {
    stages: [
      { title: '初级工程师', period: '0-1年', desc: '熟悉业务代码，参与功能开发，学习基础框架' },
      { title: '中级工程师', period: '1-3年', desc: '独立负责模块，掌握系统优化，参与技术方案' },
      { title: '高级工程师', period: '3-5年', desc: '主导技术架构，解决复杂问题，培养新人' },
      { title: '技术专家/架构师', period: '5年+', desc: '定义技术方向，微服务/高并发架构设计' },
    ],
    trend: { demand: '未来5年需求增长30%', salary: '平均每年涨幅10-15%', cities: '北京、上海、杭州、深圳', hotSkills: '微服务、云原生、高并发', industry: '互联网/科技' },
    nodes: [
      { id: '0', name: '后端开发', symbolSize: 80, itemStyle: { color: '#409EFF' } },
      { id: '1', name: '架构师', symbolSize: 55 }, { id: '2', name: '技术总监', symbolSize: 55 },
      { id: '3', name: '大数据开发', symbolSize: 45 }, { id: '4', name: '云计算工程师', symbolSize: 45 },
      { id: '5', name: '全栈开发', symbolSize: 45 },
    ],
    links: [{ source: '0', target: '1' }, { source: '1', target: '2' }, { source: '0', target: '3' }, { source: '0', target: '4' }, { source: '0', target: '5' }],
  },
  frontend: {
    stages: [
      { title: '初级前端', period: '0-1年', desc: '掌握HTML/CSS/JS，熟悉Vue/React框架' },
      { title: '中级前端', period: '1-3年', desc: '深入框架原理，性能优化，组件库开发' },
      { title: '高级前端', period: '3-5年', desc: '前端架构设计，工程化体系，跨端开发' },
      { title: '前端专家', period: '5年+', desc: '技术引领，低代码平台，开源贡献' },
    ],
    trend: { demand: '需求持续旺盛，增长20%+', salary: '年涨幅8-12%', cities: '北京、上海、杭州、广州', hotSkills: 'TypeScript、性能优化、WebGL', industry: '互联网/移动端' },
    nodes: [
      { id: '0', name: '前端开发', symbolSize: 80, itemStyle: { color: '#409EFF' } },
      { id: '1', name: '全栈开发', symbolSize: 55 }, { id: '2', name: '前端架构师', symbolSize: 55 },
      { id: '3', name: '移动端开发', symbolSize: 45 }, { id: '4', name: '用户体验设计', symbolSize: 45 },
    ],
    links: [{ source: '0', target: '1' }, { source: '0', target: '2' }, { source: '0', target: '3' }, { source: '0', target: '4' }],
  },
  data: {
    stages: [
      { title: '数据分析师', period: '0-1年', desc: '数据清洗、SQL查询、基础可视化报表' },
      { title: '高级分析师', period: '1-3年', desc: '建模分析、A/B测试、业务深度洞察' },
      { title: '算法工程师', period: '2-4年', desc: '机器学习模型开发，推荐系统，NLP' },
      { title: 'AI研究员/总监', period: '5年+', desc: '前沿算法研究，技术团队管理' },
    ],
    trend: { demand: 'AI热潮下需求爆发，增长50%+', salary: '顶尖岗位年薪30-100万', cities: '北京、上海、杭州、深圳', hotSkills: 'LLM、PyTorch、Spark', industry: '互联网/金融/医疗' },
    nodes: [
      { id: '0', name: '数据/算法工程师', symbolSize: 80, itemStyle: { color: '#409EFF' } },
      { id: '1', name: '机器学习工程师', symbolSize: 55 }, { id: '2', name: 'AI研究员', symbolSize: 55 },
      { id: '3', name: '大数据架构师', symbolSize: 45 }, { id: '4', name: '数据科学家', symbolSize: 45 },
    ],
    links: [{ source: '0', target: '1' }, { source: '1', target: '2' }, { source: '0', target: '3' }, { source: '0', target: '4' }],
  },
  general: {
    stages: [
      { title: '初级岗位', period: '0-1年', desc: '熟悉业务流程，完成基础工作任务' },
      { title: '独立工作', period: '1-3年', desc: '独当一面，提升专业技能' },
      { title: '资深专家', period: '3-5年', desc: '跨团队协作，承担更大责任' },
      { title: '管理/专家', period: '5年+', desc: '带领团队或成为行业专家' },
    ],
    trend: { demand: '市场稳定需求', salary: '年涨幅6-10%', cities: '北上广深及新一线城市', hotSkills: '沟通协作、行业认证', industry: '多行业' },
    nodes: [
      { id: '0', name: targetPosition.value?.name || '目标岗位', symbolSize: 80, itemStyle: { color: '#409EFF' } },
      { id: '1', name: '资深专家', symbolSize: 55 }, { id: '2', name: '管理岗', symbolSize: 55 },
      { id: '3', name: '行业专家', symbolSize: 45 }, { id: '4', name: '转型方向', symbolSize: 45 },
    ],
    links: [{ source: '0', target: '1' }, { source: '1', target: '2' }, { source: '0', target: '3' }, { source: '0', target: '4' }],
  },
}

// 补充 product/ops/qa 使用 general
JOB_TYPE_CONFIG.product = { ...JOB_TYPE_CONFIG.general }
JOB_TYPE_CONFIG.ops = { ...JOB_TYPE_CONFIG.general }
JOB_TYPE_CONFIG.qa = { ...JOB_TYPE_CONFIG.general }

const jobTypeConfig = computed(() => {
  const t = detectJobType(targetPosition.value?.name || '')
  return JOB_TYPE_CONFIG[t] || JOB_TYPE_CONFIG.general
})

const careerGraph = computed(() => ({
  nodes: jobTypeConfig.value.nodes,
  links: jobTypeConfig.value.links,
}))

const industryTrend = computed(() => jobTypeConfig.value.trend)

const careerStages = computed(() =>
  jobTypeConfig.value.stages.map((s, i) => ({
    ...s,
    type: ['primary', 'success', 'warning', ''][i] as any,
  }))
)

// ==========================================
// 步骤 3：行动计划（动态生成）
// ==========================================
const SKILL_LEARNING: Record<string, string[]> = {
  professional: ['选择1-2个核心技能方向，系统学习官方文档', '完成2个实战项目并发布到GitHub', '参加技术社区活动或开源贡献'],
  certificate: ['备考行业认证证书（软考、PMP、CFA等）', '规划3-6个月备考周期，系统刷题'],
  innovation: ['参加挑战杯、互联网+等创新竞赛', '尝试独立开发一个小产品/工具，解决身边问题'],
  learning: ['建立每日学习打卡习惯（1小时/天）', '订阅行业技术博客，保持知识更新', '完成一门系统性在线课程'],
  stress: ['参与有截止日期的团队项目，锻炼时间管理', '学习GTD工作法或番茄工作法'],
  communication: ['积极参与团队讨论，每次会议主动发言', '报名参加演讲、辩论或Model UN等活动'],
  internship: ['在目标行业寻找1-2段实习机会', '利用假期参与企业短期实习项目'],
}

const actionPlans = computed(() => {
  if (!studentProfile.value || !targetPosition.value) return []

  // 找出差距最大的前3个维度
  const topWeakDims = matchDetails.value
    .filter(d => d.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, 3)

  const missingSkillItems = missingSkills.value.slice(0, 3).map(s => `学习并掌握 ${s}（参考官方文档或慕课网）`)

  const plans = [
    {
      period: '短期（1-3个月）',
      type: 'primary' as const,
      title: '快速补足关键短板',
      items: [
        ...missingSkillItems.slice(0, 2),
        ...(topWeakDims[0] ? SKILL_LEARNING[topWeakDims[0].dimension in SKILL_LEARNING ? topWeakDims[0].dimension : 'professional'] || [] : []).slice(0, 2),
      ].filter(Boolean).slice(0, 4),
    },
    {
      period: '中期（3-6个月）',
      type: 'success' as const,
      title: '综合能力全面提升',
      items: [
        ...(topWeakDims[1] ? SKILL_LEARNING[topWeakDims[1].dimension in SKILL_LEARNING ? topWeakDims[1].dimension : 'learning'] || [] : []).slice(0, 2),
        '完成一个完整项目，体现多维能力综合运用',
        '积极寻找相关实习机会，积累实战经验',
      ].filter(Boolean).slice(0, 4),
    },
    {
      period: '长期（6-12个月）',
      type: 'warning' as const,
      title: '冲刺目标岗位',
      items: [
        '整理并优化简历，突出与目标岗位的匹配点',
        '进行模拟面试练习，提升表达与临场能力',
        ...(topWeakDims[2] ? SKILL_LEARNING[topWeakDims[2].dimension in SKILL_LEARNING ? topWeakDims[2].dimension : 'communication'] || [] : []).slice(0, 1),
        `目标：综合匹配度从 ${matchScore.value}% 提升至 80% 以上`,
      ].filter(Boolean).slice(0, 4),
    },
  ]

  // 修正items中可能有错误key的情况
  return plans.map(p => ({
    ...p,
    items: p.items.length ? p.items : ['制定具体学习计划，持续跟进']
  }))
})

// 修复 actionPlans 中 SKILL_LEARNING key 查找问题
// 由于 matchDetails 的 dimension 是中文，需要反向映射
const dimLabelToKey = Object.fromEntries(
  Object.entries(DIM_LABELS).map(([k, v]) => [v, k])
) as Record<string, string>

const actionPlansFixed = computed(() => {
  if (!studentProfile.value || !targetPosition.value) return []
  const topWeakDims = matchDetails.value
    .filter(d => d.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, 3)

  const missingSkillItems = missingSkills.value.slice(0, 3).map(s => `学习并掌握 ${s}（参考官方文档或慕课网）`)

  const getItems = (dim: any, fallbackKey: string) => {
    if (!dim) return []
    const key = dimLabelToKey[dim.dimension] || fallbackKey
    return (SKILL_LEARNING[key] || SKILL_LEARNING[fallbackKey] || []).slice(0, 2)
  }

  return [
    {
      period: '短期（1-3个月）', type: 'primary' as const, title: '快速补足关键短板',
      items: [...missingSkillItems.slice(0, 2), ...getItems(topWeakDims[0], 'professional')].slice(0, 4),
    },
    {
      period: '中期（3-6个月）', type: 'success' as const, title: '综合能力全面提升',
      items: [...getItems(topWeakDims[1], 'learning'), '完成完整项目，体现综合能力', '积极寻找相关实习机会'].slice(0, 4),
    },
    {
      period: '长期（6-12个月）', type: 'warning' as const, title: '冲刺目标岗位',
      items: ['整理优化简历，突出与目标岗位的匹配点', '进行模拟面试练习', ...getItems(topWeakDims[2], 'communication'), `目标：匹配度从 ${matchScore.value}% 提升至 80%+`].slice(0, 4),
    },
  ].map(p => ({ ...p, items: p.items.length ? p.items : ['制定具体学习计划，持续跟进'] }))
})

const evaluationMetrics = computed(() => [
  { stage: '每月', metric: '技能学习打卡情况、项目进度', target: '完成率 ≥ 80%' },
  { stage: '每季度', metric: '匹配度重新计算、简历更新', target: '匹配度稳步提升' },
  { stage: '半年', metric: '实习/项目经验积累、证书备考', target: '获得1项相关经验' },
])

// ==========================================
// 导出 PDF
// ==========================================
const exportPDF = () => {
  const el = reportDialogRef.value
  if (!el) return
  html2pdf().set({
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: `职业发展报告_${targetPosition.value?.name || ''}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }).from(el).save()
}

// ==========================================
// 初始化
// ==========================================
onMounted(() => {
  fetchTotalCount()
  searchPositions('')
  // 若从岗位库跳转过来，自动加载目标岗位
  if (userStore.targetPositionId) {
    axios.get(`/api/positions/${userStore.targetPositionId}`).then(res => {
      if (res.data.code === 0) selectPosition(res.data.data)
    }).catch(() => {})
  }
})
</script>

<style scoped>
.match-report {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}

.steps-bar {
  margin-bottom: 28px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.step-pane {
  background: #fff;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* 步骤0 */
.step0-header { text-align: center; margin-bottom: 24px; }
.step0-header h3 { font-size: 22px; color: #303133; margin: 0 0 6px; }
.step-hint { color: #909399; font-size: 14px; margin: 0; }
.search-bar { display: flex; justify-content: center; margin-bottom: 24px; }

.pos-results { display: flex; flex-direction: column; gap: 12px; min-height: 200px; }
.pos-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.pos-item:hover { border-color: #409eff; background: #f5f9ff; }
.pos-item-selected { border-color: #409eff; background: #ecf5ff; }
.pos-item-body { flex: 1; }
.pos-item-body h4 { margin: 0 0 4px; font-size: 16px; color: #303133; }
.pos-item-body p { margin: 0 0 8px; font-size: 13px; color: #909399; }
.pos-skills { display: flex; gap: 6px; flex-wrap: wrap; }
.salary-text { color: #f56c6c; font-weight: 600; }
.pos-item-match { text-align: center; flex-shrink: 0; }
.match-label { font-size: 12px; color: #909399; display: block; margin-top: 4px; }
.selected-check { position: absolute; top: 8px; right: 8px; font-size: 20px; color: #409eff; }

/* 步骤1 */
.radar-card { height: 100%; }
.card-header-flex { display: flex; justify-content: space-between; align-items: center; }
.legend-row { display: flex; align-items: center; font-size: 13px; color: #606266; }
.legend-dot { width: 12px; height: 3px; border-radius: 2px; display: inline-block; }
.big-score-wrap { display: flex; flex-direction: column; align-items: center; padding: 10px 0; }
.score-inner { text-align: center; }
.score-num { font-size: 36px; font-weight: 700; color: #303133; }
.score-pct { font-size: 18px; color: #909399; }
.score-desc { font-size: 13px; color: #606266; margin-top: 12px; text-align: center; max-width: 200px; }
.strength-section { padding: 4px 0; }
.strength-label { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
.success-label { color: #67c23a; }
.danger-label { color: #f56c6c; }
.tag-wrap { display: flex; flex-wrap: wrap; }
.no-data-tip { font-size: 12px; color: #c0c4cc; padding: 4px 0; }

.other-job-card { cursor: pointer; transition: all 0.2s; margin-bottom: 0; }
.other-job-card:hover { transform: translateY(-3px); box-shadow: 0 6px 18px rgba(0,0,0,0.1); }
.other-job-info h4 { margin: 0 0 4px; font-size: 14px; }
.other-job-info p { font-size: 12px; color: #909399; margin: 0 0 8px; }
.other-match { font-size: 13px; color: #409eff; font-weight: 600; }

/* 报告头 */
.report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e4e7ed; }
.report-header h2 { margin: 0 0 8px; font-size: 24px; color: #303133; }
.report-header p { color: #909399; font-size: 13px; margin: 0; }

.step-actions { display: flex; justify-content: center; gap: 20px; margin-top: 30px; }
</style>
