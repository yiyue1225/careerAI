<template>
  <div class="position-library">
    <h1 class="page-title">岗位画像库</h1>
    <p class="page-subtitle">浏览 10,000+ 岗位，了解行业能力要求</p>

    <el-card class="filter-card" shadow="hover">
      <el-row :gutter="20" align="middle">
        <el-col :span="6">
          <el-input v-model="search" placeholder="搜索岗位名称" clearable @clear="applyFilter">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-col>
        <el-col :span="5">
          <el-select v-model="selectedIndustry" placeholder="行业" clearable filterable>
            <el-option v-for="ind in industries" :key="ind" :label="ind" :value="ind" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="selectedCity" placeholder="城市" clearable filterable>
            <el-option v-for="city in cities" :key="city" :label="city" :value="city" />
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-select v-model="selectedSalary" placeholder="薪资范围" clearable>
            <el-option label="10K以下" value="0-10" />
            <el-option label="10K-20K" value="10-20" />
            <el-option label="20K-30K" value="20-30" />
            <el-option label="30K以上" value="30+" />
          </el-select>
        </el-col>
        <el-col :span="3">
          <el-button type="primary" :icon="Search" @click="applyFilter">筛选</el-button>
        </el-col>
      </el-row>

      <!-- 排序栏 -->
      <div class="sort-bar">
        <span class="sort-label-text">排序：</span>
        <button :class="['sort-btn', sortField === 'name' ? 'sort-btn-active' : '']" @click="toggleSort('name')">
          岗位名称
          <span class="sort-arrows">
            <span :class="sortField === 'name' && sortOrder === 'asc' ? 'arrow-active' : ''">▲</span>
            <span :class="sortField === 'name' && sortOrder === 'desc' ? 'arrow-active' : ''">▼</span>
          </span>
        </button>
        <button :class="['sort-btn', sortField === 'salary' ? 'sort-btn-active' : '']" @click="toggleSort('salary')">
          薪资
          <span class="sort-arrows">
            <span :class="sortField === 'salary' && sortOrder === 'asc' ? 'arrow-active' : ''">▲</span>
            <span :class="sortField === 'salary' && sortOrder === 'desc' ? 'arrow-active' : ''">▼</span>
          </span>
        </button>
        <button :class="['sort-btn', sortField === 'match' ? 'sort-btn-active' : '']" @click="toggleSort('match')">
          匹配度
          <span class="sort-arrows">
            <span :class="sortField === 'match' && sortOrder === 'asc' ? 'arrow-active' : ''">▲</span>
            <span :class="sortField === 'match' && sortOrder === 'desc' ? 'arrow-active' : ''">▼</span>
          </span>
        </button>
        <button v-if="sortField" class="sort-btn sort-btn-clear" @click="sortField = ''">× 清除排序</button>
      </div>
    </el-card>

    <!-- 技能筛选芯片（从岗位详情跳转时显示） -->
    <div v-if="skillFilter" class="skill-filter-bar">
      <el-icon color="#409eff"><Filter /></el-icon>
      <span>正在筛选包含技能：</span>
      <el-tag type="primary" effect="dark" size="default">{{ skillFilter }}</el-tag>
      <el-button link size="small" style="margin-left:8px;color:#f56c6c" @click="skillFilter=''; applyFilter()">
        × 清除筛选
      </el-button>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-section">
      <el-col :span="14">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span><el-icon><PieChart /></el-icon> 热门行业岗位分布</span>
          </template>
          <div ref="pieChartRef" style="width: 100%; height: 260px;"></div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span><el-icon><TrendCharts /></el-icon> 市场最热门技能 Top 15</span>
          </template>
          <div ref="skillChartRef" style="width: 100%; height: 260px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 岗位列表 -->
    <div class="position-list" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="8" v-for="pos in positionsWithMatch" :key="pos.id">
          <el-card class="position-card" shadow="hover">
            <div class="card-header">
              <h3 @click="goToDetail(pos.id)" class="job-title-link">{{ pos.name }}</h3>
              <el-tag :type="getMatchLevelTag(pos.matchLevel)" size="small">
                匹配度 {{ pos.matchLevel }}%
              </el-tag>
            </div>
            <p class="company">{{ pos.company }} · {{ pos.location }}</p>
            <p class="salary">{{ pos.salary }}</p>
            <div class="skills">
              <el-tag size="small" v-for="skill in pos.requirements.professionalSkills.slice(0,4)" :key="skill">
                {{ skill }}
              </el-tag>
              <span v-if="pos.requirements.professionalSkills.length > 4" class="more-skills">
                +{{ pos.requirements.professionalSkills.length - 4 }}
              </span>
            </div>
            <div class="card-footer">
              <div class="industry-tags">
                <template v-if="pos.clean_industry && pos.clean_industry.length">
                  <el-tag v-for="tag in pos.clean_industry" :key="tag" size="small" type="info" class="industry-tag">
                    {{ tag }}
                  </el-tag>
                </template>
                <span v-else class="industry">{{ pos.industry }}</span>
              </div>
              <div class="card-actions">
                <el-button
                  size="small"
                  :type="compareList.some(c => c.id === pos.id) ? 'warning' : 'default'"
                  plain
                  @click.stop="toggleCompare(pos)"
                  :disabled="compareList.length >= 2 && !compareList.some(c => c.id === pos.id)"
                >
                  {{ compareList.some(c => c.id === pos.id) ? '取消对比' : '+ 对比' }}
                </el-button>
                <el-button type="text" size="small" @click="goToDetail(pos.id)">详情 <el-icon><ArrowRight /></el-icon></el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-pagination
      background
      layout="prev, pager, next, total"
      :total="totalPositions"
      :page-size="pageSize"
      v-model:current-page="currentPage"
      @current-change="handlePageChange"
      class="pagination"
    />

    <!-- 底部悬浮对比栏 -->
    <Transition name="slide-up">
      <div v-if="compareList.length > 0" class="compare-bar">
        <div class="compare-bar-items">
          <div v-for="pos in compareList" :key="pos.id" class="compare-bar-item">
            <span>{{ pos.name }}</span>
            <el-icon class="remove-icon" @click="toggleCompare(pos)"><CircleClose /></el-icon>
          </div>
          <div v-if="compareList.length < 2" class="compare-bar-placeholder">
            <el-icon><Plus /></el-icon> 再选一个岗位
          </div>
        </div>
        <el-button plain @click="compareList = []" round>清除全部</el-button>
        <el-button
          type="primary"
          :disabled="compareList.length < 2"
          @click="showCompareDialog = true"
          round
        >
          开始对比 ({{ compareList.length }}/2)
        </el-button>
      </div>
    </Transition>

    <!-- 岗位对比弹窗 -->
    <el-dialog v-model="showCompareDialog" title="岗位能力对比分析" width="82%" top="4vh" @opened="onCompareDialogOpened">
      <div v-if="compareList.length === 2" class="compare-content">
        <el-row :gutter="30" class="compare-header-row">
          <el-col :span="12">
            <div class="compare-job-header">
              <h3>{{ compareList[0].name }}</h3>
              <p>{{ compareList[0].company }} · {{ compareList[0].location }}</p>
              <p class="compare-salary">{{ compareList[0].salary }}</p>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="compare-job-header right">
              <h3>{{ compareList[1].name }}</h3>
              <p>{{ compareList[1].company }} · {{ compareList[1].location }}</p>
              <p class="compare-salary">{{ compareList[1].salary }}</p>
            </div>
          </el-col>
        </el-row>

        <!-- 合并双系列雷达图（两条线在同一张图，直观对比） -->
        <el-card shadow="never" style="margin-top:16px;border:1px solid #ebeef5">
          <template #header>
            <div style="display:flex;align-items:center;gap:16px">
              <span>能力维度对比</span>
              <span style="display:flex;align-items:center;gap:6px;font-size:13px">
                <span style="display:inline-block;width:12px;height:3px;background:#5470c6;border-radius:2px"></span>
                {{ compareList[0].name }}
              </span>
              <span style="display:flex;align-items:center;gap:6px;font-size:13px">
                <span style="display:inline-block;width:12px;height:3px;background:#ee6666;border-radius:2px"></span>
                {{ compareList[1].name }}
              </span>
            </div>
          </template>
          <div style="height:360px">
            <RadarChart :data="compareRadarData" />
          </div>
        </el-card>

        <!-- 维度对比表 -->
        <h4 style="margin: 20px 0 10px;">维度得分对比</h4>
        <el-table :data="compareDimTable" stripe border>
          <el-table-column prop="dimension" label="能力维度" width="120" />
          <el-table-column :label="compareList[0].name" width="140">
            <template #default="{ row }">
              <el-progress :percentage="row.val0" :stroke-width="8" :color="row.val0 >= row.val1 ? '#67c23a' : '#e4e7ed'" />
            </template>
          </el-table-column>
          <el-table-column :label="compareList[1].name" width="140">
            <template #default="{ row }">
              <el-progress :percentage="row.val1" :stroke-width="8" :color="row.val1 > row.val0 ? '#67c23a' : '#e4e7ed'" />
            </template>
          </el-table-column>
          <el-table-column label="差值" width="100">
            <template #default="{ row }">
              <el-tag :type="row.val0 >= row.val1 ? 'success' : 'info'" size="small">
                {{ row.val0 >= row.val1 ? '+' : '' }}{{ row.val0 - row.val1 }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <!-- 技能对比 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <h4>{{ compareList[0].name }} 核心技能</h4>
            <div class="skill-tag-list">
              <el-tag v-for="s in compareList[0].requirements?.professionalSkills?.slice(0,8)" :key="s" effect="plain">{{ s }}</el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <h4>{{ compareList[1].name }} 核心技能</h4>
            <div class="skill-tag-list">
              <el-tag v-for="s in compareList[1].requirements?.professionalSkills?.slice(0,8)" :key="s" effect="plain" type="warning">{{ s }}</el-tag>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Search, PieChart, ArrowRight, TrendCharts, CircleClose, Plus, Filter } from '@element-plus/icons-vue'
