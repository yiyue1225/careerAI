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
    </el-card>

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

    <div class="position-list" v-loading="loading">
      <el-row :gutter="20">
        <el-col :span="8" v-for="pos in positionsWithMatch" :key="pos.id">
          <el-card class="position-card" shadow="hover" @click="goToDetail(pos.id)">
            <div class="card-header">
              <h3>{{ pos.name }}</h3>
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
                   <el-tag 
                     v-for="tag in pos.clean_industry" 
                     :key="tag" 
                     size="small" 
                     type="info" 
                     class="industry-tag"
                   >
                     {{ tag }}
                   </el-tag>
                </template>
                <span v-else class="industry">{{ pos.industry }}</span>
              </div>
              <el-button type="text" size="small">查看详情 <el-icon><ArrowRight /></el-icon></el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Search, PieChart, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()
const studentProfile = userStore.studentProfile

// ==========================================
// 1. 筛选状态与全量选项模块
// ==========================================
const search = ref('')
const selectedIndustry = ref('')
const selectedCity = ref('')
const selectedSalary = ref('')
const industries = ref<string[]>([]) // 存储全量行业
const cities = ref<string[]>([])     // 存储全量城市

// 获取后端数据库中所有的行业和城市选项
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

// 筛选按钮点击：重置页码并重新请求
const applyFilter = () => {
  currentPage.value = 1;
  fetchPositions(); 
  fetchStats();     
};

// 监听搜索框，清空时自动刷新
watch(search, (newVal) => {
  if (newVal === '') applyFilter()
})


// ==========================================
// 2. 数据获取与分页模块
// ==========================================
const positions = ref<any[]>([]) 
const totalPositions = ref(0)
const currentPage = ref(1)
const pageSize = 12 // 每页 12 个
const loading = ref(false)

const fetchPositions = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`/api/positions`, {
      params: {
        page: currentPage.value,
        size: pageSize,
        search: search.value,
        industry: selectedIndustry.value,
        city: selectedCity.value,
        salary: selectedSalary.value
      }
    });
    if (response.data.code === 0) {
      positions.value = response.data.data;
      totalPositions.value = response.data.total;
    }
  } catch (error) {
    ElMessage.error('获取岗位库数据失败');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchPositions()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}


// ==========================================
// 3. 算法计算模块（匹配度）
// ==========================================
const positionsWithMatch = computed(() => {
  if (!studentProfile) return positions.value
  return positions.value.map(pos => {
    const dims = ['professional', 'certificate', 'innovation', 'learning', 'stress', 'communication', 'internship']
    let totalGap = 0
    dims.forEach(d => {
      const studentVal = studentProfile.dimensions[d] || 0
      const posVal = pos.dimensions?.[d] || 0
      totalGap += Math.abs(studentVal - posVal)
    })
    const avgGap = totalGap / dims.length
    const match = Math.max(0, Math.min(100, 100 - avgGap))
    return { ...pos, matchLevel: Math.round(match) }
  })
})

const getMatchLevelTag = (level: number) => {
  if (level >= 80) return 'success'
  if (level >= 60) return 'warning'
  return 'danger'
}


// ==========================================
// 4. ECharts 图表模块
// ==========================================
const pieChartRef = ref<HTMLElement | null>(null);

let myChart: echarts.ECharts | null = null;


const fetchStats = async () => {
  try {
    const response = await axios.get('/api/industry-stats', {
      params: {
        search: search.value,      // 👈 确保传了关键词
        industry: selectedIndustry.value,
        city: selectedCity.value,
        salary: selectedSalary.value
      }
    });
    if (response.data.code === 0) {
      updateChart(response.data.data);
    }
  } catch (error) {
    console.error('加载统计失败', error);
  }
};

// 定义图表渲染/更新函数
const updateChart = (data: { name: string; value: number }[]) => {
  if (!pieChartRef.value) return;

  // 初始化实例
  if (!myChart) {
    myChart = echarts.init(pieChartRef.value);
  }

  const option: echarts.EChartsOption = {
    title: {
    text: '行业岗位分布统计',
    left: '',
    top: '0%',
    textStyle: {
      fontSize: 16,
      color: '#333'
    }
  },
    tooltip: { 
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)' 
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      type: 'scroll', // 防止行业太多超出容器
      show: false // 如果空间不够可以隐藏图例
    },
    series: [
      {
        name: '行业分布',
        type: 'pie',
        radius: ['40%', '70%'], // 环形图更现代
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside'
        },
        data: data, // 后端传来的全量 JSON_TABLE 统计结果
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  myChart.setOption(option);
};

// 窗口缩放自适应
const handleResize = () => {
  myChart?.resize();
};


// ==========================================
// 5. 路由与生命周期
// ==========================================
const goToDetail = (id: string) => {
  router.push(`/position/${id}`)
}

onMounted(() => {
  fetchFilterOptions() 
  fetchPositions()     
  fetchStats()         
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  myChart?.dispose() 
})
</script>

<style scoped>
/* 保持原有样式不变 */
/* 修改 PositionLibrary.vue 的样式 */
.position-library { 
  padding: 20px; 
  background: #f0f2f5; 
  /* 优化点：不要设置 100vh，让内容高度由父容器决定 */
  min-height: auto; 
  /* 确保自身不产生滚动条 */
  overflow: visible; 
}
.page-title { font-size: 32px; font-weight: 600; color: #303133; }
.page-subtitle { color: #909399; margin-bottom: 30px; }
.filter-card, .chart-card { margin-bottom: 30px; border-radius: 12px; }
/* 修改 PositionLibrary.vue 的样式 */
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
.position-list {
  margin-bottom: 30px;
  overflow: visible; /* 让内容溢出到父级，由父级统一滚动 */
}
.position-card:hover { transform: translateY(-5px); box-shadow: 0 12px 24px rgba(0,0,0,0.1); }
.card-header h3 { margin: 0; font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%; }
.salary { color: #f56c6c; font-weight: bold; margin: 10px 0; }
.skills { display: flex; gap: 6px; flex-wrap: wrap; margin: 10px 0; min-height: 60px; }
.card-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; }
.industry { background: #f4f4f5; padding: 4px 8px; border-radius: 12px; font-size: 12px; }
.pagination { text-align: center; margin-top: 30px; display: flex; justify-content: center; }
.main-container {
  height: 100vh;      /* 占据全屏 */
  overflow-y: auto;   /* 只有这里允许滚动 */
  overflow-x: hidden;
}
:deep(html), :deep(body) {
  margin: 0;
  height: 100%;
  overflow: hidden; /* 禁用系统自带滚动条 */
}
.industry-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.industry-tag {
  background: #f4f4f5;
  border-radius: 12px;
}
</style>