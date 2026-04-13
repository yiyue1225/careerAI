<template>
  <div class="home">
    <!-- 顶部大Banner -->
    <el-row :gutter="20" class="banner">
      <el-col :span="16">
        <div class="banner-content">
          <h1 class="banner-title">AI职业规划智能体</h1>
          <p class="banner-subtitle">基于大数据与人工智能，为你量身打造最优职业路径</p>
          <el-button type="primary" size="large" round @click="$router.push('/match')">立即开始AI匹配</el-button>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="banner-stats">
          <div class="stat-item">
            <span class="stat-value">10,000+</span>
            <span class="stat-label">岗位数据</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">85%</span>
            <span class="stat-label">匹配准确率</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">200+</span>
            <span class="stat-label">合作企业</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6" v-for="(item, index) in stats" :key="index">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-card-content">
            <el-icon :size="40" :color="item.color"><component :is="item.icon" /></el-icon>
            <div class="stat-info">
              <h3>{{ item.value }}</h3>
              <p>{{ item.label }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts">
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span>热门行业岗位分布</span>
          </template>
          <div ref="pieChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <span>AI相关岗位需求趋势</span>
          </template>
          <div ref="lineChartRef" style="width: 100%; height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- AI能力展示 -->
    <h2 class="section-title">AI 核心能力</h2>
    <el-row :gutter="20" class="ai-features">
      <el-col :span="8" v-for="(feature, index) in aiFeatures" :key="index">
        <el-card class="feature-card" shadow="hover">
          <el-icon :size="40" :color="feature.color"><component :is="feature.icon" /></el-icon>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          <el-button type="text" @click="$router.push(feature.route)">了解更多 ></el-button>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速入口 -->
    <el-row class="quick-actions">
      <el-button type="primary" size="large" @click="$router.push('/profile')" round>上传简历，开始测评</el-button>
      <el-button type="success" size="large" @click="$router.push('/positions')" round>浏览岗位画像库</el-button>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { useRouter } from 'vue-router'
import axios from 'axios'
import {
  Briefcase,
  User,
  DataLine,
  Document,
  PieChart,
  TrendCharts,
  Medal,
  School,
  Promotion,
} from '@element-plus/icons-vue'

const router = useRouter()

// 统计数据（可改为从后端获取）
const stats = [
  { icon: Briefcase, value: '10,234', label: '岗位总数', color: '#409eff' },
  { icon: User, value: '5,678', label: '注册学生', color: '#67c23a' },
  { icon: DataLine, value: '85%', label: '匹配成功率', color: '#e6a23c' },
  { icon: Medal, value: '98%', label: '用户满意度', color: '#f56c6c' },
]

// AI功能卡片
const aiFeatures = [
  {
    icon: Document,
    title: 'AI简历解析',
    description: '上传简历，智能提取技能、经历，生成能力画像。',
    color: '#409eff',
    route: '/profile',
  },
  {
    icon: TrendCharts,
    title: '人岗智能匹配',
    description: '基于岗位画像与学生能力，计算匹配度并推荐路径。',
    color: '#67c23a',
    route: '/match',
  },
  {
    icon: Promotion,
    title: '职业路径规划',
    description: '结合行业趋势，生成可执行的短期、中期计划。',
    color: '#e6a23c',
    route: '/match',
  },
]

// 图表实例引用
const pieChartRef = ref<HTMLElement>()
const lineChartRef = ref<HTMLElement>()
let pieChart: echarts.ECharts | null = null
let lineChart: echarts.ECharts | null = null

// 初始化饼图（热门行业岗位分布）
const initPieChart = async () => {
  if (!pieChartRef.value) return;

  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    // 💡 获取 10,000 条岗位的真实统计 
    const res = await axios.get(`${baseURL}/api/industry-stats`);
    
    if (res.data.code === 0 && res.data.data.length > 0) {
      // 💡 确保容器已渲染，使用 nextTick 或直接初始化
      pieChart = echarts.init(pieChartRef.value);
      
      const option: echarts.EChartsOption = {
        // 💡 样式对齐：标题放在右下角，避免遮挡数据
        title: {
          text: '行业岗位分布统计',
          right: '5%',
          bottom: '5%',
          textAlign: 'right',
          textStyle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#606266'
          }
        },
        tooltip: { 
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)' 
        },
        legend: {
          show: false // 首页保持简洁
        },
        series: [
          {
            name: '行业分布',
            type: 'pie',
            // 💡 样式对齐：环形比例 40%-70%
            radius: ['40%', '70%'], 
            avoidLabelOverlap: true,
            // 💡 核心样式：圆角 8px 且带有白色描边
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'outside',
              formatter: '{b}',
              color: '#606266'
            },
            labelLine: {
              show: true,
              length: 10,
              length2: 15
            },
            data: res.data.data, 
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
      pieChart.setOption(option);
    } else {
      console.warn("后端未返回有效的行业统计数据");
    }
  } catch (error) {
    console.error("加载首页饼图失败:", error);
  }
};

