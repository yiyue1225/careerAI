<template>
  <div class="profile">
    <h1 class="page-title">我的能力画像</h1>
    <p class="page-subtitle">上传简历，AI 解析生成你的能力图谱与竞争力分析</p>

    <!-- 如果还没有能力数据，显示上传区域 -->
    <el-card v-if="!profile" class="upload-card" shadow="hover">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleUpload"
        :show-file-list="false"
        class="upload-area"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处 或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">支持 PDF/DOCX 格式，最大 10MB</div>
        </template>
      </el-upload>
      <div class="upload-actions">
        <el-button type="primary" @click="mockUpload" :loading="uploading">开始解析</el-button>
        <el-button @click="mockUpload">手动填写</el-button>
      </div>
    </el-card>

    <!-- 已解析的能力展示 -->
    <div v-else class="profile-content">
      <!-- 顶部基础信息卡片 -->
      <el-row :gutter="20" class="info-row">
        <el-col :span="12">
          <el-card class="info-card" shadow="hover">
            <template #header>
              <span><el-icon><User /></el-icon> 基础信息</span>
            </template>
            <div class="basic-info">
              <div><label>姓名：</label><span>{{ profile.name }}</span></div>
              <div><label>专业：</label><span>{{ profile.major }}</span></div>
              <div><label>年级：</label><span>{{ profile.grade }}</span></div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="score-card" shadow="hover">
            <template #header>完整度</template>
            <el-progress type="dashboard" :percentage="profile.completeness" :color="colors" width="120">
              <template #default>{{ profile.completeness }}%</template>
            </el-progress>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="score-card" shadow="hover">
            <template #header>竞争力</template>
            <el-progress type="dashboard" :percentage="profile.competitiveness" :color="colors" width="120">
              <template #default>{{ profile.competitiveness }}%</template>
            </el-progress>
          </el-card>
        </el-col>
      </el-row>

      <!-- 雷达图 + 能力标签 -->
      <el-row :gutter="20" class="chart-row">
        <el-col :span="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <span><el-icon><DataLine /></el-icon> 能力维度雷达图</span>
            </template>
            <RadarChart :data="radarData" />
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card class="tags-card" shadow="hover">
            <template #header>
              <span><el-icon><Collection /></el-icon> 技能标签</span>
            </template>
            <div class="tags-container">
              <div class="tag-group">
                <h4>专业技能</h4>
                <div class="tag-list">
                  <el-tag v-for="s in profile.skills.professionalSkills" :key="s" type="primary" effect="plain">{{ s }}</el-tag>
                </div>
              </div>
              <div class="tag-group">
                <h4>证书</h4>
                <div class="tag-list">
                  <el-tag v-for="c in profile.skills.certificates" :key="c" type="success" effect="plain">{{ c }}</el-tag>
                </div>
              </div>
              <div class="tag-group">
                <h4>实习经历</h4>
                <div class="tag-list">
                  <el-tag v-for="i in profile.skills.internship" :key="i" type="warning" effect="plain">{{ i }}</el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 推荐匹配岗位 -->
      <el-card class="recommend-card" shadow="hover">
        <template #header>
          <span><el-icon><Star /></el-icon> 为你推荐的岗位（基于能力匹配）</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="8" v-for="pos in recommendedPositions" :key="pos.id">
            <el-card class="recommend-item" shadow="hover" @click="goToDetail(pos.id)">
              <h4>{{ pos.name }}</h4>
              <p>{{ pos.company }} · {{ pos.location }}</p>
              <p class="match-rate">匹配度 <span>{{ pos.matchLevel }}%</span></p>
              <el-progress :percentage="pos.matchLevel" :color="getMatchColor(pos.matchLevel)" :show-text="false" />
            </el-card>
          </el-col>
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, User, DataLine, Collection, Star } from '@element-plus/icons-vue'
import { mockStudentProfile } from '@/mock/student'
import { positions } from '@/mock/positions'
import RadarChart from '@/components/RadarChart.vue'
import { useUserStore } from '@/store'

// 定义学生画像类型（与 mock 数据结构一致）
interface StudentProfile {
  name: string
  major: string
  grade: string
  skills: {
    professionalSkills: string[]
    certificates: string[]
    innovation: number
    learningAbility: number
    stressTolerance: number
    communication: number
    internship: string[]
  }
  dimensions: {
    professional: number
    certificate: number
    innovation: number
    learning: number
    stress: number
    communication: number
    internship: number
  }
  completeness: number
  competitiveness: number
}

