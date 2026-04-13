<template>
  <div 
    class="profile"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div v-if="isDragging" class="drop-mask">
      <div class="mask-content">
        <el-icon class="mask-icon"><upload-filled /></el-icon>
        <p>松开鼠标立即上传简历</p>
      </div>
    </div>

    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">我的能力画像</h1>
        <p class="page-subtitle">上传简历，AI 解析生成你的能力图谱与竞争力分析</p>
      </div>
      <el-button 
        v-if="profile" 
        type="danger" 
        plain 
        @click="handleExit" 
        :icon="CircleClose"
      >
        退出简历并清除数据
      </el-button>
    </div>

    <el-card v-if="!profile" class="upload-card" shadow="hover">
      <el-upload
        drag
        :auto-upload="false"
        :on-change="handleUpload"
        :show-file-list="false" 
        accept=".pdf,.doc,.docx"
        class="upload-area"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">拖拽文件到此处 或 <em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip">仅支持 PDF 或 Word 格式 (最大 10MB)</div>
        </template>
      </el-upload>

      <div v-if="selectedFile" class="attachment-container">
        <div class="attachment-header">已上传附件：</div>
        <div class="attachment-item">
          <el-icon class="file-icon"><Document /></el-icon>
          <span class="file-name">{{ selectedFile.name }}</span>
          <el-icon class="delete-icon" @click="selectedFile = null"><CircleClose /></el-icon>
        </div>
      </div>

      <div class="upload-actions">
        <el-button 
          type="primary" 
          size="large" 
          @click="mockUpload" 
          :loading="uploading"
        >
          开始 AI 解析
        </el-button>
        <el-button size="large">手动填写</el-button>
      </div>
    </el-card>

    <div v-else class="profile-content">
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
            <el-progress type="dashboard" :percentage="profile.completeness" :color="colors" width="120" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="score-card" shadow="hover">
            <template #header>竞争力</template>
            <el-progress type="dashboard" :percentage="profile.competitiveness" :color="colors" width="120" />
          </el-card>
        </el-col>
      </el-row>

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
              <div class="tag-group" v-for="(list, key) in profile.skills" :key="key">
                <h4 v-if="Array.isArray(list)">{{ formatSkillLabel(key) }}</h4>
                <div class="tag-list" v-if="Array.isArray(list)">
                  <el-tag v-for="item in list" :key="item" effect="plain">{{ item }}</el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'
import { 
  UploadFilled, 
  User, 
  DataLine, 
  Collection, 
  Document, 
  CircleClose 
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store'
import RadarChart from '@/components/RadarChart.vue'

// 类型定义
interface StudentProfile {
  name: string
  major: string
  grade: string
  completeness: number
  competitiveness: number
  skills: {
    professionalSkills: string[]
    certificates: string[]
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
}

const userStore = useUserStore()
const profile = computed(() => userStore.studentProfile)
const uploading = ref(false)
const selectedFile = ref<UploadRawFile | null>(null)
const isDragging = ref(false)

const colors = [
  { color: '#f56c6c', percentage: 60 },
  { color: '#e6a23c', percentage: 80 },
  { color: '#5cb87a', percentage: 100 },
]

// 统一文件校验
const processFile = (file: File) => {
  const fileExt = file.name.split('.').pop()?.toLowerCase()
  const isAllowed = ['pdf', 'doc', 'docx'].includes(fileExt || '')
  
  if (!isAllowed) {
    ElMessage.error('格式错误：仅支持 PDF 或 Word')
    selectedFile.value = null 
    return
  }
  selectedFile.value = file as unknown as UploadRawFile
  ElMessage.success('简历已就绪')
}

const handleUpload = (file: UploadFile) => {
  if (file.raw) processFile(file.raw)
}

// 拖拽逻辑
const handleDragOver = () => {
  if (!profile.value) isDragging.value = true
}
const handleDragLeave = () => {
  isDragging.value = false
}
const handleDrop = (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) processFile(files[0])
}

// 退出并返回上传页
const handleExit = () => {
  ElMessageBox.confirm('确定要退出并清除当前简历数据吗？', '提示', {
    confirmButtonText: '确定清除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    selectedFile.value = null
    userStore.setStudentProfile(null) 
    ElMessage.success('数据已清除')
  }).catch(() => {})
}

// 模拟 AI 解析并切换页面
const mockUpload = () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传文件')
    return
  }
  uploading.value = true
  setTimeout(() => {
    const analyzedResult: StudentProfile = {
      name: '张三',
      major: '计算机科学与技术',
      grade: '大三',
      completeness: 85,
      competitiveness: 90,
      skills: {
        professionalSkills: ['Java', 'Python', 'Spring Boot', 'Mysql'],
        certificates: ['CET-4', '计算机二级'],
        internship: ['字节跳动实习']
      },
      dimensions: {
        professional: 95,
        certificate: 80,
        innovation: 85,
        learning: 92,
        stress: 78,
        communication: 88,
        internship: 85
      }
    }
    userStore.setStudentProfile(analyzedResult)
    uploading.value = false
    ElMessage.success('解析完成')
  }, 2000)
}