// 初始化折线图（AI相关岗位需求趋势）
const initLineChart = () => {
  if (!lineChartRef.value) return
  lineChart = echarts.init(lineChartRef.value)
  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['2021', '2022', '2023', '2024', '2025'],
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '岗位数量',
        type: 'line',
        data: [150, 230, 380, 520, 680],
        smooth: true,
        lineStyle: { color: '#409eff', width: 3 },
        areaStyle: { color: 'rgba(64,158,255,0.1)' },
      },
    ],
  }
  lineChart.setOption(option)
}

// 窗口大小变化时重绘图表
const handleResize = () => {
  pieChart?.resize()
  lineChart?.resize()
}

onMounted(() => {
  initPieChart()
  initLineChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  pieChart?.dispose()
  lineChart?.dispose()
})
</script>

<style scoped>
.home {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9edf5 100%);
  min-height: 100vh;
}

/* Banner 区域 */
.banner {
  background: linear-gradient(145deg, #304156 0%, #1f2d3d 100%);
  border-radius: 20px;
  padding: 40px 30px;
  margin-bottom: 30px;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  overflow: hidden;
}
.banner-content {
  padding-left: 20px;
}
.banner-title {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 10px 0;
  background: linear-gradient(120deg, #fff, #a0cfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.banner-subtitle {
  font-size: 18px;
  margin-bottom: 30px;
  opacity: 0.9;
}
.banner-stats {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
}
.stat-item {
  text-align: center;
}
.stat-value {
  display: block;
  font-size: 32px;
  font-weight: bold;
  color: #ffd04b;
}
.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

/* 统计数据卡片 */
.stats-cards {
  margin-bottom: 30px;
}
.stat-card {
  border-radius: 16px;
  transition: transform 0.3s;
}
.stat-card:hover {
  transform: translateY(-5px);
}
.stat-card-content {
  display: flex;
  align-items: center;
  gap: 20px;
}
.stat-info h3 {
  font-size: 28px;
  margin: 0;
  color: #303133;
}
.stat-info p {
  margin: 5px 0 0;
  color: #909399;
}

/* 图表卡片 */
.charts {
  margin-bottom: 40px;
}
.chart-card {
  border-radius: 16px;
}
.chart-card :deep(.el-card__header) {
  background-color: #f8fafd;
  font-weight: 600;
  border-bottom: 1px solid #e4e7ed;
}

/* AI能力展示 */
.section-title {
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin: 40px 0 20px;
  color: #303133;
  position: relative;
}
.section-title::after {
  content: '';
  display: block;
  width: 60px;
  height: 4px;
  background: #409eff;
  margin: 10px auto 0;
  border-radius: 2px;
}
.ai-features {
  margin-bottom: 40px;
}
.feature-card {
  text-align: center;
  padding: 20px 10px;
  border-radius: 16px;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.feature-card .el-icon {
  margin-bottom: 20px;
}
.feature-card h3 {
  font-size: 20px;
  margin: 10px 0;
}
.feature-card p {
  color: #606266;
  margin-bottom: 20px;
}

/* 快速入口 */
.quick-actions {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 30px 0 20px;
}
.quick-actions .el-button {
  padding: 15px 40px;
  font-size: 16px;
}
</style>