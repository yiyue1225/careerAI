<template>
  <div class="match-report">
    <!-- 无简历提示 -->
    <el-result
      v-if="!studentProfile"
      icon="warning"
      title="请先上传简历"
      sub-title="职业匹配分析需要先完成能力画像解析"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/profile')">前往上传简历</el-button>
      </template>
    </el-result>

    <template v-else>
      <div class="page-header">
        <h1 class="page-title">职业匹配分析</h1>
        <p class="page-subtitle">选择 1-5 个目标岗位，AI 为每个岗位生成专属匹配报告</p>
      </div>

      <!-- ============ 步骤 0：选岗位 ============ -->
      <div v-if="!analysisMode">
        <el-row :gutter="20">
          <!-- 左：搜索结果 -->
          <el-col :span="16">
            <el-card shadow="hover" class="search-card">
              <template #header>
                <div class="search-header">
                  <span>搜索目标岗位</span>
                  <span class="total-hint">共 {{ totalCount.toLocaleString() }}+ 个岗位</span>
                </div>
              </template>
              <el-input
                v-model="posSearch"
                placeholder="输入岗位名称（如：Java、产品经理、数据分析）"
                clearable
                @input="onSearchInput"
                @clear="onSearchInput"
                style="margin-bottom:16px"
              >
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>

              <div v-loading="searchLoading" class="pos-results">
                <el-empty v-if="searchResults.length === 0 && !searchLoading" description="暂无结果，换个关键词试试" :image-size="60" />
                <div
                  v-for="pos in searchResults"
                  :key="pos.id"
                  :class="['pos-item', isSelected(pos.id) ? 'pos-item-selected' : '', selectedPositions.length >= 5 && !isSelected(pos.id) ? 'pos-item-disabled' : '']"
                  @click="toggleSelect(pos)"
                >
                  <div class="pos-item-body">
                    <h4>{{ pos.name }}</h4>
                    <p>{{ pos.company }} · {{ pos.location }} · <span class="salary-text">{{ pos.salary }}</span></p>
                    <div class="pos-skills">
                      <el-tag v-for="s in (pos.requirements?.professionalSkills || []).slice(0,3)" :key="s" size="small" effect="plain">{{ s }}</el-tag>
                    </div>
                  </div>
                  <div class="pos-item-right">
                    <el-progress
                      type="dashboard"
                      :percentage="calcMatchScore(studentProfile.dimensions, pos.dimensions || {})"
                      :color="matchColors"
                      :width="68"
                      :stroke-width="6"
                    />
                    <div class="match-pct-label">匹配度</div>
                    <el-icon v-if="isSelected(pos.id)" class="check-icon"><CircleCheckFilled /></el-icon>
                  </div>
                </div>
              </div>

              <!-- 分页 -->
              <div class="search-pagination">
                <el-pagination
                  v-if="searchTotal > searchPageSize"
                  background
                  layout="prev, pager, next"
                  :total="searchTotal"
                  :page-size="searchPageSize"
                  v-model:current-page="searchPage"
                  @current-change="onPageChange"
                  small
                />
                <span v-if="searchTotal > 0" class="page-count-tip">
                  共 {{ searchTotal }} 条，第 {{ searchPage }}/{{ Math.ceil(searchTotal / searchPageSize) }} 页
                </span>
              </div>
            </el-card>
          </el-col>

          <!-- 右：已选列表 -->
          <el-col :span="8">
            <el-card shadow="hover" class="selected-card">
              <template #header>
                <div class="selected-header">
                  <span>已选岗位</span>
                  <el-tag :type="selectedPositions.length >= 5 ? 'danger' : 'info'">
                    {{ selectedPositions.length }} / 5
                  </el-tag>
                </div>
              </template>

              <el-empty v-if="selectedPositions.length === 0" description="从左侧搜索并选择岗位" :image-size="60" />

              <transition-group name="list" tag="div" class="selected-list">
                <div v-for="(pos, idx) in selectedPositions" :key="pos.id" class="selected-item">
                  <div class="selected-rank">{{ idx + 1 }}</div>
                  <div class="selected-info">
                    <div class="selected-name">{{ pos.name }}</div>
                    <div class="selected-meta">{{ pos.company }}</div>
                  </div>
                  <el-tag
                    :type="getMatchTagType(calcMatchScore(studentProfile.dimensions, pos.dimensions || {}))"
                    size="small"
                  >
                    {{ calcMatchScore(studentProfile.dimensions, pos.dimensions || {}) }}%
                  </el-tag>
                  <el-icon class="remove-icon" @click.stop="removePosition(pos.id)"><CircleClose /></el-icon>
                </div>
              </transition-group>

              <div class="selected-tip" v-if="selectedPositions.length > 0">
                最多可选 5 个，点击岗位可取消选择
              </div>

              <el-button
                type="primary"
                size="large"
                style="width:100%;margin-top:16px"
                :disabled="selectedPositions.length === 0"
                @click="startAnalysis"
                round
              >
                开始匹配分析 ({{ selectedPositions.length }}) →
              </el-button>
            </el-card>

            <!-- 我的能力简况 -->
            <el-card shadow="hover" style="margin-top:16px">
              <template #header><span>我的能力简况</span></template>
              <div style="height:200px">
                <RadarChart :data="myRadarData" />
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- ============ 分析模式：标签栏切换 ============ -->
      <div v-else>
        <!-- 顶部操作栏 -->
        <div class="analysis-toolbar">
          <el-button plain size="small" :icon="ArrowLeft" @click="backToSelect">重新选择岗位</el-button>
          <span class="toolbar-hint">点击标签切换岗位，查看各岗位专属分析报告</span>
        </div>

        <el-tabs
          v-model="activeTab"
          type="card"
          class="pos-tabs"
          @tab-click="onTabClick"
        >
          <el-tab-pane
            v-for="pos in selectedPositions"
            :key="pos.id"
            :name="pos.id"
          >
            <template #label>
              <div class="tab-label-wrap">
                <span class="tab-pos-name">{{ pos.name }}</span>
                <el-tag
                  :type="getMatchTagType(calcMatchScore(studentProfile.dimensions, pos.dimensions || {}))"
                  size="small"
                  class="tab-match-tag"
                >
                  {{ calcMatchScore(studentProfile.dimensions, pos.dimensions || {}) }}%
                </el-tag>
              </div>
            </template>

            <!-- 每个 tab 的完整分析内容 -->
            <div class="analysis-content">
              <PositionAnalysis
                :position="pos"
                :student-profile="studentProfile"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Search, CircleCheckFilled, CircleClose, ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/store'