const router = useRouter()
const userStore = useUserStore()

// 初始为 null，显示上传卡片；上传解析后赋值为真实数据
const profile = ref<StudentProfile | null>(null)
const uploading = ref(false)

const colors = [
  { color: '#f56c6c', percentage: 60 },
  { color: '#e6a23c', percentage: 80 },
  { color: '#5cb87a', percentage: 100 },
]

// 处理上传（选择文件后，可以保存文件对象，供后续使用）
const handleUpload = (file: any) => {
  console.log('选中文件', file)
  // 可将文件保存在某个变量中，以便点击“开始解析”时上传
  // 例如：selectedFile.value = file.raw
}

// 模拟解析（实际应调用后端接口）
const mockUpload = () => {
  uploading.value = true
  setTimeout(() => {
    // 将 mock 数据赋值给 profile（模拟解析结果）
    profile.value = mockStudentProfile as StudentProfile
    userStore.setStudentProfile(profile.value)
    uploading.value = false
  }, 1500)
}

// 雷达图数据
const radarData = computed(() => {
  if (!profile.value) return { indicator: [], series: [] }
  const dims = profile.value.dimensions
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
    // 注意：Object.values 返回 unknown[]，需要断言为 number[]
    series: [{ name: '学生', value: Object.values(dims) as number[] }],
  }
})

// 计算推荐岗位（取匹配度最高的三个）
const recommendedPositions = computed(() => {
  if (!profile.value) return []
  const withMatch = positions.map(pos => {
    const dims = ['professional', 'certificate', 'innovation', 'learning', 'stress', 'communication', 'internship']
    let totalGap = 0
    dims.forEach(d => {
      const studentVal = profile.value!.dimensions[d as keyof typeof profile.value.dimensions] || 0
      const posVal = pos.dimensions[d as keyof typeof pos.dimensions] || 0
      totalGap += Math.abs(studentVal - posVal)
    })
    const avgGap = totalGap / dims.length
    const match = Math.max(0, Math.min(100, 100 - avgGap))
    return { ...pos, matchLevel: Math.round(match) }
  })
  return withMatch.sort((a, b) => b.matchLevel - a.matchLevel).slice(0, 3)
})

const getMatchColor = (match: number) => {
  if (match >= 80) return '#5cb87a'
  if (match >= 60) return '#e6a23c'
  return '#f56c6c'
}

const goToDetail = (id: string) => {
  router.push(`/position/${id}`)
}
</script>

<style scoped>
.profile {
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
.upload-card {
  max-width: 600px;
  margin: 0 auto;
  padding: 30px;
  border-radius: 20px;
  text-align: center;
}
.upload-area {
  margin-bottom: 20px;
}
.upload-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}
.info-row {
  margin-bottom: 20px;
}
.info-card :deep(.el-card__header) {
  background: #f8fafd;
  font-weight: 600;
}
.basic-info div {
  margin-bottom: 10px;
  font-size: 16px;
}
.basic-info label {
  color: #909399;
  width: 60px;
  display: inline-block;
}
.score-card {
  text-align: center;
}
.score-card :deep(.el-card__header) {
  background: #f8fafd;
  font-weight: 600;
}
.chart-row {
  margin-bottom: 20px;
}
.chart-card :deep(.el-card__header),
.tags-card :deep(.el-card__header) {
  background: #f8fafd;
  font-weight: 600;
}
.tags-container {
  max-height: 400px;
  overflow-y: auto;
}
.tag-group {
  margin-bottom: 20px;
}
.tag-group h4 {
  margin: 0 0 10px;
  color: #606266;
  font-size: 16px;
}
.tag-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.recommend-card {
  border-radius: 16px;
}
.recommend-card :deep(.el-card__header) {
  background: #f8fafd;
  font-weight: 600;
}
.recommend-item {
  cursor: pointer;
  border-radius: 12px;
  transition: transform 0.3s;
}
.recommend-item:hover {
  transform: translateY(-5px);
}
.recommend-item h4 {
  margin: 0 0 8px;
  color: #303133;
}
.recommend-item p {
  color: #606266;
  margin: 5px 0;
}
.match-rate span {
  font-weight: bold;
  color: #f56c6c;
}
</style>