const radarData = computed(() => {
  if (!profile.value) return { indicator: [], series: [] }
  const d = profile.value.dimensions
  return {
    indicator: [
      { name: '专业技能', max: 100 },
      { name: '证书', max: 100 },
      { name: '创新能力', max: 100 },
      { name: '学习能力', max: 100 },
      { name: '抗压能力', max: 100 },
      { name: '沟通能力', max: 100 },
      { name: '实习经验', max: 100 }
    ],
    series: [{ value: [d.professional, d.certificate, d.innovation, d.learning, d.stress, d.communication, d.internship] }]
  }
})

const formatSkillLabel = (key: string) => {
  const labels: any = { 
    professionalSkills: '专业技能', 
    certificates: '获得证书', 
    internship: '实习经历' 
  }
  return labels[key] || key
}
</script>

<style scoped>
.profile {
  padding-top: 20px;
  padding-bottom: 20px;
  padding-left: 20px;
  padding-right: 20px;
  background-color: #f0f2f5;
  min-height: 100vh;
  position: relative;
}

/* 全屏遮罩层样式 */
.drop-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(64, 158, 255, 0.9);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  border-width: 4px;
  border-style: dashed;
  border-color: #ffffff;
}

.mask-content {
  text-align: center;
  color: #ffffff;
}

.mask-icon {
  font-size: 80px;
}

.mask-content p {
  font-size: 24px;
  margin-top: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.page-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin-top: 0;
  margin-bottom: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.upload-card {
  max-width: 700px;
  margin-top: 40px;
  margin-bottom: 40px;
  margin-left: auto;
  margin-right: auto;
  padding-top: 40px;
  padding-bottom: 40px;
  padding-left: 40px;
  padding-right: 40px;
  border-radius: 20px;
}

.upload-area {
  margin-bottom: 20px;
}

.attachment-container {
  margin-top: 25px;
  margin-bottom: 25px;
  padding-top: 15px;
  padding-bottom: 15px;
  padding-left: 20px;
  padding-right: 20px;
  background-color: #f8f9fb;
  border-width: 1px;
  border-style: dashed;
  border-color: #dcdfe6;
  border-radius: 12px;
}

.attachment-header {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.attachment-item {
  display: flex;
  align-items: center;
  background-color: #ffffff;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: 18px;
  padding-right: 18px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.file-icon {
  font-size: 28px;
  color: #409eff;
  margin-right: 15px;
}

.file-name {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  flex: 1;
}

.delete-icon {
  font-size: 20px;
  color: #f56c6c;
  cursor: pointer;
  transition-property: all;
  transition-duration: 0.3s;
}

.delete-icon:hover {
  transform: scale(1.2);
}

.upload-actions {
  margin-top: 30px;
  display: flex;
  gap: 20px;
  justify-content: center;
}

.info-row {
  margin-bottom: 20px;
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

.chart-row {
  margin-bottom: 20px;
}

.tags-container {
  max-height: 400px;
  overflow-y: auto;
  text-align: left;
}

.tag-group {
  margin-bottom: 20px;
}

.tag-group h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #606266;
  font-size: 16px;
}

.tag-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>