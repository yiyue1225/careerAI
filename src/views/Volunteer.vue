<template>
  <div class="volunteer">
    <!-- 无简历提示 -->
    <el-result
      v-if="!studentProfile"
      icon="warning"
      title="请先上传简历"
      sub-title="需要先完成能力画像分析，才能进行智能求职投递"
    >
      <template #extra>
        <el-button type="primary" @click="$router.push('/profile')">前往上传简历</el-button>
      </template>
    </el-result>

    <template v-else>
      <div class="page-header">
        <h1 class="page-title">智能求职投递</h1>
        <p class="page-subtitle">基于你的能力画像，智能推荐冲、稳、保三档岗位，制定最优求职策略</p>
      </div>

      <!-- 步骤条 -->
      <el-steps :active="activeStep" finish-status="success" class="steps-bar" align-center>
        <el-step title="设置偏好" description="行业/城市/薪资" />
        <el-step title="智能推荐" description="冲稳保三档" />
        <el-step title="填写志愿" description="选择你的志愿" />
        <el-step title="志愿报告" description="查看完整清单" />
      </el-steps>

      <!-- 步骤 0：设置偏好 -->
      <div v-if="activeStep === 0" class="step-pane">
        <el-card shadow="hover" class="pref-card">
          <template #header><span>设置求职偏好</span></template>
          <el-form :model="preference" label-width="100px" size="large">
            <el-form-item label="目标行业">
              <el-select v-model="preference.industries" multiple placeholder="可多选，不限则留空" filterable style="width:100%">
                <el-option v-for="i in filterOptions.industries" :key="i" :label="i" :value="i" />
              </el-select>
            </el-form-item>
            <el-form-item label="目标城市">
              <el-select v-model="preference.cities" multiple placeholder="可多选，不限则留空" filterable style="width:100%">
                <el-option v-for="c in filterOptions.cities" :key="c" :label="c" :value="c" />
              </el-select>
            </el-form-item>
            <el-form-item label="薪资期望">
              <el-select v-model="preference.salary" placeholder="不限" clearable style="width:200px">
                <el-option label="不限" value="" />
                <el-option label="10K以下" value="0-10" />
                <el-option label="10K-20K" value="10-20" />
                <el-option label="20K-30K" value="20-30" />
                <el-option label="30K以上" value="30+" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="step-actions">
            <el-button type="primary" size="large" :loading="recommending" @click="doRecommend" round>
              智能推荐匹配岗位
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 步骤 1：智能推荐（冲稳保三档） -->
      <div v-if="activeStep === 1" class="step-pane">
        <div class="tier-legend">
          <span class="legend-item rush"><el-icon><Promotion /></el-icon> 冲一冲（匹配度 50-69%）挑战自我，争取突破</span>
          <span class="legend-item stable"><el-icon><DataLine /></el-icon> 稳一稳（匹配度 70-84%）实力匹配，稳健进击</span>
          <span class="legend-item safe"><el-icon><CircleCheck /></el-icon> 保一保（匹配度 85%+）高度契合，稳妥保底</span>
        </div>

        <el-tabs v-model="activeTab" type="border-card" class="tier-tabs">
          <!-- 冲 -->
          <el-tab-pane name="rush">
            <template #label>
              <span class="tab-label rush-label">🚀 冲一冲 ({{ tierData.rush.length }})</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="8" v-for="pos in tierData.rush" :key="pos.id">
                <el-card class="tier-card rush-card-border" shadow="hover" style="margin-bottom:16px">
                  <div class="tier-card-header">
                    <h4>{{ pos.name }}</h4>
                    <el-tag type="warning" size="small">{{ pos.matchLevel }}%</el-tag>
                  </div>
                  <p class="tier-card-meta">{{ pos.company }} · {{ pos.location }}</p>
                  <p class="tier-card-salary">{{ pos.salary }}</p>
                  <div class="tier-card-skills">
                    <el-tag v-for="s in (pos.requirements?.professionalSkills || []).slice(0,3)" :key="s" size="small" effect="plain">{{ s }}</el-tag>
                  </div>
                  <el-button :type="isInWishlist(pos) ? 'warning' : 'default'" size="small" style="width:100%;margin-top:10px" @click="toggleWishlist(pos, 'rush')">
                    {{ isInWishlist(pos) ? '✓ 已加入志愿' : '+ 加入冲刺志愿' }}
                  </el-button>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-if="tierData.rush.length === 0" description="暂无冲刺岗位，尝试调整偏好" />
          </el-tab-pane>

          <!-- 稳 -->
          <el-tab-pane name="stable">
            <template #label>
              <span class="tab-label stable-label">⚖️ 稳一稳 ({{ tierData.stable.length }})</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="8" v-for="pos in tierData.stable" :key="pos.id">
                <el-card class="tier-card stable-card-border" shadow="hover" style="margin-bottom:16px">
                  <div class="tier-card-header">
                    <h4>{{ pos.name }}</h4>
                    <el-tag type="primary" size="small">{{ pos.matchLevel }}%</el-tag>
                  </div>
                  <p class="tier-card-meta">{{ pos.company }} · {{ pos.location }}</p>
                  <p class="tier-card-salary">{{ pos.salary }}</p>
                  <div class="tier-card-skills">
                    <el-tag v-for="s in (pos.requirements?.professionalSkills || []).slice(0,3)" :key="s" size="small" effect="plain" type="primary">{{ s }}</el-tag>
                  </div>
                  <el-button :type="isInWishlist(pos) ? 'primary' : 'default'" size="small" style="width:100%;margin-top:10px" @click="toggleWishlist(pos, 'stable')">
                    {{ isInWishlist(pos) ? '✓ 已加入志愿' : '+ 加入稳健志愿' }}
                  </el-button>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-if="tierData.stable.length === 0" description="暂无稳健岗位" />
          </el-tab-pane>

          <!-- 保 -->
          <el-tab-pane name="safe">
            <template #label>
              <span class="tab-label safe-label">🛡️ 保一保 ({{ tierData.safe.length }})</span>
            </template>
            <el-row :gutter="20">
              <el-col :span="8" v-for="pos in tierData.safe" :key="pos.id">
                <el-card class="tier-card safe-card-border" shadow="hover" style="margin-bottom:16px">
                  <div class="tier-card-header">
                    <h4>{{ pos.name }}</h4>
                    <el-tag type="success" size="small">{{ pos.matchLevel }}%</el-tag>
                  </div>
                  <p class="tier-card-meta">{{ pos.company }} · {{ pos.location }}</p>
                  <p class="tier-card-salary">{{ pos.salary }}</p>
                  <div class="tier-card-skills">
                    <el-tag v-for="s in (pos.requirements?.professionalSkills || []).slice(0,3)" :key="s" size="small" effect="plain" type="success">{{ s }}</el-tag>
                  </div>
                  <el-button :type="isInWishlist(pos) ? 'success' : 'default'" size="small" style="width:100%;margin-top:10px" @click="toggleWishlist(pos, 'safe')">
                    {{ isInWishlist(pos) ? '✓ 已加入志愿' : '+ 加入保底志愿' }}
                  </el-button>
                </el-card>
              </el-col>
            </el-row>
            <el-empty v-if="tierData.safe.length === 0" description="暂无保底岗位" />
          </el-tab-pane>
        </el-tabs>

        <div class="step-actions">
          <el-button @click="activeStep = 0">重新设置偏好</el-button>
          <el-button type="primary" @click="activeStep = 2" :disabled="wishlist.length === 0">
            已选 {{ wishlist.length }} 个，填写志愿表 →
          </el-button>
        </div>
      </div>

      <!-- 步骤 2：志愿表 -->
      <div v-if="activeStep === 2" class="step-pane">
        <el-row :gutter="20">
          <!-- 已选志愿 -->
          <el-col :span="16">
            <el-card shadow="hover">
              <template #header>
                <div class="wishlist-header">
                  <span>我的志愿清单</span>
                  <el-tag type="info">已填 {{ wishlist.length }} / 最多 9 个</el-tag>
                </div>
              </template>
              <div v-if="wishlist.length === 0" class="empty-wishlist">
                <el-empty description="还没有添加志愿，请返回上一步选择" />
              </div>
              <div v-else>
                <!-- 冲 -->
                <div class="wishlist-section">
                  <div class="section-title rush-bg">🚀 冲一冲志愿</div>
                  <transition-group name="list" tag="div">
                    <div v-for="(pos, idx) in rushList" :key="pos.id" class="wishlist-item rush-item">
                      <span class="order-badge rush-badge">冲 {{ idx + 1 }}</span>
                      <div class="item-info">
                        <strong>{{ pos.name }}</strong>
                        <span class="item-meta">{{ pos.company }} · {{ pos.location }} · {{ pos.salary }}</span>
                      </div>
                      <el-tag type="warning" size="small">{{ pos.matchLevel }}%</el-tag>
                      <el-button text type="danger" size="small" @click="removeFromWishlist(pos)">移除</el-button>
                    </div>
                    <div v-if="rushList.length === 0" key="empty-rush" class="empty-tier">暂未选择冲刺志愿</div>
                  </transition-group>
                </div>
                <!-- 稳 -->
                <div class="wishlist-section">
                  <div class="section-title stable-bg">⚖️ 稳一稳志愿</div>
                  <transition-group name="list" tag="div">
                    <div v-for="(pos, idx) in stableList" :key="pos.id" class="wishlist-item stable-item">
                      <span class="order-badge stable-badge">稳 {{ idx + 1 }}</span>
                      <div class="item-info">
                        <strong>{{ pos.name }}</strong>
                        <span class="item-meta">{{ pos.company }} · {{ pos.location }} · {{ pos.salary }}</span>
                      </div>
                      <el-tag type="primary" size="small">{{ pos.matchLevel }}%</el-tag>
                      <el-button text type="danger" size="small" @click="removeFromWishlist(pos)">移除</el-button>
                    </div>
                    <div v-if="stableList.length === 0" key="empty-stable" class="empty-tier">暂未选择稳健志愿</div>
                  </transition-group>
                </div>
                <!-- 保 -->
                <div class="wishlist-section">
                  <div class="section-title safe-bg">🛡️ 保一保志愿</div>
                  <transition-group name="list" tag="div">
                    <div v-for="(pos, idx) in safeList" :key="pos.id" class="wishlist-item safe-item">
                      <span class="order-badge safe-badge">保 {{ idx + 1 }}</span>
                      <div class="item-info">
                        <strong>{{ pos.name }}</strong>
                        <span class="item-meta">{{ pos.company }} · {{ pos.location }} · {{ pos.salary }}</span>
                      </div>
                      <el-tag type="success" size="small">{{ pos.matchLevel }}%</el-tag>
                      <el-button text type="danger" size="small" @click="removeFromWishlist(pos)">移除</el-button>
                    </div>
                    <div v-if="safeList.length === 0" key="empty-safe" class="empty-tier">暂未选择保底志愿</div>
                  </transition-group>
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右侧：能力雷达图 -->
          <el-col :span="8">
            <el-card shadow="hover" style="margin-bottom:20px">
              <template #header><span>我的能力画像</span></template>
              <RadarChart :data="myRadarData" />
            </el-card>
            <el-card shadow="hover">
              <template #header><span>填报建议</span></template>
              <div class="advice-list">
                <div class="advice-item">
                  <el-icon color="#e6a23c"><Warning /></el-icon>
                  冲刺志愿建议选择 <strong>1-3个</strong>，不要盲目追高
                </div>
                <div class="advice-item">
                  <el-icon color="#409eff"><InfoFilled /></el-icon>
                  稳健志愿是主力，建议选择 <strong>3-5个</strong>
                </div>
                <div class="advice-item">
                  <el-icon color="#67c23a"><CircleCheck /></el-icon>
                  保底志愿至少 <strong>2个</strong>，确保托底
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <div class="step-actions">
          <el-button @click="activeStep = 1">← 返回重新选择</el-button>
          <el-button type="primary" @click="activeStep = 3" :disabled="wishlist.length === 0">
            生成志愿报告 →
          </el-button>
        </div>
      </div>

      <!-- 步骤 3：志愿报告 -->
      <div v-if="activeStep === 3" class="step-pane">
        <div id="volunteerReport" ref="reportRef">
          <div class="report-header">
            <h2>📋 求职志愿报告</h2>
            <p>生成时间：{{ reportDate }} &nbsp;|&nbsp; 学生：{{ studentProfile?.name || '未填写' }} &nbsp;|&nbsp; 专业：{{ studentProfile?.major || '未填写' }}</p>
          </div>

          <el-row :gutter="20" class="report-summary">
            <el-col :span="8">
              <div class="summary-card rush-card">
                <div class="summary-num">{{ rushList.length }}</div>
                <div class="summary-label">🚀 冲刺志愿</div>
                <div class="summary-desc">平均匹配度 {{ avgMatch(rushList) }}%</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="summary-card stable-card">
                <div class="summary-num">{{ stableList.length }}</div>
                <div class="summary-label">⚖️ 稳健志愿</div>
                <div class="summary-desc">平均匹配度 {{ avgMatch(stableList) }}%</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="summary-card safe-card">
                <div class="summary-num">{{ safeList.length }}</div>
                <div class="summary-label">🛡️ 保底志愿</div>
                <div class="summary-desc">平均匹配度 {{ avgMatch(safeList) }}%</div>
              </div>
            </el-col>
          </el-row>

          <el-table :data="reportTableData" border stripe style="width:100%;margin-top:20px">
            <el-table-column label="志愿序号" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.tierTag" size="small">{{ row.tierLabel }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="岗位名称" />
            <el-table-column prop="company" label="公司" width="150" />
            <el-table-column prop="location" label="城市" width="80" />
            <el-table-column prop="salary" label="薪资" width="100" />
            <el-table-column label="匹配度" width="120" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.matchLevel" :stroke-width="6"
                  :color="row.matchLevel >= 85 ? '#67c23a' : row.matchLevel >= 70 ? '#409eff' : '#e6a23c'" />
              </template>
            </el-table-column>
            <el-table-column label="主要差距" min-width="150">
              <template #default="{ row }">
                <span class="gap-text">{{ row.mainGap }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="step-actions">
          <el-button @click="activeStep = 2">← 调整志愿</el-button>
          <el-button type="primary" @click="exportReport">导出 PDF 报告</el-button>
          <el-button type="success" @click="$router.push('/match')">前往详细匹配分析</el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Promotion, DataLine, CircleCheck, Warning, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/store'
import RadarChart from '@/components/RadarChart.vue'
import axios from 'axios'
import html2pdf from 'html2pdf.js'

const router = useRouter()
const userStore = useUserStore()
const studentProfile = computed(() => userStore.studentProfile)

const activeStep = ref(0)
const activeTab = ref('rush')
const recommending = ref(false)
const reportRef = ref<HTMLElement>()
const reportDate = new Date().toLocaleDateString('zh-CN')

// ==========================================
// 偏好设置
// ==========================================
const preference = ref({ industries: [] as string[], cities: [] as string[], salary: '' })
const filterOptions = ref({ industries: [] as string[], cities: [] as string[] })

onMounted(async () => {
  try {
    const res = await axios.get('/api/position-filters')
    if (res.data.code === 0) {
      filterOptions.value.industries = res.data.industries
      filterOptions.value.cities = res.data.cities
    }
  } catch {}
})

// ==========================================
// 推荐逻辑（分3档）
// ==========================================
const tierData = ref<{ rush: any[]; stable: any[]; safe: any[] }>({ rush: [], stable: [], safe: [] })

const DIMS = ['professional', 'certificate', 'innovation', 'learning', 'stress', 'communication', 'internship']

const calcMatch = (pos: any) => {
  if (!studentProfile.value) return 0
  const d = studentProfile.value.dimensions
  let totalGap = 0
  DIMS.forEach(k => {
    totalGap += Math.abs((d[k] || 0) - (pos.dimensions?.[k] || 0))
  })
  return Math.round(Math.max(0, Math.min(100, 100 - totalGap / DIMS.length)))
}

const doRecommend = async () => {
  if (!studentProfile.value) return
  recommending.value = true
  try {
    const params: any = { page: 1, size: 60 }
    if (preference.value.cities.length === 1) params.city = preference.value.cities[0]
    if (preference.value.industries.length === 1) params.industry = preference.value.industries[0]
    if (preference.value.salary) params.salary = preference.value.salary

    const res = await axios.get('/api/positions', { params })
    if (res.data.code === 0) {
      const all = res.data.data.map((pos: any) => ({ ...pos, matchLevel: calcMatch(pos) }))
      tierData.value.rush = all.filter((p: any) => p.matchLevel >= 50 && p.matchLevel < 70).slice(0, 9)
      tierData.value.stable = all.filter((p: any) => p.matchLevel >= 70 && p.matchLevel < 85).slice(0, 9)
      tierData.value.safe = all.filter((p: any) => p.matchLevel >= 85).slice(0, 9)
      activeStep.value = 1
    }
  } catch (e) {
    ElMessage.error('获取推荐岗位失败')
  } finally {
    recommending.value = false
  }
}

// ==========================================
// 志愿表（wishlist）
// ==========================================
interface WishItem { id: string; name: string; company: string; location: string; salary: string; matchLevel: number; tier: string; dimensions: any; requirements: any }
const wishlist = ref<WishItem[]>([])

const isInWishlist = (pos: any) => wishlist.value.some(w => w.id === pos.id)

const toggleWishlist = (pos: any, tier: string) => {
  if (isInWishlist(pos)) {
    removeFromWishlist(pos)
    return
  }
  const tierCount = wishlist.value.filter(w => w.tier === tier).length
  if (tierCount >= 3) { ElMessage.warning(`每档最多选3个`); return }
  if (wishlist.value.length >= 9) { ElMessage.warning('志愿总数最多9个'); return }
  wishlist.value.push({ ...pos, tier })
  ElMessage.success(`已加入${tier === 'rush' ? '冲刺' : tier === 'stable' ? '稳健' : '保底'}志愿`)
}

const removeFromWishlist = (pos: any) => {
  const idx = wishlist.value.findIndex(w => w.id === pos.id)
  if (idx >= 0) wishlist.value.splice(idx, 1)
}

const rushList = computed(() => wishlist.value.filter(w => w.tier === 'rush'))
const stableList = computed(() => wishlist.value.filter(w => w.tier === 'stable'))
const safeList = computed(() => wishlist.value.filter(w => w.tier === 'safe'))

// ==========================================
// 我的雷达图
// ==========================================
const myRadarData = computed(() => {
  if (!studentProfile.value) return { indicator: [], series: [] }
  const d = studentProfile.value.dimensions
  return {
    indicator: [
      { name: '专业', max: 100 }, { name: '证书', max: 100 }, { name: '创新', max: 100 },
      { name: '学习', max: 100 }, { name: '抗压', max: 100 }, { name: '沟通', max: 100 }, { name: '实习', max: 100 }
    ],
    series: [{ name: '我的能力', data: [[d.professional, d.certificate, d.innovation, d.learning, d.stress, d.communication, d.internship]] }]
  }
})

// ==========================================
// 报告数据
// ==========================================
const DIM_LABELS: Record<string, string> = {
  professional: '专业技能', certificate: '证书', innovation: '创新能力',
  learning: '学习能力', stress: '抗压能力', communication: '沟通能力', internship: '实习经验'
}

const getMainGap = (pos: any) => {
  if (!studentProfile.value) return '–'
  const d = studentProfile.value.dimensions
  let maxGap = 0, maxKey = ''
  DIMS.forEach(k => {
    const gap = (pos.dimensions?.[k] || 0) - (d[k] || 0)
    if (gap > maxGap) { maxGap = gap; maxKey = k }
  })
  return maxKey ? `${DIM_LABELS[maxKey]}需提升 ${Math.round(maxGap)} 分` : '能力已达标'
}

const reportTableData = computed(() => [
  ...rushList.value.map((p, i) => ({ ...p, tierLabel: `冲 ${i + 1}`, tierTag: 'warning', mainGap: getMainGap(p) })),
  ...stableList.value.map((p, i) => ({ ...p, tierLabel: `稳 ${i + 1}`, tierTag: 'primary', mainGap: getMainGap(p) })),
  ...safeList.value.map((p, i) => ({ ...p, tierLabel: `保 ${i + 1}`, tierTag: 'success', mainGap: getMainGap(p) })),
])

const avgMatch = (list: any[]) => {
  if (!list.length) return 0
  return Math.round(list.reduce((s, p) => s + p.matchLevel, 0) / list.length)
}

const exportReport = () => {
  if (!reportRef.value) return
  html2pdf().set({
    margin: [0.5, 0.5, 0.5, 0.5],
    filename: '求职志愿报告.pdf',
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  }).from(reportRef.value).save()
}
</script>

<!-- Volunteer.vue -->

<style scoped>
.volunteer {
  padding: 20px;
  background: #f0f2f5;
  min-height: 100vh;
  padding-bottom: 60px;
}
.page-header { margin-bottom: 24px; }
.page-title { font-size: 32px; font-weight: 600; color: #303133; margin: 0 0 8px; }
.page-subtitle { color: #909399; font-size: 14px; }

.steps-bar { margin-bottom: 30px; background: #fff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }

.step-pane { background: #fff; border-radius: 16px; padding: 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.step-actions { display: flex; justify-content: center; gap: 20px; margin-top: 30px; }

/* 偏好卡片 */
.pref-card { max-width: 700px; margin: 0 auto; }

/* 分档说明 */
.tier-legend { display: flex; gap: 30px; margin-bottom: 20px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 14px; }
.rush { color: #e6a23c; }
.stable { color: #409eff; }
.safe { color: #67c23a; }

/* Tab 标签 */
.tab-label { font-weight: 600; font-size: 15px; }
.rush-label { color: #e6a23c; }
.stable-label { color: #409eff; }
.safe-label { color: #67c23a; }

/* 志愿表 */
.wishlist-header { display: flex; justify-content: space-between; align-items: center; }
.wishlist-section { margin-bottom: 16px; }
.section-title { font-weight: 600; padding: 8px 12px; border-radius: 8px 8px 0 0; font-size: 14px; }
.rush-bg { background: rgba(230,162,60,0.1); color: #e6a23c; }
.stable-bg { background: rgba(64,158,255,0.1); color: #409eff; }
.safe-bg { background: rgba(103,194,58,0.1); color: #67c23a; }

.wishlist-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #f0f2f5; }
.wishlist-item:last-child { border-bottom: none; }
.rush-item { border-left: 3px solid #e6a23c; }
.stable-item { border-left: 3px solid #409eff; }
.safe-item { border-left: 3px solid #67c23a; }

.order-badge { font-weight: 700; font-size: 13px; min-width: 34px; }
.rush-badge { color: #e6a23c; }
.stable-badge { color: #409eff; }
.safe-badge { color: #67c23a; }

.item-info { flex: 1; }
.item-info strong { display: block; font-size: 14px; }
.item-meta { font-size: 12px; color: #909399; }
.empty-tier { color: #c0c4cc; font-size: 13px; padding: 8px 12px; }
.empty-wishlist { padding: 20px 0; }

/* 建议列表 */
.advice-list { display: flex; flex-direction: column; gap: 12px; }
.advice-item { display: flex; align-items: flex-start; gap: 8px; font-size: 14px; color: #606266; line-height: 1.5; }

/* 报告 */
.report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #e4e7ed; }
.report-header h2 { margin: 0 0 8px; font-size: 26px; color: #303133; }
.report-header p { color: #909399; font-size: 13px; margin: 0; }
.report-summary { margin-bottom: 20px; }
.summary-card { text-align: center; padding: 24px; border-radius: 12px; }
.rush-card { background: linear-gradient(135deg, #fff7e6, #ffecd2); border: 1px solid #e6a23c; }
.stable-card { background: linear-gradient(135deg, #ecf5ff, #d9ecff); border: 1px solid #409eff; }
.safe-card { background: linear-gradient(135deg, #f0f9eb, #d9f0cc); border: 1px solid #67c23a; }
.summary-num { font-size: 48px; font-weight: 700; color: #303133; line-height: 1; }
.summary-label { font-size: 16px; font-weight: 600; margin: 8px 0 4px; }
.summary-desc { font-size: 13px; color: #606266; }
.gap-text { font-size: 12px; color: #909399; }

/* 动画 */
.list-enter-active, .list-leave-active { transition: all 0.3s ease; }
.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(-20px); }

/* Tier 卡片边框 */
.tier-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
.tier-card-header h4 { margin: 0; font-size: 15px; flex: 1; margin-right: 8px; }
.tier-card-meta { color: #909399; font-size: 13px; margin: 6px 0 2px; }
.tier-card-salary { color: #f56c6c; font-weight: bold; font-size: 14px; margin: 4px 0; }
.tier-card-skills { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; min-height: 48px; }
.rush-card-border { border-top: 3px solid #e6a23c; }
.stable-card-border { border-top: 3px solid #409eff; }
.safe-card-border { border-top: 3px solid #67c23a; }

/* Tier tabs */
.tier-tabs { margin-bottom: 20px; }
</style>