import { useUserStore } from '@/store'
import RadarChart from '@/components/RadarChart.vue'
import { calcMatchScore, getMatchTagType } from '@/utils/match'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const studentProfile = userStore.studentProfile

// ==========================================
// 1. 筛选状态
// ==========================================
const search = ref('')
const selectedIndustry = ref('')
const selectedCity = ref('')
const selectedSalary = ref('')
const skillFilter = ref('') // 来自岗位详情技能点击的精确匹配
const industries = ref<string[]>([])
const cities = ref<string[]>([])

const fetchFilterOptions = async () => {
  try {
    const res = await axios.get('/api/position-filters')
    if (res.data.code === 0) {
      industries.value = res.data.industries
      cities.value = res.data.cities
    }
  } catch (err) {
    console.error('获取筛选选项失败', err)
  }
}

const applyFilter = () => {
  currentPage.value = 1
  fetchPositions()
  fetchStats()
}

watch(search, (newVal) => {
  if (newVal === '') applyFilter()
})

// ==========================================
// 2. 数据获取与分页
// ==========================================
const positions = ref<any[]>([])
const totalPositions = ref(0)
const currentPage = ref(1)
const pageSize = 12
const loading = ref(false)

const fetchPositions = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/positions', {
      params: { page: currentPage.value, size: pageSize, search: search.value, skill: skillFilter.value, industry: selectedIndustry.value, city: selectedCity.value, salary: selectedSalary.value }
    })
    if (response.data.code === 0) {
      positions.value = response.data.data
      totalPositions.value = response.data.total
    }
  } catch (error) {
    ElMessage.error('获取岗位库数据失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPositions()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// ==========================================
// 3. 匹配度计算 + 排序
// ==========================================
const sortField = ref<'name' | 'salary' | 'match' | ''>('')
const sortOrder = ref<'asc' | 'desc'>('desc')

const parseSalaryToNum = (salaryStr: string) => {
  if (!salaryStr) return 0
  const m = salaryStr.match(/(\d+)/)
  return m ? parseInt(m[1]) : 0
}

const toggleSort = (field: 'name' | 'salary' | 'match') => {
  if (field === 'match' && !userStore.studentProfile) {
    ElMessage.warning('请先上传简历以使用匹配度排序')
    return
  }
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
}

const positionsWithMatch = computed(() => {
  const mapped = !studentProfile
    ? positions.value.map(pos => ({ ...pos, matchLevel: 0 }))
    : positions.value.map(pos => ({
        ...pos,
        matchLevel: calcMatchScore(studentProfile.dimensions, pos.dimensions || {})
      }))

  if (!sortField.value) return mapped

  return [...mapped].sort((a, b) => {
    let cmp = 0
    if (sortField.value === 'name') {
      cmp = (a.name || '').localeCompare(b.name || '', 'zh')
    } else if (sortField.value === 'salary') {
      cmp = parseSalaryToNum(a.salary) - parseSalaryToNum(b.salary)
    } else if (sortField.value === 'match') {
      cmp = a.matchLevel - b.matchLevel
    }
    return sortOrder.value === 'asc' ? cmp : -cmp
  })
})

const getMatchLevelTag = getMatchTagType

// ==========================================
// 4. 图表：饼图 + 技能热度横向柱状图
// ==========================================
const pieChartRef = ref<HTMLElement | null>(null)
const skillChartRef = ref<HTMLElement | null>(null)
let myChart: echarts.ECharts | null = null
let skillChart: echarts.ECharts | null = null

const fetchStats = async () => {
  try {
    const response = await axios.get('/api/industry-stats', {
      params: { search: search.value, industry: selectedIndustry.value, city: selectedCity.value, salary: selectedSalary.value }
    })
    if (response.data.code === 0) updatePieChart(response.data.data)
  } catch (error) {
    console.error('加载统计失败', error)
  }
}

const fetchSkillStats = async () => {
  try {
    const res = await axios.get('/api/skill-stats')
    if (res.data.code === 0) updateSkillChart(res.data.data.slice(0, 15))
  } catch (e) {
    console.error('技能统计失败', e)
  }
}

const updatePieChart = (data: { name: string; value: number }[]) => {
  if (!pieChartRef.value) return
  if (!myChart) myChart = echarts.init(pieChartRef.value)
  myChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left', type: 'scroll', show: false },
    series: [{
      name: '行业分布', type: 'pie', radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, position: 'outside' },
      data,
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  })
}

const updateSkillChart = (data: { skill: string; count: number }[]) => {
  if (!skillChartRef.value) return
  if (!skillChart) skillChart = echarts.init(skillChartRef.value)
  const skills = data.map(d => d.skill).reverse()
  const counts = data.map(d => d.count).reverse()
  skillChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#909399' } },
    yAxis: { type: 'category', data: skills, axisLabel: { color: '#555', fontSize: 12 } },
    series: [{
      type: 'bar', data: counts,
      itemStyle: {
        color: (params: any) => {
          const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
          return colors[params.dataIndex % colors.length]
        },
        borderRadius: [0, 4, 4, 0]
      },
      label: { show: true, position: 'right', formatter: '{c}', color: '#666', fontSize: 11 }
    }]
  })
}