import RadarChart from '@/components/RadarChart.vue'
import PositionAnalysis from '@/components/PositionAnalysis.vue'
import { calcMatchScore, getMatchTagType, DIMS, DIM_LABELS } from '@/utils/match'

const userStore = useUserStore()
const studentProfile = computed(() => userStore.studentProfile)

const matchColors = [
  { color: '#f56c6c', percentage: 50 },
  { color: '#e6a23c', percentage: 70 },
  { color: '#5cb87a', percentage: 100 },
]

// ==========================================
// 搜索
// ==========================================
const posSearch = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const totalCount = ref(10000)
const searchTotal = ref(0)
const searchPage = ref(1)
const searchPageSize = 8
let searchTimer: ReturnType<typeof setTimeout> | null = null

const fetchTotalCount = async () => {
  try {
    const res = await axios.get('/api/stats')
    if (res.data.code === 0) totalCount.value = res.data.data.totalPositions
  } catch {}
}

const searchPositions = async (keyword: string, page = 1) => {
  searchLoading.value = true
  try {
    const res = await axios.get('/api/positions', {
      params: { page, size: searchPageSize, search: keyword || '' }
    })
    if (res.data.code === 0) {
      searchResults.value = res.data.data
      searchTotal.value = res.data.total || 0
      searchPage.value = page
    }
  } finally {
    searchLoading.value = false
  }
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => searchPositions(posSearch.value, 1), 400)
}

const onPageChange = (page: number) => {
  searchPositions(posSearch.value, page)
}

// ==========================================
// 选择岗位（最多5个）
// ==========================================
const selectedPositions = ref<any[]>([])

const isSelected = (id: string) => selectedPositions.value.some(p => p.id === id)

const toggleSelect = (pos: any) => {
  if (isSelected(pos.id)) {
    removePosition(pos.id)
    return
  }
  if (selectedPositions.value.length >= 5) {
    ElMessage.warning('最多选择 5 个岗位')
    return
  }
  selectedPositions.value.push(pos)
  ElMessage.success(`已添加「${pos.name}」`)
}

const removePosition = (id: string) => {
  const idx = selectedPositions.value.findIndex(p => p.id === id)
  if (idx >= 0) selectedPositions.value.splice(idx, 1)
}

// ==========================================
// 分析模式
// ==========================================
const analysisMode = ref(false)
const activeTab = ref('')

