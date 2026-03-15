<template>
  <div class="match-report">
    <!-- 步骤指示器（卡片式） -->
    <el-row :gutter="20" class="steps">
      <el-col :span="6" v-for="(step, index) in steps" :key="index">
        <div class="step-item" :class="{ active: activeStep === index, done: activeStep > index }">
          <div class="step-number">{{ index + 1 }}</div>
          <div class="step-info">
            <span class="step-title">{{ step }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 步骤内容 -->
    <div class="step-content">
      <!-- 步骤0：选择岗位 -->
      <div v-if="activeStep === 0" class="step-pane">
        <h3>选择您感兴趣的目标岗位</h3>
        <el-select v-model="selectedPositionId" placeholder="请选择" size="large" style="width: 300px">
          <el-option v-for="p in positions" :key="p.id" :label="p.name" :value="p.id" />
        </el-select>
        <div class="actions">
          <el-button type="primary" @click="nextStep" :disabled="!selectedPositionId">下一步</el-button>
        </div>
      </div>

      <!-- 步骤1：人岗匹配分析 -->
      <div v-if="activeStep === 1" class="step-pane">
        <h3>人岗匹配度分析</h3>
        <el-row :gutter="20">
          <el-col :span="16">
            <RadarChart :data="matchRadarData" />
          </el-col>
          <el-col :span="8">
            <el-card class="match-score-card" shadow="hover">
              <template #header>综合匹配度</template>
              <div class="big-score">
                <el-progress type="dashboard" :percentage="matchScore" :color="colors" :width="150" />
              </div>
            </el-card>
          </el-col>
        </el-row>

        <h4>详细对比</h4>
        <el-table :data="matchDetails" stripe border style="width:100%">
          <el-table-column prop="dimension" label="维度" />
          <el-table-column prop="student" label="学生得分" />
          <el-table-column prop="position" label="岗位要求" />
          <el-table-column prop="gap" label="差距" />
          <el-table-column prop="suggestion" label="建议" />
        </el-table>

        <h4>其他推荐岗位</h4>
        <el-row :gutter="20">
          <el-col :span="8" v-for="job in otherJobs" :key="job.id">
            <el-card class="job-card" shadow="hover" @click="selectedPositionId = job.id; refreshMatch()">
              <h4>{{ job.name }}</h4>
              <p>匹配度：{{ job.matchScore }}%</p>
              <el-progress :percentage="job.matchScore" :color="colors" :stroke-width="8" />
            </el-card>
          </el-col>
        </el-row>

        <div class="actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>

      <!-- 步骤2：职业发展路径 -->
      <div v-if="activeStep === 2" class="step-pane">
        <h3>职业发展路径</h3>
        <RelationGraph :nodes="graph.nodes" :links="graph.links" />
        <el-descriptions title="行业趋势" :column="2" border class="trend-info">
          <el-descriptions-item label="社会需求">未来5年需求增长20%</el-descriptions-item>
          <el-descriptions-item label="薪资趋势">平均每年涨幅8%</el-descriptions-item>
          <el-descriptions-item label="热门城市">北京、上海、深圳</el-descriptions-item>
          <el-descriptions-item label="紧缺技能">分布式系统、AI算法</el-descriptions-item>
        </el-descriptions>
        <div class="actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>

      <!-- 步骤3：行动计划 -->
      <div v-if="activeStep === 3" class="step-pane">
        <h3>个性化行动计划</h3>
        <el-timeline>
          <el-timeline-item timestamp="短期 (1年内)" placement="top" type="primary">
            <el-card>
              <p>学习路径：完成Java进阶课程，掌握Spring Cloud</p>
              <p>实践安排：参与开源项目或找一份后端实习</p>
            </el-card>
          </el-timeline-item>
          <el-timeline-item timestamp="中期 (2-3年)" placement="top" type="success">
            <el-card>
              <p>学习路径：学习系统设计、分布式架构</p>
              <p>实践安排：争取成为项目核心开发，考取相关证书</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <h4>评估周期与指标</h4>
        <p>每季度复盘：技能掌握度、项目经验、面试表现</p>
        <el-button type="primary" @click="showReportDialog = true">生成完整报告</el-button>
      </div>
    </div>

    <!-- 报告对话框 -->
    <el-dialog v-model="showReportDialog" title="职业生涯发展报告" width="60%" class="report-dialog">
      <div id="reportContent" ref="reportContent" class="report-content">
        <h2>职业生涯发展报告</h2>
        <p class="date">生成时间：{{ new Date().toLocaleDateString() }}</p>
        <h3>一、职业目标</h3>
        <p>目标岗位：{{ targetPosition?.name }}</p>
        <h3>二、人岗匹配分析</h3>
        <p>综合匹配度：{{ matchScore }}%</p>
        <h3>三、发展路径</h3>
        <ul>
          <li>初级 → 高级 → 技术主管</li>
          <li>可转换方向：大数据开发、前端开发</li>
        </ul>
        <h3>四、行动计划</h3>
        <p>短期：完成Java进阶课程，掌握Spring Cloud；参与开源项目或找一份后端实习。</p>
        <p>中期：学习系统设计、分布式架构；争取成为项目核心开发，考取相关证书。</p>
      </div>
      <template #footer>
        <el-button @click="showReportDialog = false">取消</el-button>
        <el-button type="primary" @click="exportPDF">导出PDF</el-button>
        <el-button type="success" @click="smartPolish">智能润色</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { positions, getPositionById } from '@/mock/positions'
import { graphData } from '@/mock/graph'
import { useUserStore } from '@/store'
import RadarChart from '@/components/RadarChart.vue'
import RelationGraph from '@/components/RelationGraph.vue'
import html2pdf from 'html2pdf.js'
import { ElMessage } from 'element-plus'

const steps = ['选择岗位', '匹配分析', '发展路径', '行动计划']

const activeStep = ref(0)
const selectedPositionId = ref('')
const userStore = useUserStore()
const studentProfile = userStore.studentProfile
const targetPosition = computed(() => getPositionById(selectedPositionId.value))

const matchScore = ref(78)
const colors = [
  { color: '#f56c6c', percentage: 60 },
  { color: '#e6a23c', percentage: 80 },
  { color: '#5cb87a', percentage: 100 },
]

const matchRadarData = computed(() => {
  if (!studentProfile || !targetPosition.value) return { indicator: [], series: [] }
  return {
    indicator: [
      { name: '专业技能', max: 100 },
      { name: '证书', max: 100 },
      { name: '创新能力', max: 100 },
      { name: '学习能力', max: 100 },
      { name: '抗压能力', max: 100 },
      { name: '沟通能力', max: 100 },
      { name: '实习经验', max: 100 },
    ],
    series: [
  { name: '学生', value: Object.values(studentProfile.dimensions) as number[] },
  { name: targetPosition.value.name, value: Object.values(targetPosition.value.dimensions) as number[] },
    ]
  }
})

const matchDetails = computed(() => {
  if (!studentProfile || !targetPosition.value) return []
  const dims = ['professional', 'certificate', 'innovation', 'learning', 'stress', 'communication', 'internship']
  const dimNames = ['专业技能', '证书', '创新能力', '学习能力', '抗压能力', '沟通能力', '实习经验']
  const pos = targetPosition.value // 提取局部变量
  return dims.map((d, idx) => {
    const s = studentProfile.dimensions[d as keyof typeof studentProfile.dimensions] || 0
    const p = pos.dimensions[d as keyof typeof pos.dimensions] || 0 // 使用 pos 而不是 targetPosition.value
    const gap = p - s
    return {
      dimension: dimNames[idx],
      student: s,
      position: p,
      gap: gap > 0 ? `缺${gap}` : '满足',
      suggestion: gap > 0 ? `建议提升${gap}分` : '继续保持',
    }
  })
})

// 其他推荐岗位（简单计算匹配度）
const otherJobs = computed(() => {
  if (!studentProfile) return []
  return positions.filter(p => p.id !== selectedPositionId.value).slice(0, 3).map(p => {
    const total = Object.keys(studentProfile.dimensions).reduce((acc, key) => {
      const s = studentProfile.dimensions[key as keyof typeof studentProfile.dimensions]
      const j = p.dimensions[key as keyof typeof p.dimensions]
      return acc + Math.min(s, j) / j
    }, 0)
    const score = Math.round((total / Object.keys(studentProfile.dimensions).length) * 100)
    return { id: p.id, name: p.name, matchScore: score }
  })
})

const graph = graphData

const nextStep = () => {
  if (activeStep.value < 3) activeStep.value++
}
const prevStep = () => {
  if (activeStep.value > 0) activeStep.value--
}

const refreshMatch = () => {
  if (!studentProfile || !targetPosition.value) {
    matchScore.value = 0
    return
  }
  const pos = targetPosition.value // 存为局部变量，类型安全
  const total = Object.keys(studentProfile.dimensions).reduce((acc, key) => {
    const s = studentProfile.dimensions[key as keyof typeof studentProfile.dimensions]
    const j = pos.dimensions[key as keyof typeof pos.dimensions]
    return acc + Math.min(s, j) / j
  }, 0)
  matchScore.value = Math.round((total / Object.keys(studentProfile.dimensions).length) * 100)
}

const showReportDialog = ref(false)
const reportContent = ref<HTMLElement>()
const exportPDF = () => {
  if (reportContent.value) {
    html2pdf().from(reportContent.value).save('职业发展报告.pdf')
  }
}
const smartPolish = () => {
  ElMessage.success('报告已智能润色！')
}
</script>

<style scoped>
.match-report {
  padding: 20px;
}
.steps {
  margin-bottom: 30px;
}
.step-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  transition: all 0.3s;
}
.step-item.active {
  background: #409eff;
  color: white;
}
.step-item.active .step-number {
  background: white;
  color: #409eff;
}
.step-item.done {
  background: #f0f9eb;
  border-color: #67c23a;
}
.step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 10px;
}
.step-info {
  flex: 1;
}
.step-title {
  font-weight: 600;
}
.step-pane {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
}
.actions {
  margin-top: 30px;
  display: flex;
  justify-content: center;
  gap: 20px;
}
.match-score-card {
  text-align: center;
}
.big-score {
  padding: 10px 0;
}
.job-card {
  cursor: pointer;
  transition: transform 0.3s;
}
.job-card:hover {
  transform: translateY(-5px);
}
.trend-info {
  margin-top: 20px;
}
.report-dialog .report-content {
  padding: 20px;
  background: #fafafa;
  border-radius: 8px;
}
.report-content h2 {
  text-align: center;
}
.report-content .date {
  text-align: center;
  color: #909399;
}
</style>