const handleResize = () => {
  myChart?.resize()
  skillChart?.resize()
}

// ==========================================
// 5. 岗位对比功能
// ==========================================
const compareList = ref<any[]>([])
const showCompareDialog = ref(false)

// Dialog 动画完成后触发 window resize，让 ECharts 重新计算宽高
const onCompareDialogOpened = () => {
  window.dispatchEvent(new Event('resize'))
}

const toggleCompare = (pos: any) => {
  const idx = compareList.value.findIndex(c => c.id === pos.id)
  if (idx >= 0) {
    compareList.value.splice(idx, 1)
  } else {
    if (compareList.value.length >= 2) {
      ElMessage.warning('最多同时对比2个岗位')
      return
    }
    compareList.value.push(pos)
  }
}

const DIM_LABELS: Record<string, string> = {
  professional: '专业技能', certificate: '证书', innovation: '创新能力',
  learning: '学习能力', stress: '抗压能力', communication: '沟通能力', internship: '实习经验'
}
const DIMS = ['professional', 'certificate', 'innovation', 'learning', 'stress', 'communication', 'internship']

// 合并双系列雷达图：两条线在同一张图上
const compareRadarData = computed(() => {
  if (compareList.value.length < 2) return { indicator: [], series: [] }
  return {
    indicator: DIMS.map(d => ({ name: DIM_LABELS[d], max: 100 })),
    series: [
      {
        name: compareList.value[0].name,
        data: [DIMS.map(d => compareList.value[0].dimensions?.[d] || 0)]
      },
      {
        name: compareList.value[1].name,
        data: [DIMS.map(d => compareList.value[1].dimensions?.[d] || 0)]
      }
    ]
  }
})

