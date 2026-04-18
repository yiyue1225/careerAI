<template>
  <div class="pos-analysis">
    <!-- 顶部：岗位基本信息 + 匹配度大图 -->
    <el-row :gutter="24" class="top-row">
      <el-col :span="15">
        <el-card shadow="hover" class="radar-card">
          <template #header>
            <div class="card-header-flex">
              <span>能力维度对比</span>
              <div class="legend-row">
                <span class="legend-dot" style="background:#5470c6"></span> 我的能力
                <span class="legend-dot" style="background:#ee6666;margin-left:14px"></span> {{ position.name }}
              </div>
            </div>
          </template>
          <div style="height:480px">
            <RadarChart :data="radarData" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="9">
        <el-card shadow="hover" class="score-card">
          <template #header>综合匹配度</template>
          <div class="score-wrap">
            <el-progress
              type="dashboard"
              :percentage="matchScore"
              :color="matchColors"
              :width="150"
              :stroke-width="12"
            >
              <template #default>
                <div class="score-inner">
                  <span class="score-num">{{ matchScore }}</span>
                  <span class="score-unit">%</span>
                </div>
              </template>
            </el-progress>
            <p class="score-desc">{{ scoreDesc }}</p>
          </div>
        </el-card>

        <el-card shadow="hover" style="margin-top:12px">
          <template #header>岗位信息</template>
          <div class="job-info-list">
            <div class="job-info-item"><label>公司</label><span>{{ position.company }}</span></div>
            <div class="job-info-item"><label>城市</label><span>{{ position.location }}</span></div>
            <div class="job-info-item"><label>薪资</label><span class="salary">{{ position.salary }}</span></div>
            <div class="job-info-item"><label>匹配度</label>
              <el-tag :type="getMatchTagType(matchScore)" size="small">{{ matchScore }}%</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 维度详情表 -->
    <el-card shadow="hover" style="margin-top:12px">
      <template #header>
        <div class="card-header-flex">
          <span>维度得分详情</span>
          <div>
            <el-tag type="success" size="small" style="margin-right:6px">✅ 优势：{{ advantageDims.join('、') || '无' }}</el-tag>
            <el-tag type="danger" size="small">⚠️ 待提升：{{ weaknessDims.join('、') || '无' }}</el-tag>
          </div>
        </div>
      </template>
      <el-table :data="matchDetails" stripe border size="small">
        <el-table-column prop="dimension" label="维度" width="100" />
        <el-table-column label="我的得分" width="200">
          <template #default="{ row }">
            <div class="progress-row">
              <el-progress :percentage="row.student" :stroke-width="8" color="#5470c6" :show-text="false" style="flex:1" />
              <span class="dim-val">{{ row.student }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="岗位要求" width="200">
          <template #default="{ row }">
            <div class="progress-row">
              <el-progress :percentage="row.position" :stroke-width="8" :color="row.deficit > 0 ? '#ee6666' : '#91cc75'" :show-text="false" style="flex:1" />
              <span class="dim-val">{{ row.position }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="差距" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.deficit > 0 ? 'danger' : 'success'" size="small">
              {{ row.deficit > 0 ? `-${row.deficit}` : '✓' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="suggestion" label="建议" min-width="150" />
      </el-table>
    </el-card>

    <!-- 缺失技能 -->
    <el-card shadow="hover" style="margin-top:12px" v-if="missingSkills.length">
      <template #header>🔧 待补充技能</template>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <el-tag v-for="s in missingSkills" :key="s" type="danger" effect="plain">{{ s }}</el-tag>
      </div>
    </el-card>

    <!-- 行动计划 -->
    <el-card shadow="hover" style="margin-top:12px">
      <template #header>📅 个性化行动计划</template>
      <el-timeline>
        <el-timeline-item
          v-for="plan in actionPlans"
          :key="plan.period"
          :timestamp="plan.period"
          :type="plan.type"
          placement="top"
        >
          <el-card shadow="never" style="border:1px solid #ebeef5">
            <h4 style="margin:0 0 8px;color:#303133">{{ plan.title }}</h4>
            <div v-for="item in plan.items" :key="item" style="font-size:13px;color:#606266;line-height:1.9">• {{ item }}</div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 导出 PDF -->
    <div style="text-align:center;margin-top:24px">
      <el-button type="primary" :icon="Printer" @click="printReport" round>下载报告 PDF</el-button>
      <el-button :icon="Promotion" @click="$router.push('/volunteer')" round>加入求职投递清单</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Printer, Promotion } from '@element-plus/icons-vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import RadarChart from '@/components/RadarChart.vue'
import { calcMatchScore, getMatchTagType, DIMS, DIM_LABELS } from '@/utils/match'

const props = defineProps<{
  position: any
  studentProfile: any
}>()

const router = useRouter()

const matchColors = [
  { color: '#f56c6c', percentage: 50 },
  { color: '#e6a23c', percentage: 70 },
  { color: '#5cb87a', percentage: 100 },
]

const matchScore = computed(() =>
  calcMatchScore(props.studentProfile?.dimensions || {}, props.position?.dimensions || {})
)

const scoreDesc = computed(() => {
  const s = matchScore.value
  if (s >= 85) return '高度匹配，有力竞争者！'
  if (s >= 70) return '匹配良好，针对差距补强可胜任。'
  if (s >= 55) return '有基础，需系统提升几个维度。'
  return '差距较大，建议先积累相关经验。'
})

const radarData = computed(() => {
  const d = props.studentProfile?.dimensions || {}
  const p = props.position?.dimensions || {}
  return {
    indicator: DIMS.map(k => ({ name: DIM_LABELS[k], max: 100 })),
    series: [
      { name: '我的能力', data: [DIMS.map(k => d[k] || 0)] },
      { name: props.position?.name || '岗位', data: [DIMS.map(k => p[k] || 0)] },
    ]
  }
})

const matchDetails = computed(() => {
  const d = props.studentProfile?.dimensions || {}
  const p = props.position?.dimensions || {}
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
  const jobSkills: string[] = props.position?.requirements?.professionalSkills || []
  const mySkills: string[] = props.studentProfile?.skills?.professionalSkills || []
  return jobSkills.filter(s =>
    !mySkills.some(ms =>
      ms.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ms.toLowerCase())
    )
  )
})

// 行动计划
const SKILL_LEARNING: Record<string, string[]> = {
  professional: ['系统学习核心技能，完成官方文档精读', '完成 2 个实战项目并发布到 GitHub'],
  certificate:  ['备考行业认证（软考、PMP 等），规划 3-6 个月备考周期'],
  innovation:   ['参加挑战杯、互联网+ 等创新竞赛', '尝试独立开发一个小工具并发布'],
  learning:     ['建立每日学习打卡习惯（≥1 小时/天）', '完成一门系统性在线课程'],
  stress:       ['参与有 deadline 的项目，锻炼时间管理', '学习 GTD 或番茄工作法'],
  communication:['积极参与会议讨论，主动输出观点', '参加演讲或跨团队协作项目'],
  internship:   ['在目标行业寻找 1-2 段实习机会', '利用假期参与企业短期实习项目'],
}

const dimLabelToKey = Object.fromEntries(
  Object.entries(DIM_LABELS).map(([k, v]) => [v, k])
) as Record<string, string>

const actionPlans = computed(() => {
  const topWeak = matchDetails.value
    .filter(d => d.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit)
    .slice(0, 3)

  const missingItems = missingSkills.value.slice(0, 2).map(s => `学习并掌握 ${s}（官方文档 / 慕课网）`)

  const getItems = (dim: any, fallback: string) => {
    if (!dim) return []
    const key = dimLabelToKey[dim.dimension] || fallback
    return (SKILL_LEARNING[key] || SKILL_LEARNING[fallback] || []).slice(0, 2)
  }

  return [
    {
      period: '短期（1-3个月）', type: 'primary' as const, title: '快速补足关键短板',
      items: [...missingItems, ...getItems(topWeak[0], 'professional')].slice(0, 4),
    },
    {
      period: '中期（3-6个月）', type: 'success' as const, title: '综合能力全面提升',
      items: [...getItems(topWeak[1], 'learning'), '完成完整项目，体现综合能力', '积极寻找相关实习机会'].slice(0, 4),
    },
    {
      period: '长期（6-12个月）', type: 'warning' as const, title: '冲刺目标岗位',
      items: ['整理优化简历，突出与目标岗位的匹配点', '进行模拟面试练习', ...getItems(topWeak[2], 'communication'), `目标：匹配度提升至 80%+`].slice(0, 4),
    },
  ].map(p => ({ ...p, items: p.items.length ? p.items : ['制定具体学习计划，持续跟进'] }))
})

const printReport = async () => {
  // 创建临时容器
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.width = '1000px'
  container.style.backgroundColor = '#fff'
  container.style.padding = '40px'
  container.style.fontFamily = 'Arial, sans-serif'

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #409eff; padding-bottom: 20px;">
      <h1 style="font-size: 28px; color: #303133; margin: 0 0 10px 0;">职业匹配分析报告</h1>
      <p style="color: #909399; font-size: 14px; margin: 0 0 5px 0;">${props.position?.name} @ ${props.position?.company}</p>
      <p style="color: #909399; font-size: 12px; margin: 0;">生成时间：${new Date().toLocaleDateString('zh-CN')}</p>
    </div>

    <div style="margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div style="padding: 15px; background: #f5f7fa; border-radius: 4px;">
        <h3 style="font-size: 14px; color: #303133; margin: 0 0 12px 0; font-weight: 600;">个人信息</h3>
        <table style="width: 100%; font-size: 13px; line-height: 1.8;">
          <tr>
            <td style="color: #909399; width: 40%;">姓名</td>
            <td style="color: #303133; font-weight: 500;">${props.studentProfile?.name || '-'}</td>
          </tr>
          <tr>
            <td style="color: #909399;">专业</td>
            <td style="color: #303133; font-weight: 500;">${props.studentProfile?.major || '-'}</td>
          </tr>
          <tr>
            <td style="color: #909399;">年级</td>
            <td style="color: #303133; font-weight: 500;">${props.studentProfile?.grade || '无'}</td>
          </tr>
        </table>
      </div>

      <div style="padding: 15px; background: #f5f7fa; border-radius: 4px;">
        <h3 style="font-size: 14px; color: #303133; margin: 0 0 12px 0; font-weight: 600;">目标岗位</h3>
        <table style="width: 100%; font-size: 13px; line-height: 1.8;">
          <tr>
            <td style="color: #909399; width: 40%;">岗位</td>
            <td style="color: #303133; font-weight: 500;">${props.position?.name || '-'}</td>
          </tr>
          <tr>
            <td style="color: #909399;">公司</td>
            <td style="color: #303133; font-weight: 500;">${props.position?.company || '-'}</td>
          </tr>
          <tr>
            <td style="color: #909399;">行业</td>
            <td style="color: #303133; font-weight: 500;">${props.position?.industry || '-'}</td>
          </tr>
        </table>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #303133; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed;">综合匹配度</h2>
      <div style="text-align: center; margin: 20px 0;">
        <div style="font-size: 48px; font-weight: bold; color: #409eff;">${matchScore.value}%</div>
        <div style="font-size: 14px; color: #606266; margin-top: 8px;">${scoreDesc.value}</div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #303133; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed;">岗位信息</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <tr>
          <td style="background: #f5f7fa; padding: 10px; font-weight: 600; border-bottom: 1px solid #e4e7ed; width: 25%;">公司</td>
          <td style="padding: 10px; border-bottom: 1px solid #e4e7ed;">${props.position?.company || '-'}</td>
        </tr>
        <tr>
          <td style="background: #f5f7fa; padding: 10px; font-weight: 600; border-bottom: 1px solid #e4e7ed;">城市</td>
          <td style="padding: 10px; border-bottom: 1px solid #e4e7ed;">${props.position?.location || '-'}</td>
        </tr>
        <tr>
          <td style="background: #f5f7fa; padding: 10px; font-weight: 600; border-bottom: 1px solid #e4e7ed;">薪资</td>
          <td style="padding: 10px; border-bottom: 1px solid #e4e7ed;">${props.position?.salary || '-'}</td>
        </tr>
        <tr>
          <td style="background: #f5f7fa; padding: 10px; font-weight: 600; border-bottom: 1px solid #e4e7ed;">匹配度</td>
          <td style="padding: 10px; border-bottom: 1px solid #e4e7ed; color: #409eff; font-weight: bold;">${matchScore.value}%</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #303133; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed;">维度得分详情</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
        <thead>
          <tr>
            <th style="background: #f5f7fa; padding: 10px; text-align: left; font-weight: 600; font-size: 13px; border-bottom: 2px solid #e4e7ed;">维度</th>
            <th style="background: #f5f7fa; padding: 10px; text-align: left; font-weight: 600; font-size: 13px; border-bottom: 2px solid #e4e7ed;">我的得分</th>
            <th style="background: #f5f7fa; padding: 10px; text-align: left; font-weight: 600; font-size: 13px; border-bottom: 2px solid #e4e7ed;">岗位要求</th>
            <th style="background: #f5f7fa; padding: 10px; text-align: left; font-weight: 600; font-size: 13px; border-bottom: 2px solid #e4e7ed;">差距</th>
            <th style="background: #f5f7fa; padding: 10px; text-align: left; font-weight: 600; font-size: 13px; border-bottom: 2px solid #e4e7ed;">建议</th>
          </tr>
        </thead>
        <tbody>
          ${matchDetails.value.map(d => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e4e7ed; font-size: 13px;">${d.dimension}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e7ed; font-size: 13px;">${d.student}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e7ed; font-size: 13px;">${d.position}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e7ed; font-size: 13px; color: ${d.deficit > 0 ? '#f56c6c' : '#67c23a'}; font-weight: bold;">${d.deficit > 0 ? `-${d.deficit}` : '✓'}</td>
              <td style="padding: 10px; border-bottom: 1px solid #e4e7ed; font-size: 13px;">${d.suggestion}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${missingSkills.value.length ? `
      <div style="margin-bottom: 30px;">
        <h2 style="font-size: 18px; color: #303133; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed;">待补充技能</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0;">
          ${missingSkills.value.map(s => `<span style="display: inline-block; padding: 4px 10px; background: #fef0f0; border-radius: 4px; font-size: 12px; color: #f56c6c;">${s}</span>`).join('')}
        </div>
      </div>
    ` : ''}

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: #303133; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 1px solid #e4e7ed;">个性化行动计划</h2>
      <div style="margin: 15px 0;">
        ${actionPlans.value.map(plan => `
          <div style="margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #409eff;">
            <div style="font-weight: 600; color: #303133; margin-bottom: 8px;">${plan.period} - ${plan.title}</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #606266; line-height: 1.8;">
              ${plan.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  `

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= 297

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
    }

    pdf.save(`匹配报告_${props.position?.name || '岗位'}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}
</script>

<style scoped>
.pos-analysis { padding-bottom: 20px; }
.card-header-flex { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
.legend-row { display: flex; align-items: center; font-size: 13px; color: #606266; }
.legend-dot { width: 12px; height: 3px; border-radius: 2px; display: inline-block; }
.score-card { text-align: center; }
.score-wrap { display: flex; flex-direction: column; align-items: center; padding: 10px 0; }
.score-inner { text-align: center; }
.score-num { font-size: 38px; font-weight: 700; color: #303133; }
.score-unit { font-size: 18px; color: #909399; }
.score-desc { font-size: 13px; color: #606266; margin-top: 10px; text-align: center; max-width: 200px; }
.job-info-list { display: flex; flex-direction: column; gap: 10px; }
.job-info-item { display: flex; gap: 8px; font-size: 14px; }
.job-info-item label { color: #909399; width: 40px; flex-shrink: 0; }
.job-info-item span { color: #303133; }
.salary { color: #f56c6c; font-weight: 600; }
.progress-row { display: flex; align-items: center; gap: 6px; }
.dim-val { font-size: 12px; color: #909399; width: 24px; text-align: right; }
</style>