const startAnalysis = () => {
  if (selectedPositions.value.length === 0) return
  activeTab.value = selectedPositions.value[0].id
  analysisMode.value = true
  nextTick(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

const backToSelect = () => {
  analysisMode.value = false
}

const onTabClick = (tab: any) => {
  activeTab.value = tab.props.name
  // ECharts 在隐藏 tab 中初始化尺寸为 0，切换后必须触发 resize
  nextTick(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

// ==========================================
// 我的雷达图（选择页右侧展示）
// ==========================================
const myRadarData = computed(() => {
  if (!studentProfile.value) return { indicator: [], series: [] }
  const d = studentProfile.value.dimensions
  return {
    indicator: DIMS.map(k => ({ name: DIM_LABELS[k].slice(0, 2), max: 100 })),
    series: [{ name: '我的能力', data: [DIMS.map(k => d[k] || 0)] }]
  }
})

// ==========================================
// 初始化
// ==========================================
onMounted(() => {
  fetchTotalCount()
  searchPositions('')
  // 从岗位库跳转来的，自动加载目标岗位
  if (userStore.targetPositionId) {
    axios.get(`/api/positions/${userStore.targetPositionId}`).then(res => {
      if (res.data.code === 0) {
        const pos = res.data.data
        if (!isSelected(pos.id)) selectedPositions.value.push(pos)
        activeTab.value = pos.id
      }
    }).catch(() => {})
  }
})
</script>

<style scoped>
.match-report {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
}
.page-header { margin-bottom: 24px; }
.page-title { font-size: 32px; font-weight: 600; color: #303133; margin: 0 0 6px; }
.page-subtitle { color: #909399; font-size: 14px; margin: 0; }

/* 搜索区 */
.search-card { border-radius: 12px; }
.search-header { display: flex; justify-content: space-between; align-items: center; }
.total-hint { font-size: 13px; color: #909399; }

.pos-results { display: flex; flex-direction: column; gap: 10px; min-height: 300px; max-height: 520px; overflow-y: auto; }
.pos-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border: 2px solid #e4e7ed; border-radius: 10px;
  cursor: pointer; transition: all 0.2s; position: relative;
}
.pos-item:hover { border-color: #409eff; background: #f5f9ff; }
.pos-item-selected { border-color: #409eff; background: #ecf5ff; }
.pos-item-disabled { opacity: 0.5; cursor: not-allowed; }

.search-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}
.page-count-tip { font-size: 12px; color: #909399; }
.pos-item-body { flex: 1; }
.pos-item-body h4 { margin: 0 0 3px; font-size: 15px; color: #303133; }
.pos-item-body p { margin: 0 0 6px; font-size: 12px; color: #909399; }
.pos-skills { display: flex; gap: 4px; flex-wrap: wrap; }
.salary-text { color: #f56c6c; font-weight: 600; }
.pos-item-right { text-align: center; flex-shrink: 0; position: relative; }
.match-pct-label { font-size: 11px; color: #909399; margin-top: 2px; }
.check-icon { position: absolute; top: -8px; right: -8px; font-size: 18px; color: #409eff; }

/* 已选列表 */
.selected-card { border-radius: 12px; }
.selected-header { display: flex; justify-content: space-between; align-items: center; }
.selected-list { display: flex; flex-direction: column; gap: 8px; }
.selected-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border: 1px solid #e4e7ed; border-radius: 8px;
  background: #fafafa;
}
.selected-rank {
  width: 22px; height: 22px; border-radius: 50%; background: #409eff; color: #fff;
  font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.selected-info { flex: 1; min-width: 0; }
.selected-name { font-size: 13px; font-weight: 600; color: #303133; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.selected-meta { font-size: 11px; color: #909399; }
.remove-icon { cursor: pointer; color: #c0c4cc; font-size: 16px; flex-shrink: 0; }
.remove-icon:hover { color: #f56c6c; }
.selected-tip { font-size: 12px; color: #c0c4cc; text-align: center; margin-top: 8px; }

/* 动画 */
.list-enter-active, .list-leave-active { transition: all 0.25s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(20px); }

/* 分析模式 */
.analysis-toolbar {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 16px; padding: 12px 16px;
  background: #fff; border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.toolbar-hint { font-size: 13px; color: #909399; }

.pos-tabs { background: #fff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); overflow: hidden; }
.pos-tabs :deep(.el-tabs__header) { margin: 0; background: #f8faff; }
.pos-tabs :deep(.el-tabs__item) { height: 48px; }
.pos-tabs :deep(.el-tabs__content) { padding: 0; }

.tab-label-wrap { display: flex; align-items: center; gap: 6px; }
.tab-pos-name { font-size: 13px; font-weight: 600; max-width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tab-match-tag { flex-shrink: 0; }

.analysis-content { padding: 24px; }
</style>
