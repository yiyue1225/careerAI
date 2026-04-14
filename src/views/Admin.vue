<template>
  <div class="admin">
    <div class="admin-header">
      <h1 class="page-title">管理后台</h1>
      <p class="page-subtitle">平台数据概览 · 实时监控 · 内容管理</p>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="admin-tabs">
      <!-- ===== Tab 1：数据概览 ===== -->
      <el-tab-pane label="📊 数据概览" name="overview">
        <!-- 顶部统计卡片 -->
        <el-row :gutter="20" class="stat-cards">
          <el-col :span="6" v-for="(card, i) in topCards" :key="i">
            <el-card class="stat-card" shadow="hover">
              <div class="stat-card-body">
                <el-icon :size="36" :color="card.color"><component :is="card.icon" /></el-icon>
                <div class="stat-text">
                  <div class="stat-value">{{ card.value }}</div>
                  <div class="stat-label">{{ card.label }}</div>
                </div>
              </div>
              <div class="stat-trend" :style="{ color: card.trend > 0 ? '#67c23a' : '#f56c6c' }">
                {{ card.trend > 0 ? '↑' : '↓' }} {{ Math.abs(card.trend) }}% 较上周
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <el-col :span="14">
            <el-card shadow="hover" class="chart-card">
              <template #header><span>📈 近14天用户注册趋势</span></template>
              <div ref="lineRef" style="height:260px"></div>
            </el-card>
          </el-col>
          <el-col :span="10">
            <el-card shadow="hover" class="chart-card">
              <template #header><span>🎯 学生最想投递的岗位 Top8</span></template>
              <div ref="jobBarRef" style="height:260px"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <el-col :span="10">
            <el-card shadow="hover" class="chart-card">
              <template #header><span>🏆 最吃香职位薪资排行（真实数据）</span></template>
              <div ref="salaryRef" style="height:300px"></div>
            </el-card>
          </el-col>
          <el-col :span="14">
            <el-card shadow="hover" class="chart-card">
              <template #header><span>🏭 热门行业岗位分布（真实数据）</span></template>
              <div ref="pieRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" class="chart-row">
          <el-col :span="12">
            <el-card shadow="hover" class="chart-card">
              <template #header><span>🎓 学生能力维度平均分布（模拟样本）</span></template>
              <RadarChart :data="studentRadarData" />
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="hover" class="chart-card">
              <template #header><span>📊 学生学历分布</span></template>
              <div ref="eduRef" style="height:300px"></div>
            </el-card>
          </el-col>
        </el-row>

        <el-card shadow="hover" style="margin-top:20px">
          <template #header><span>👥 最近注册用户（模拟数据）</span></template>
          <el-table :data="recentUsers" stripe size="small">
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="name" label="姓名" width="80" />
            <el-table-column prop="major" label="专业" />
            <el-table-column prop="school" label="学校" />
            <el-table-column prop="targetJob" label="目标岗位" />
            <el-table-column prop="matchScore" label="匹配度" width="120">
              <template #default="{ row }">
                <el-progress :percentage="row.matchScore" :stroke-width="6" />
              </template>
            </el-table-column>
            <el-table-column prop="registerTime" label="注册时间" width="160" />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === '活跃' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <!-- ===== Tab 2：岗位管理 ===== -->
      <el-tab-pane label="💼 岗位管理" name="positions">
        <div class="crud-toolbar">
          <el-input v-model="posSearch" placeholder="搜索岗位名称/公司" clearable style="width:260px" @keyup.enter="loadPositions" @clear="loadPositions">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" :icon="Search" @click="loadPositions">搜索</el-button>
          <el-button type="success" :icon="Plus" @click="openAddDialog">新增岗位</el-button>
        </div>

        <el-table :data="posList" stripe border v-loading="posLoading" style="width:100%">
          <el-table-column prop="id" label="ID" width="70" />
          <el-table-column prop="job_name" label="岗位名称" min-width="150" />
          <el-table-column prop="company_name" label="公司" min-width="130" />
          <el-table-column prop="city" label="城市" width="90" />
          <el-table-column prop="salary" label="薪资" width="110" />
          <el-table-column prop="industry" label="行业" min-width="120" show-overflow-tooltip />
          <el-table-column label="专业技能" min-width="200">
            <template #default="{ row }">
              <el-tag v-for="s in (row.requirements?.professionalSkills || []).slice(0,3)" :key="s" size="small" style="margin:2px">{{ s }}</el-tag>
              <span v-if="(row.requirements?.professionalSkills || []).length > 3" style="color:#909399;font-size:12px"> +{{ row.requirements.professionalSkills.length - 3 }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openEditDialog(row)">编辑</el-button>
              <el-popconfirm title="确定删除该岗位？" @confirm="deletePosition(row.id)">
                <template #reference>
                  <el-button type="danger" link size="small">删除</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          background layout="prev, pager, next, total"
          :total="posTotal" :page-size="posPageSize"
          v-model:current-page="posPage"
          @current-change="loadPositions"
          style="margin-top:16px;justify-content:flex-end;display:flex"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 新增/编辑岗位弹窗 -->
    <el-dialog v-model="posDialogVisible" :title="editingPos.id ? '编辑岗位' : '新增岗位'" width="600px" @close="resetForm">
      <el-form :model="editingPos" :rules="posRules" ref="posFormRef" label-width="90px" size="default">
        <el-form-item label="岗位名称" prop="job_name">
          <el-input v-model="editingPos.job_name" placeholder="如：Java后端工程师" />
        </el-form-item>
        <el-form-item label="公司名称">
          <el-input v-model="editingPos.company_name" placeholder="如：字节跳动" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="城市">
              <el-input v-model="editingPos.city" placeholder="如：北京" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资">
              <el-input v-model="editingPos.salary" placeholder="如：15-25K" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="行业">
          <el-input v-model="editingPos.industry" placeholder="如：互联网/计算机软件" />
        </el-form-item>
        <el-form-item label="专业技能">
          <el-select v-model="editingPos.skillList" multiple filterable allow-create default-first-option placeholder="输入技能后回车添加" style="width:100%">
            <el-option v-for="s in commonSkills" :key="s" :label="s" :value="s" />
          </el-select>
        </el-form-item>
        <el-divider>能力维度要求（0-100）</el-divider>
        <el-row :gutter="12">
          <el-col :span="12" v-for="dim in dimFields" :key="dim.key">
            <el-form-item :label="dim.label">
              <el-slider v-model="editingPos.dimensions[dim.key]" :min="0" :max="100" show-input input-size="small" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="posDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="savePosition">{{ editingPos.id ? '保存修改' : '确认新增' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { Briefcase, User, TrendCharts, Location, Search, Plus } from '@element-plus/icons-vue'
import RadarChart from '@/components/RadarChart.vue'

const activeTab = ref('overview')

// ==========================================
// 顶部统计卡片（混合真实 + 模拟数据）
// ==========================================
const topCards = ref([
  { icon: Briefcase, label: '岗位总数', value: '加载中...', color: '#409eff', trend: 12 },
  { icon: User,      label: '注册学生', value: '2,847',     color: '#67c23a', trend: 8 },
  { icon: TrendCharts, label: '简历上传次数', value: '1,203',  color: '#e6a23c', trend: 15 },
  { icon: Location,  label: '覆盖城市', value: '加载中...', color: '#f56c6c', trend: 3 },
])

const loadRealStats = async () => {
  try {
    const res = await axios.get('/api/stats')
    if (res.data.code === 0) {
      topCards.value[0].value = Number(res.data.data.totalPositions).toLocaleString('zh-CN') + '+'
      topCards.value[3].value = res.data.data.totalCities + ' 个'
    }
  } catch {}
}

// ==========================================
// 图表 refs
// ==========================================
const lineRef = ref<HTMLElement>()
const jobBarRef = ref<HTMLElement>()
const salaryRef = ref<HTMLElement>()
const pieRef = ref<HTMLElement>()
const eduRef = ref<HTMLElement>()
let charts: echarts.ECharts[] = []

// ==========================================
// 折线图：近14天注册（模拟）
// ==========================================
const initLineChart = () => {
  if (!lineRef.value) return
  const c = echarts.init(lineRef.value)
  charts.push(c)
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 13 + i)
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  const vals = [32, 45, 38, 67, 89, 103, 78, 120, 95, 134, 112, 156, 143, 178]
  c.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: days, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 11 } },
    series: [{
      data: vals, type: 'line', smooth: true,
      lineStyle: { color: '#409eff', width: 3 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(64,158,255,0.3)' }, { offset: 1, color: 'rgba(64,158,255,0.02)' }] } },
      itemStyle: { color: '#409eff' },
      symbol: 'circle', symbolSize: 5,
    }]
  })
}

