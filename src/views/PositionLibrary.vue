<template>
  <div class="position-library">
    <!-- 页面标题 -->
    <h1 class="page-title">岗位画像库</h1>
    <p class="page-subtitle">浏览 10,000+ 岗位，了解行业能力要求</p>

    <!-- 筛选栏 -->
    <el-card class="filter-card" shadow="hover">
      <el-row :gutter="20" align="middle">
        <el-col :span="6">
          <el-input v-model="search" placeholder="搜索岗位名称" clearable>
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
    </el-card>

    <!-- 图表区域：热门行业分布（可选） -->
    <el-row :gutter="20" class="chart-section">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span><el-icon><PieChart /></el-icon> 热门行业岗位分布</span>
          </template>
          <div ref="pieChartRef" style="width: 100%; height: 250px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 岗位列表 -->
    <div class="position-list">
      <el-row :gutter="20">
        <el-col :span="8" v-for="pos in filteredPositions" :key="pos.id">
          <el-card class="position-card" shadow="hover" @click="goToDetail(pos.id)">
            <div class="card-header">
              <h3>{{ pos.name }}</h3>
             
            </div>
            <p class="company">{{ pos.company }} · {{ pos.location }}</p>
            <p class="salary">{{ pos.salary }}</p>
            <div class="skills">
              <el-tag size="small" v-for="skill in pos.requirements.professionalSkills.slice(0,4)" :key="skill">{{ skill }}</el-tag>
              <span v-if="pos.requirements.professionalSkills.length > 4" class="more-skills">+{{ pos.requirements.professionalSkills.length-4 }}</span>
            </div>
            <div class="card-footer">
              <span class="industry">{{ pos.industry }}</span>
              <el-button type="text" size="small">查看详情 <el-icon><ArrowRight /></el-icon></el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 分页 -->
    <el-pagination
      background
      layout="prev, pager, next"
      :total="totalPositions"
      :page-size="pageSize"
      v-model:current-page="currentPage"
      @current-change="handlePageChange"
      class="pagination"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Search, PieChart, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()
const studentProfile = userStore.studentProfile

// 数据状态
const positions = ref<any[]>([])       // 原始岗位数据
const loading = ref(false)              // 加载状态

// 筛选条件
const search = ref('')
const selectedIndustry = ref('')
const selectedCity = ref('')
const selectedSalary = ref('')
const currentPage = ref(1)
const pageSize = 9

// 动态行业、城市（从实际数据中提取）
const industries = computed(() => {
  const set = new Set(positions.value.map(p => p.industry))
  return Array.from(set)
})
const cities = computed(() => {
  const set = new Set(positions.value.map(p => p.location))
  return Array.from(set)
})

// 为每个岗位计算匹配度（基于学生画像）
const positionsWithMatch = computed(() => {
  if (!studentProfile) return positions.value
  return positions.value.map(pos => {
    const dims = ['professional', 'certificate', 'innovation', 'learning', 'stress', 'communication', 'internship']
    let totalGap = 0
    dims.forEach(d => {
      const studentVal = studentProfile.dimensions[d as keyof typeof studentProfile.dimensions] || 0
      const posVal = pos.dimensions?.[d as keyof typeof pos.dimensions] || 0
      totalGap += Math.abs(studentVal - posVal)
    })
    const avgGap = totalGap / dims.length
    const match = Math.max(0, Math.min(100, 100 - avgGap))
    return { ...pos, matchLevel: Math.round(match) }
  })
})

// 过滤后的岗位（前端过滤，适用于数据量不大时）
const filtered = computed(() => {
  let list = positionsWithMatch.value
  if (search.value) {
    list = list.filter(p => p.name.toLowerCase().includes(search.value.toLowerCase()))
  }
  if (selectedIndustry.value) {
    list = list.filter(p => p.industry === selectedIndustry.value)
  }
  if (selectedCity.value) {
    list = list.filter(p => p.location === selectedCity.value)
  }
  if (selectedSalary.value) {
    const [min, max] = selectedSalary.value.split('-').map(Number)
    list = list.filter(p => {
      const salaryNum = parseInt(p.salary.split('-')[0])
      if (selectedSalary.value === '30+') return salaryNum >= 30
      if (max) return salaryNum >= min && salaryNum <= max
      return salaryNum >= min
    })
  }
  return list
})

// 分页数据
const filteredPositions = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})
const totalPositions = computed(() => filtered.value.length)

// 匹配度标签颜色
const getMatchLevelTag = (level: number) => {
  if (level >= 80) return 'success'
  if (level >= 60) return 'warning'
  return 'danger'
}

// 筛选操作（重置页码）
const applyFilter = () => {
  currentPage.value = 1
}

// 分页切换
const handlePageChange = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 跳转详情
const goToDetail = (id: string) => {
  router.push(`/position/${id}`)
}

// 饼图相关
const pieChartRef = ref<HTMLElement>()
let pieChart: echarts.ECharts | null = null

const initPieChart = () => {
  if (!pieChartRef.value) return
  if (!positions.value.length) return  // 无数据时不渲染
  pieChart = echarts.init(pieChartRef.value)
  const industryCount = positions.value.reduce((acc, cur) => {
    acc[cur.industry] = (acc[cur.industry] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  const data = Object.entries(industryCount).map(([name, value]) => ({ name, value }))
  const option = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [
      {
        name: '岗位数量',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { scale: true },
        data,
      },
    ],
  }
  pieChart.setOption(option)
}

const handleResize = () => pieChart?.resize()

// 获取后端数据
const fetchPositions = async () => {
  loading.value = true
  try {
    // 后端接口地址（可根据环境变量配置）
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://172.27.148.3:3000'
    const response = await axios.get(`${baseURL}/api/positions`)
    // 假设后端返回格式为 { code: 0, data: [...] }
    if (response.data.code === 0) {
      positions.value = response.data.data
      // 数据加载完成后重新绘制饼图
      initPieChart()
    } else {
      ElMessage.error(response.data.message || '获取岗位数据失败')
    }
  } catch (error) {
    console.error('请求岗位数据失败:', error)
    ElMessage.error('无法连接后端服务，请检查网络或联系管理员')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPositions()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
})
</script>

<style scoped>
.position-library {
  padding: 20px;
  background: #f0f2f5;
}
.page-title {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 5px;
  color: #303133;
}
.page-subtitle {
  color: #909399;
  margin-bottom: 30px;
}
.filter-card {
  margin-bottom: 30px;
  border-radius: 12px;
}
.chart-section {
  margin-bottom: 30px;
}
.chart-card {
  border-radius: 12px;
}
.chart-card :deep(.el-card__header) {
  background: #f8fafd;
  font-weight: 600;
}
.position-list {
  margin-bottom: 30px;
}
.position-card {
  cursor: pointer;
  margin-bottom: 20px;
  border-radius: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
  height: 250px;
  display: flex;
  flex-direction: column;
}
.position-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.company {
  color: #606266;
  font-size: 14px;
  margin: 5px 0;
}
.salary {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
  margin: 10px 0;
}
.skills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 10px 0;
}
.more-skills {
  color: #909399;
  font-size: 12px;
  align-self: center;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}
.industry {
  background: #f4f4f5;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  color: #909399;
}
.pagination {
  text-align: center;
  margin-top: 30px;
}
</style>