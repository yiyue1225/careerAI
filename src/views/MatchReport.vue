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

    <!-- 报告对话框（优化后） -->
    <el-dialog v-model="showReportDialog" title="职业生涯发展报告" width="70%" class="report-dialog">
      <div id="reportContent" ref="reportContent" style="font-family: 'Microsoft YaHei', sans-serif; padding: 20px; background: #fff;">
        <!-- 页眉 -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 28px; color: #303133; margin: 0;">职业生涯发展报告</h1>
          <p style="color: #909399; font-size: 14px; margin-top: 8px;">生成时间：{{ new Date().toLocaleDateString() }}</p>
        </div>

        <!-- 个人与目标信息卡片 -->
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; background: #f5f7fa; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #409eff;">👤 学生信息</h3>
            <p style="margin: 8px 0;"><strong>姓名：</strong>{{ studentProfile?.name || '未填写' }}</p>
            <p style="margin: 8px 0;"><strong>专业：</strong>{{ studentProfile?.major || '未填写' }}</p>
            <p style="margin: 8px 0;"><strong>年级：</strong>{{ studentProfile?.grade || '未填写' }}</p>
          </div>
          <div style="flex: 1; background: #f5f7fa; padding: 20px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #e6a23c;">🎯 目标岗位</h3>
            <p style="margin: 8px 0;"><strong>岗位名称：</strong>{{ targetPosition?.name || '未选择' }}</p>
            <p style="margin: 8px 0;"><strong>公司：</strong>{{ targetPosition?.company || '无' }}</p>
            <p style="margin: 8px 0;"><strong>行业：</strong>{{ targetPosition?.industry || '无' }}</p>
          </div>
        </div>

        <!-- 匹配分析 -->
        <div style="background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: #67c23a;">📊 人岗匹配分析</h3>
          <div style="display: flex; align-items: center; gap: 30px;">
            <!-- 环形进度图（自定义绘制） -->
            <div style="position: relative; width: 120px; height: 120px;">
              <el-progress type="dashboard" :percentage="matchScore" :color="colors" :width="120" :stroke-width="10">
                <template #default>{{ matchScore }}%</template>
              </el-progress>
            </div>
            <div style="flex: 1;">
              <p><strong>综合匹配度：</strong>{{ matchScore }}%</p>
              <p><strong>优势维度：</strong>
                <span v-for="(item, idx) in advantageDimensions" :key="idx" style="background: #ecf5ff; color: #409eff; padding: 2px 8px; border-radius: 12px; margin-right: 8px;">{{ item }}</span>
              </p>
              <p><strong>待提升维度：</strong>
                <span v-for="(item, idx) in weaknessDimensions" :key="idx" style="background: #fef0f0; color: #f56c6c; padding: 2px 8px; border-radius: 12px; margin-right: 8px;">{{ item }}</span>
              </p>
            </div>
          </div>

          <!-- 匹配详情表格（简表） -->
          <div style="margin-top: 20px;">
            <h4 style="margin-bottom: 10px;">详细维度对比</h4>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #ebeef5;">
              <thead>
                <tr style="background: #f5f7fa;">
                  <th style="padding: 10px; text-align: left;">维度</th>
                  <th style="padding: 10px; text-align: left;">学生得分</th>
                  <th style="padding: 10px; text-align: left;">岗位要求</th>
                  <th style="padding: 10px; text-align: left;">差距</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in matchDetails" :key="item.dimension">
                  <td style="padding: 8px; border-bottom: 1px solid #ebeef5;">{{ item.dimension }}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ebeef5;">{{ item.student }}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ebeef5;">{{ item.position }}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ebeef5;">{{ item.gap }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 发展路径 -->
        <div style="background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: #f56c6c;">🚀 发展路径</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 15px; padding-left: 20px; border-left: 3px solid #409eff;">
              <strong>初级 → 高级：</strong> 1-3年，掌握核心技能，参与项目开发
            </li>
            <li style="margin-bottom: 15px; padding-left: 20px; border-left: 3px solid #e6a23c;">
              <strong>高级 → 技术主管：</strong> 3-5年，具备架构设计能力，带领团队
            </li>
            <li style="margin-bottom: 15px; padding-left: 20px; border-left: 3px solid #67c23a;">
              <strong>横向转换：</strong> 大数据开发、前端开发、产品经理
            </li>
          </ul>
        </div>

        <!-- 行动计划 -->
        <div style="background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: #909399;">📅 行动计划</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f5f7fa;">
                <th style="padding: 10px; text-align: left;">阶段</th>
                <th style="padding: 10px; text-align: left;">学习路径</th>
                <th style="padding: 10px; text-align: left;">实践安排</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #ebeef5;">短期（1年内）</td>
                <td style="padding: 10px; border-bottom: 1px solid #ebeef5;">Java进阶、Spring Cloud</td>
                <td style="padding: 10px; border-bottom: 1px solid #ebeef5;">参与开源项目、找实习</td>
              </tr>
              <tr>
                <td style="padding: 10px;">中期（2-3年）</td>
                <td style="padding: 10px;">系统设计、分布式架构</td>
                <td style="padding: 10px;">成为核心开发、考取证书</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 评估指标 -->
        <div style="background: #fef0f0; border-radius: 8px; padding: 15px; color: #f56c6c;">
          <strong>📌 评估周期与指标：</strong> 每季度复盘技能掌握度、项目经验、面试表现
        </div>
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
  const pos = targetPosition.value
  return dims.map((d, idx) => {
    const s = studentProfile.dimensions[d as keyof typeof studentProfile.dimensions] || 0
    const p = pos.dimensions[d as keyof typeof pos.dimensions] || 0
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

// 计算优势维度和待提升维度（用于报告中标签展示）
const advantageDimensions = computed(() => {
  if (!matchDetails.value) return []
  return matchDetails.value
    .filter(item => item.gap === '满足' && item.student >= 80)
    .map(item => item.dimension)
    .slice(0, 3)
})

const weaknessDimensions = computed(() => {
  if (!matchDetails.value) return []
  return matchDetails.value
    .filter(item => item.gap !== '满足')
    .map(item => item.dimension)
    .slice(0, 3)
})

// 其他推荐岗位
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
  const pos = targetPosition.value
  const total = Object.keys(studentProfile.dimensions).reduce((acc, key) => {
    const s = studentProfile.dimensions[key as keyof typeof studentProfile.dimensions]
    const j = pos.dimensions[key as keyof typeof pos.dimensions]
    return acc + Math.min(s, j) / j
  }, 0)
  matchScore.value = Math.round((total / Object.keys(studentProfile.dimensions).length) * 100)
}

watch(selectedPositionId, () => {
  refreshMatch()
})

const showReportDialog = ref(false)
const reportContent = ref<HTMLElement>()
const exportPDF = () => {
  if (reportContent.value) {
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
      filename: '职业发展报告.pdf',
      image: {
        type: 'jpeg' as const,   // 关键修复
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
        letterRendering: true,
        useCORS: true,
        logging: false,
      },
      jsPDF: {
        unit: 'in',
        format: 'a4',
        orientation: 'portrait' as const,
      },
    }
    html2pdf().set(opt).from(reportContent.value).save()
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
/* 报告对话框样式（覆盖原有） */
.report-dialog :deep(.el-dialog__body) {
  padding: 0;
}
.report-content {
  font-family: 'Microsoft YaHei', sans-serif;
}
</style>