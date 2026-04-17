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
      <!-- 正常上传区域 -->
      <template v-if="!uploading">
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
          <el-button type="primary" size="large" @click="handleAnalysis">
            开始 AI 解析
          </el-button>
          <el-button size="large" @click="showManualDialog = true">手动填写</el-button>
        </div>
      </template>

      <!-- AI 智能体工作进度 -->
      <div v-else class="agent-progress">
        <div class="agent-header">
          <span class="agent-icon">🤖</span>
          <span class="agent-title">AI 智能体正在工作中...</span>
        </div>
        <el-steps :active="agentStep" finish-status="success" direction="vertical" class="agent-steps">
          <el-step title="读取简历文件" :description="agentStep > 0 ? '文本提取完成 ✓' : '提取 PDF / Word 文本内容...'" />
          <el-step title="调用 Dify 智能体" :description="agentStep === 1 ? '正在连接，请稍候（约5-15秒）...' : agentStep > 1 ? '智能体响应完成 ✓' : ''" />
          <el-step title="解析能力维度" :description="agentStep === 2 ? '正在构建你的能力画像...' : agentStep > 2 ? '画像生成完成 ✓' : ''" />
        </el-steps>
        <div class="agent-tip">
          <el-icon><InfoFilled /></el-icon>
          基于 Dify 平台 · qwen3.5-plus 大模型 · 请耐心等待
        </div>
      </div>
    </el-card>

    <div v-else class="profile-content">      <!-- AI来源标注 -->
      <div class="source-banner" :class="isFallbackMode ? 'fallback-banner' : 'ai-banner'">
        <span v-if="!isFallbackMode">
          <el-icon><Cpu /></el-icon>
          &nbsp;由 <strong>Dify AI 智能体</strong> 解析生成 · qwen3.5-plus · 结果可信
        </span>
        <span v-else>
          <el-icon><Warning /></el-icon>
          &nbsp;由<strong>本地规则引擎</strong>解析 · AI服务未接入 · 结果仅供参考
        </span>
      </div>
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
            <div style="height:360px">
              <RadarChart
                v-if="profile && profile.dimensions"
                :data="radarData"
              />
            </div>
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

    <!-- 手动填写弹窗 -->
    <el-dialog
      v-model="showManualDialog"
      title="手动填写简历内容"
      width="640px"
      :close-on-click-modal="false"
    >
      <p class="manual-tip">将你的简历文字内容粘贴到下方，AI 将自动解析生成能力画像。</p>
      <el-input
        v-model="manualText"
        type="textarea"
        :rows="12"
        placeholder="粘贴简历文字内容，例如：&#10;姓名：张三&#10;专业：计算机科学与技术&#10;技能：Java、Spring Boot、MySQL...&#10;实习经历：xxx公司后端开发实习生..."
        maxlength="4000"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showManualDialog = false">取消</el-button>
        <el-button
          type="primary"
          :loading="manualAnalyzing"
          :disabled="!manualText.trim()"
          @click="handleManualAnalysis"
        >
          {{ manualAnalyzing ? 'AI 解析中...' : '提交并解析' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'
import {
  UploadFilled,
  User,
  DataLine,
  Collection,
  Document,
  CircleClose,
  InfoFilled,
  Warning,
  Cpu,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store'
import RadarChart from '@/components/RadarChart.vue'

// 类型定义（符合 A13 赛题要求）
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
// 💡 profile 通过 store 响应式联动
const profile = computed(() => userStore.studentProfile)
const uploading = ref(false)
const agentStep = ref(0)       // 0=文件读取 1=Dify调用中 2=解析维度 3=完成
const selectedFile = ref<UploadRawFile | null>(null)
const isDragging = ref(false)
const isFallbackMode = ref(false)
const showManualDialog = ref(false)
const manualText = ref('')
const manualAnalyzing = ref(false)

const colors = [
  { color: '#f56c6c', percentage: 60 },
  { color: '#e6a23c', percentage: 80 },
  { color: '#5cb87a', percentage: 100 },
]

// 文件校验逻辑
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

// 核心：全屏拖拽逻辑
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

const handleExit = () => {
  console.log('点击了退出按钮') // 调试点 1
  
  ElMessageBox.confirm('确定要退出并清除当前简历数据吗？', '提示', {
    confirmButtonText: '确定清除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    console.log('确认清除，准备调用 Store...') // 调试点 2
    
    // 1. 清除当前页面文件选中状态
    selectedFile.value = null
    
    // 2. 强制清除 Store 数据
    // 如果 setStudentProfile 还是没反应，可以尝试下面注释掉的暴力写法
    userStore.setStudentProfile(null) 
    
    // 暴力写法 (仅当上面一行失效时使用):
    // userStore.$patch({ studentProfile: null })
    
    console.log('Store 清除命令已发送') // 调试点 3
    ElMessage.success('数据已成功清除')
  }).catch(() => {
    console.log('用户取消了清除')
  })
}

const handleManualAnalysis = async () => {
  if (!manualText.value.trim()) return
  manualAnalyzing.value = true
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'
    const response = await fetch(`${baseURL}/api/analyze-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText: manualText.value }),
    })
    const result = await response.json()
    if (result.code === 0) {
      isFallbackMode.value = result.source === 'fallback'
      userStore.setStudentProfile(result.data)
      if (result.resumeText) userStore.setResumeText(result.resumeText)
      showManualDialog.value = false
      manualText.value = ''
      ElNotification({
        title: result.source === 'fallback' ? '解析完成（本地模式）' : 'AI 解析完成',
        message: `已识别 ${result.data?.skills?.professionalSkills?.length || 0} 项技能`,
        type: result.source === 'fallback' ? 'warning' : 'success',
        duration: 4000,
        position: 'top-right',
      })
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    ElMessage.error('解析失败：' + (error.message || '请稍后重试'))
  } finally {
    manualAnalyzing.value = false
  }
}

const handleAnalysis = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传简历文件');
    return;
  }

  uploading.value = true;
  agentStep.value = 0;

  try {
    // 步骤1：构建文件数据（读取文件）
    const formData = new FormData();
    formData.append('resume', selectedFile.value);
    agentStep.value = 1;  // 进入"调用Dify智能体"阶段

    const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
    const response = await fetch(`${baseURL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    agentStep.value = 2;  // 进入"解析维度"阶段
    const result = await response.json();

    if (result.code === 0) {
      agentStep.value = 3;  // 完成
      await new Promise(r => setTimeout(r, 400));  // 让步骤3显示一下

      isFallbackMode.value = result.source === 'fallback'
      userStore.setStudentProfile(result.data);
      if (result.resumeText) {
        userStore.setResumeText(result.resumeText)
      }

      if (result.source === 'fallback') {
        ElNotification({
          title: '简历解析完成（本地模式）',
          message: '已从简历中识别技能和基本信息。如需更精准的AI分析，请确认Dify服务已正常配置。',
          type: 'warning',
          duration: 5000,
          position: 'top-right',
        });
      } else {
        ElNotification({
          title: 'AI 智能体解析完成',
          message: `已由 Dify 智能体生成能力画像，识别到 ${result.data?.skills?.professionalSkills?.length || 0} 项技能。`,
          type: 'success',
          duration: 4000,
          position: 'top-right',
        });
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('解析失败:', error);
    ElMessage.error('解析失败，请检查后端连接');
  } finally {
    uploading.value = false;
    agentStep.value = 0;
  }
};

// 雷达图数据计算
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
    series: [{ 
      name: '能力画像', // 💡 必须有 name，否则 Legend 报错
      data: [[ // 💡 必须是双重数组 [[]]
        d.professional, 
        d.certificate, 
        d.innovation, 
        d.learning, 
        d.stress, 
        d.communication, 
        d.internship
      ]] 
    }]
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

/* AI智能体进度 */
.agent-progress {
  padding: 20px 10px;
  text-align: center;
}
.agent-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 28px;
}
.agent-icon { font-size: 32px; animation: bounce 1s infinite; }
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.agent-title { font-size: 18px; font-weight: 600; color: #409eff; }
.agent-steps { text-align: left; max-width: 340px; margin: 0 auto 20px; }
.agent-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  background: #f8faff;
  border-radius: 8px;
  padding: 8px 16px;
}

/* AI来源标注条 */
.source-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}
.ai-banner {
  background: linear-gradient(90deg, #ecf5ff, #f0f9ff);
  color: #409eff;
  border: 1px solid #b3d8ff;
}
.fallback-banner {
  background: #fdf6ec;
  color: #e6a23c;
  border: 1px solid #faecd8;
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

.manual-tip {
  font-size: 13px;
  color: #909399;
  margin: 0 0 12px;
}
</style>