const compareDimTable = computed(() => {
  if (compareList.value.length < 2) return []
  const dims = DIMS
  return dims.map(d => ({
    dimension: DIM_LABELS[d],
    val0: compareList.value[0].dimensions?.[d] || 0,
    val1: compareList.value[1].dimensions?.[d] || 0,
  }))
})

// ==========================================
// 6. 路由与生命周期
// ==========================================
const goToDetail = (id: string) => {
  router.push(`/position/${id}`)
}

onMounted(() => {
  // 接收从 PositionDetail 传来的文本搜索
  if (route.query.search) {
    search.value = String(route.query.search)
  }
  // 接收从 PositionDetail 传来的技能精确匹配
  if (route.query.skill) {
    skillFilter.value = String(route.query.skill)
  }
  fetchFilterOptions()
  fetchPositions()
  fetchStats()
  fetchSkillStats()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  myChart?.dispose()
  skillChart?.dispose()
})
</script>

<style scoped>
.position-library {
  padding: 20px;
  background: #f0f2f5;
  min-height: auto;
  overflow: visible;
  padding-bottom: 100px; /* 为悬浮栏留空间 */
}
.page-title { font-size: 32px; font-weight: 600; color: #303133; }
.page-subtitle { color: #909399; margin-bottom: 30px; }
.filter-card, .chart-card { margin-bottom: 20px; border-radius: 12px; }
.chart-section { margin-bottom: 20px; }

.position-card {
  cursor: pointer;
  margin-bottom: 20px;
  border-radius: 16px;
  transition: all 0.3s;
  min-height: 260px;
  height: auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.position-list { margin-bottom: 30px; overflow: visible; }
.position-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }
.job-title-link { cursor: pointer; transition: color 0.2s; }
.job-title-link:hover { color: #409eff; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.card-header h3 { margin: 0; font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%; }
.salary { color: #f56c6c; font-weight: bold; margin: 10px 0; }
.skills { display: flex; gap: 6px; flex-wrap: wrap; margin: 10px 0; min-height: 60px; }
.card-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
.card-actions { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.industry { background: #f4f4f5; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
.industry-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.industry-tag { background: #f4f4f5; border-radius: 12px; }
.pagination { text-align: center; margin-top: 30px; display: flex; justify-content: center; }
.skill-filter-bar {
  display: flex; align-items: center; gap: 8px;
  background: #ecf5ff; border: 1px solid #b3d8ff; border-radius: 8px;
  padding: 8px 16px; margin-bottom: 16px; font-size: 14px; color: #409eff;
}

/* 排序栏 */
.sort-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #f0f2f5;
}
.sort-label-text {
  font-size: 13px;
  color: #909399;
  white-space: nowrap;
}
.sort-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  transition: all 0.2s;
  outline: none;
}
.sort-btn:hover {
  border-color: #409eff;
  color: #409eff;
}
.sort-btn-active {
  border-color: #409eff;
  color: #409eff;
  background: #ecf5ff;
  font-weight: 600;
}
.sort-btn-clear {
  color: #f56c6c;
  border-color: #fbc4c4;
}
.sort-btn-clear:hover {
  background: #fef0f0;
  border-color: #f56c6c;
  color: #f56c6c;
}
.sort-arrows {
  display: inline-flex;
  flex-direction: column;
  font-size: 9px;
  line-height: 1;
  gap: 1px;
  color: #c0c4cc;
}
.arrow-active {
  color: #409eff;
}

/* 底部悬浮对比栏 */
.compare-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  box-shadow: 0 -4px 16px rgba(0,0,0,0.1);
  padding: 16px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}
.compare-bar-items { display: flex; gap: 16px; align-items: center; }
.compare-bar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ecf5ff;
  color: #409eff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
}
.remove-icon { cursor: pointer; font-size: 16px; }
.remove-icon:hover { color: #f56c6c; }
.compare-bar-placeholder {
  display: flex; align-items: center; gap: 4px;
  color: #c0c4cc; font-size: 14px;
  border: 1px dashed #c0c4cc; padding: 6px 16px; border-radius: 20px;
}
.slide-up-enter-active, .slide-up-leave-active { transition: transform 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); }

/* 对比弹窗 */
.compare-content { padding: 0 10px; }
.compare-header-row { margin-bottom: 10px; }
.compare-job-header { padding: 16px; background: #f5f7fa; border-radius: 10px; }
.compare-job-header.right { text-align: right; }
.compare-job-header h3 { margin: 0 0 6px; color: #303133; }
.compare-job-header p { margin: 4px 0; color: #909399; font-size: 13px; }
.compare-salary { color: #f56c6c !important; font-weight: bold; }
.skill-tag-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
</style>