// ==========================================
// 柱状图：学生最想投递岗位（模拟）
// ==========================================
const initJobBarChart = () => {
  if (!jobBarRef.value) return
  const c = echarts.init(jobBarRef.value)
  charts.push(c)
  const jobs = ['Java后端工程师', '前端开发工程师', '数据分析师', '产品经理', '算法工程师', '测试工程师', '运维工程师', '大数据开发'].reverse()
  const vals = [342, 289, 256, 198, 176, 134, 98, 87].reverse()
  c.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '10%', top: 10, bottom: 10, containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: jobs, axisLabel: { fontSize: 11 } },
    series: [{
      type: 'bar', data: vals,
      itemStyle: { color: (p: any) => ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4'][p.dataIndex % 8], borderRadius: [0, 4, 4, 0] },
      label: { show: true, position: 'right', fontSize: 11, color: '#666' }
    }]
  })
}

// ==========================================
// 薪资排行（真实数据）
// ==========================================
const initSalaryChart = async () => {
  if (!salaryRef.value) return
  const c = echarts.init(salaryRef.value)
  charts.push(c)
  try {
    const res = await axios.get('/api/top-salary')
    if (res.data.code === 0) {
      const data = res.data.data.slice(0, 8).reverse()
      c.setOption({
        tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>平均薪资 ${p[0].value}K` },
        grid: { left: '3%', right: '12%', top: 10, bottom: 10, containLabel: true },
        xAxis: { type: 'value', axisLabel: { formatter: (v: number) => v + 'K' } },
        yAxis: { type: 'category', data: data.map((d: any) => d.name), axisLabel: { fontSize: 11, width: 100, overflow: 'truncate' } },
        series: [{
          type: 'bar', data: data.map((d: any) => d.avg_salary),
          itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#f56c6c' }, { offset: 1, color: '#fac858' }] }, borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', formatter: (p: any) => p.value + 'K', fontSize: 11 }
        }]
      })
    }
  } catch {}
}

// ==========================================
// 行业饼图（真实数据）
// ==========================================
const initPieChart = async () => {
  if (!pieRef.value) return
  const c = echarts.init(pieRef.value)
  charts.push(c)
  try {
    const res = await axios.get('/api/industry-stats')
    if (res.data.code === 0) {
      c.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', right: 10, top: 'center', type: 'scroll', itemWidth: 12, textStyle: { fontSize: 11 } },
        series: [{
          type: 'pie', radius: ['35%', '65%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: res.data.data.slice(0, 12),
          emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } }
        }]
      })
    }
  } catch {}
}

// ==========================================
// 学历分布（模拟）
// ==========================================
const initEduChart = () => {
  if (!eduRef.value) return
  const c = echarts.init(eduRef.value)
  charts.push(c)
  c.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { bottom: 10, type: 'scroll' },
    series: [{
      type: 'pie', radius: ['40%', '65%'],
      data: [
        { value: 1245, name: '本科（计算机类）' },
        { value: 678, name: '本科（非计算机）' },
        { value: 534, name: '硕士研究生' },
        { value: 289, name: '专科' },
        { value: 101, name: '博士' },
      ],
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } }
    }]
  })
}

// ==========================================
// 学生能力维度雷达（模拟平均值）
// ==========================================
const studentRadarData = {
  indicator: [
    { name: '专业技能', max: 100 }, { name: '证书', max: 100 }, { name: '创新能力', max: 100 },
    { name: '学习能力', max: 100 }, { name: '抗压能力', max: 100 }, { name: '沟通能力', max: 100 }, { name: '实习经验', max: 100 }
  ],
  series: [
    { name: '平均水平', data: [[72, 58, 65, 78, 70, 74, 55]] },
    { name: '优秀学生', data: [[88, 80, 82, 90, 85, 86, 78]] },
  ]
}

// ==========================================
// 模拟用户数据
// ==========================================
const recentUsers = [
  { id: 1, name: '张同学', major: '计算机科学', school: '华中科技大学', targetJob: 'Java后端工程师', matchScore: 82, registerTime: '2025-04-13 14:32', status: '活跃' },
  { id: 2, name: '李同学', major: '软件工程', school: '武汉大学', targetJob: '前端开发工程师', matchScore: 76, registerTime: '2025-04-13 11:15', status: '活跃' },
  { id: 3, name: '王同学', major: '数据科学', school: '浙江大学', targetJob: '数据分析师', matchScore: 89, registerTime: '2025-04-12 20:48', status: '活跃' },
  { id: 4, name: '陈同学', major: '人工智能', school: '上海交通大学', targetJob: '算法工程师', matchScore: 91, registerTime: '2025-04-12 16:22', status: '活跃' },
  { id: 5, name: '刘同学', major: '信息管理', school: '中南大学', targetJob: '产品经理', matchScore: 67, registerTime: '2025-04-11 09:10', status: '普通' },
  { id: 6, name: '赵同学', major: '网络工程', school: '电子科技大学', targetJob: '运维工程师', matchScore: 73, registerTime: '2025-04-11 08:55', status: '活跃' },
  { id: 7, name: '孙同学', major: '软件工程', school: '同济大学', targetJob: '测试工程师', matchScore: 85, registerTime: '2025-04-10 15:44', status: '普通' },
  { id: 8, name: '周同学', major: '计算机科学', school: '南京大学', targetJob: '后端工程师', matchScore: 79, registerTime: '2025-04-10 10:30', status: '活跃' },
]

// ==========================================
// 生命周期
// ==========================================
const handleResize = () => charts.forEach(c => c.resize())

onMounted(async () => {
  await loadRealStats()
  initLineChart()
  initJobBarChart()
  await Promise.all([initSalaryChart(), initPieChart()])
  initEduChart()
  window.addEventListener('resize', handleResize)
  loadPositions()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  charts.forEach(c => c.dispose())
  charts = []
})

// ==========================================
// 岗位管理 CRUD
// ==========================================
const adminToken = localStorage.getItem('adminToken') || ''
const authHeaders = { Authorization: `Bearer ${adminToken}` }

const posList = ref<any[]>([])
const posTotal = ref(0)
const posPage = ref(1)
const posPageSize = 15
const posSearch = ref('')
const posLoading = ref(false)
const posDialogVisible = ref(false)
const saving = ref(false)
const posFormRef = ref<FormInstance>()

const dimFields = [
  { key: 'professional', label: '专业技能' },
  { key: 'certificate', label: '证书' },
  { key: 'innovation', label: '创新能力' },
  { key: 'learning', label: '学习能力' },
  { key: 'stress', label: '抗压能力' },
  { key: 'communication', label: '沟通能力' },
  { key: 'internship', label: '实习经验' },
]

const commonSkills = ['Java', 'Python', 'JavaScript', 'TypeScript', 'Vue', 'React', 'Spring Boot',
  'MySQL', 'Redis', 'Docker', 'Linux', 'Go', 'C++', 'Node.js', 'MongoDB', 'Kubernetes']

const defaultEditingPos = () => ({
  id: null,
  job_name: '', company_name: '', city: '', salary: '', industry: '',
  skillList: [] as string[],
  dimensions: { professional: 70, certificate: 50, innovation: 60, learning: 75, stress: 65, communication: 70, internship: 50 }
})
const editingPos = ref(defaultEditingPos())

const posRules = {
  job_name: [{ required: true, message: '岗位名称不能为空', trigger: 'blur' }]
}

const loadPositions = async () => {
  posLoading.value = true
  try {
    const res = await axios.get('/api/admin/positions', {
      headers: authHeaders,
      params: { page: posPage.value, size: posPageSize, search: posSearch.value }
    })
    if (res.data.code === 0) {
      posList.value = res.data.data
      posTotal.value = res.data.total
    }
  } catch {
    ElMessage.error('加载岗位数据失败')
  } finally {
    posLoading.value = false
  }
}

const openAddDialog = () => {
  editingPos.value = defaultEditingPos()
  posDialogVisible.value = true
}

const openEditDialog = (row: any) => {
  editingPos.value = {
    id: row.id,
    job_name: row.job_name,
    company_name: row.company_name,
    city: row.city,
    salary: row.salary,
    industry: row.industry,
    skillList: row.requirements?.professionalSkills || [],
    dimensions: { ...{ professional: 70, certificate: 50, innovation: 60, learning: 75, stress: 65, communication: 70, internship: 50 }, ...row.dimensions }
  }
  posDialogVisible.value = true
}

const resetForm = () => {
  editingPos.value = defaultEditingPos()
  posFormRef.value?.resetFields()
}

const savePosition = async () => {
  if (!posFormRef.value) return
  await posFormRef.value.validate(async (valid) => {
    if (!valid) return
    saving.value = true
    try {
      const payload = {
        job_name: editingPos.value.job_name,
        company_name: editingPos.value.company_name,
        city: editingPos.value.city,
        salary: editingPos.value.salary,
        industry: editingPos.value.industry,
        requirements: { professionalSkills: editingPos.value.skillList, certificates: [] },
        dimensions: editingPos.value.dimensions,
      }
      if (editingPos.value.id) {
        await axios.put(`/api/admin/positions/${editingPos.value.id}`, payload, { headers: authHeaders })
        ElMessage.success('修改成功')
      } else {
        await axios.post('/api/admin/positions', payload, { headers: authHeaders })
        ElMessage.success('新增成功')
      }
      posDialogVisible.value = false
      loadPositions()
    } catch {
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
    }
  })
}

const deletePosition = async (id: number) => {
  try {
    await axios.delete(`/api/admin/positions/${id}`, { headers: authHeaders })
    ElMessage.success('已删除')
    loadPositions()
  } catch {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.admin {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}
.admin-header { margin-bottom: 16px; }
.page-title { font-size: 32px; font-weight: 600; color: #303133; margin: 0 0 6px; }
.page-subtitle { color: #909399; font-size: 14px; }

.admin-tabs { border-radius: 12px; }
.admin-tabs :deep(.el-tabs__content) { padding: 20px; }

/* 统计卡片 */
.stat-cards { margin-bottom: 20px; }
.stat-card { border-radius: 14px; transition: transform 0.3s; }
.stat-card:hover { transform: translateY(-4px); }
.stat-card-body { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.stat-text { flex: 1; }
.stat-value { font-size: 28px; font-weight: 700; color: #303133; line-height: 1.2; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }
.stat-trend { font-size: 12px; }

/* 图表 */
.chart-row { margin-bottom: 20px; }
.chart-card { border-radius: 14px; }
.chart-card :deep(.el-card__header) { font-weight: 600; background: #fafbff; }

/* CRUD */
.crud-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
</style>
