<template>
  <div class="ai-page">
    <!-- 顶部栏 -->
    <div class="top-bar">
      <div class="top-bar-left">
        <div class="ai-logo">
          <span class="logo-icon">✦</span>
        </div>
        <div class="ai-name-wrap">
          <span class="ai-name">职业规划助手</span>
          <span class="ai-model">Dify · Qwen</span>
        </div>
      </div>
      <div class="top-bar-right">
        <button class="icon-btn" title="清空对话" @click="clearChat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          <span>清空</span>
        </button>
      </div>
    </div>

    <!-- 消息区 -->
    <div class="messages-area" ref="messagesContainer">

      <!-- 欢迎屏（无消息时） -->
      <div v-if="messages.length === 0" class="welcome-screen">
        <div class="welcome-logo">
          <span class="welcome-logo-icon">✦</span>
        </div>
        <h1 class="welcome-title">你好，我是你的职业助手</h1>
        <p class="welcome-sub">我可以帮你分析简历、匹配岗位、规划职业路径<br>也可以解答你关于求职的任何问题</p>

        <!-- 已加载的简历提示 -->
        <div v-if="userStore.studentProfile" class="profile-detected">
          <div class="profile-detected-icon">✅</div>
          <div class="profile-detected-text">
            <p class="profile-name">已加载：{{ userStore.studentProfile.name }}</p>
            <p class="profile-hint">我已检测到你的简历信息。你可以直接提问关于职业规划的问题，我会基于你的能力画像提供建议。</p>
          </div>
        </div>

        <p style="font-size:12px;color:#999;margin-top:8px;display:block">💡 提示：上传简历会自动同步到「我的能力画像」</p>
        <div class="suggestion-grid">
          <button
            v-for="q in quickQuestions"
            :key="q.text"
            class="suggestion-card"
            @click="sendQuickQuestion(q.text)"
          >
            <span class="suggestion-icon">{{ q.icon }}</span>
            <span class="suggestion-text">{{ q.text }}</span>
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['msg-row', msg.role]"
      >
        <!-- AI 消息 -->
        <template v-if="msg.role === 'assistant'">
          <div class="ai-avatar-sm">✦</div>
          <div class="ai-msg-body">
            <div class="ai-msg-text" v-html="renderMarkdown(msg.content)"></div>
            <div class="msg-meta">{{ msg.time }}</div>
          </div>
        </template>
        <!-- 用户消息 -->
        <template v-else>
          <div class="user-msg-body">
            <div class="user-bubble">{{ msg.content }}</div>
            <div class="msg-meta user-meta">{{ msg.time }}</div>
          </div>
        </template>
      </div>

      <!-- 思考中 -->
      <div v-if="loading" class="msg-row assistant thinking-row">
        <div class="ai-avatar-sm thinking-avatar">✦</div>
        <div class="ai-msg-body">
          <div class="thinking-status">
            <div class="thinking-dots">
              <span></span><span></span><span></span>
            </div>
            <span class="thinking-label">思考中<span class="thinking-timer">{{ thinkingSeconds }}s</span></span>
          </div>
        </div>
      </div>

      <!-- 底部锚点 -->
      <div ref="bottomAnchor" />
    </div>

    <!-- 输入区 -->
    <div class="input-zone">
      <!-- 全局快捷提问 -->
      <div class="quick-bar">
        <button
          v-for="q in globalQuickQuestions"
          :key="q.id"
          class="quick-chip"
          @click="handleQuickQuestion(q)"
        >
          <span class="quick-chip-icon">{{ q.icon }}</span>
          <span>{{ q.label }}</span>
        </button>
      </div>

      <!-- 填空弹窗 -->
      <el-dialog
        v-model="fillDialogVisible"
        :title="fillDialogQuestion?.label"
        width="420px"
        :close-on-click-modal="true"
        append-to-body
      >
        <p class="fill-tip">{{ fillDialogQuestion?.tip }}</p>
        <el-input
          v-model="fillDialogInput"
          :placeholder="fillDialogQuestion?.placeholder"
          size="large"
          autofocus
          @keyup.enter="submitFillDialog"
        />
        <template #footer>
          <el-button @click="fillDialogVisible = false">取消</el-button>
          <el-button type="primary" :disabled="!fillDialogInput.trim()" @click="submitFillDialog">发送</el-button>
        </template>
      </el-dialog>

      <!-- 附件预览 -->
      <div v-if="attachedFile" class="attachment-preview">
        <div class="attach-chip">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>{{ attachedFile.name }}</span>
          <span class="attach-size">{{ formatFileSize(attachedFile.size) }}</span>
          <button class="attach-remove" @click="attachedFile = null" title="移除附件">×</button>
        </div>
        <span class="attach-hint">✓ 发送后将自动解析并保存到「我的能力画像」</span>
      </div>

      <div class="input-wrapper" :class="{ focused: inputFocused }">
        <!-- 附件按钮 -->
        <button class="attach-btn" @click="triggerFileInput" title="上传简历（PDF / Word）">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
          </svg>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,.doc,.docx"
          style="display:none"
          @change="onFileSelect"
        />

        <textarea
          ref="textareaRef"
          v-model="inputText"
          :placeholder="attachedFile ? '描述你想了解的内容，或直接发送让 AI 分析简历…' : '发送消息… (Enter 发送，Shift+Enter 换行)'"
          rows="1"
          @focus="inputFocused = true"
          @blur="inputFocused = false"
          @keydown="handleKeydown"
          @input="autoResize"
        />
        <button
          class="send-button"
          :class="{ active: (inputText.trim() || attachedFile) && !loading && !isAnalyzingResume }"
          :disabled="(!inputText.trim() && !attachedFile) || loading || isAnalyzingResume"
          @click="sendMessage"
          :title="isAnalyzingResume ? '简历解析中...' : '发送 (Enter)'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
      <div class="input-hint">Enter 发送 · Shift+Enter 换行 · 📎 可上传简历让 AI 分析</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  time: string
}

let msgIdCounter = 0

const userStore = useUserStore()
const messages = ref<Message[]>([])
const inputText = ref('')
const loading = ref(false)
const inputFocused = ref(false)
const messagesContainer = ref<HTMLElement>()
const bottomAnchor = ref<HTMLElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const fileInputRef = ref<HTMLInputElement>()
const attachedFile = ref<File | null>(null)
const conversationId = ref('')
const isAnalyzingResume = ref(false)  // 标记简历解析中
const thinkingSeconds = ref(0)
let thinkingTimer: ReturnType<typeof setInterval> | null = null

const quickQuestions = [
  { icon: '📄', text: '帮我分析一下我的简历有哪些不足' },
  { icon: '🎯', text: '根据我的能力画像推荐几个合适的岗位' },
  { icon: '🚀', text: 'Java 后端工程师的职业发展路径是什么？' },
  { icon: '💡', text: '应届生如何准备技术面试？' },
  { icon: '📊', text: '产品经理和数据分析师哪个更适合我？' },
  { icon: '🏆', text: '哪些证书对找互联网工作最有用？' },
]

// 全局快捷提问（任意轮次均可见）
interface QuickQuestion {
  id: string
  icon: string
  label: string
  // type: 'direct' 直接发送；'fill' 需要填空
  type: 'direct' | 'fill'
  text?: string                // type=direct 时使用
  template?: string            // type=fill 时使用，{input} 为填空位
  tip?: string
  placeholder?: string
}

const globalQuickQuestions: QuickQuestion[] = [
  {
    id: 'recommend',
    icon: '🎯',
    label: '推荐岗位',
    type: 'direct',
    text: '根据我的能力画像推荐几个合适的岗位，并说明推荐理由',
  },
  {
    id: 'career-path',
    icon: '🚀',
    label: '职业路径',
    type: 'fill',
    template: '{input} 的职业发展路径是什么？有哪些晋升方向和转型方向？',
    tip: '输入你想了解的职位名称',
    placeholder: '例如：Java 后端工程师、产品经理…',
  },
  {
    id: 'skill-gap',
    icon: '📊',
    label: '技能差距',
    type: 'fill',
    template: '我想应聘 {input}，根据我的能力画像，我还有哪些技能差距？应该如何弥补？',
    tip: '输入目标岗位名称',
    placeholder: '例如：算法工程师、数据分析师…',
  },
  {
    id: 'resume',
    icon: '📄',
    label: '简历分析',
    type: 'direct',
    text: '请详细分析我的简历，指出优势、不足，并给出改进建议',
  },
  {
    id: 'compare',
    icon: '⚖️',
    label: '岗位对比',
    type: 'fill',
    template: '请对比 {input} 这两个方向，哪个更适合我？分析优劣势',
    tip: '输入两个想对比的方向，用"和"或"vs"分隔',
    placeholder: '例如：前端开发 和 产品经理',
  },
  {
    id: 'interview',
    icon: '💡',
    label: '面试准备',
    type: 'fill',
    template: '我要面试 {input} 岗位，请帮我梳理常见面试题和准备重点',
    tip: '输入目标岗位',
    placeholder: '例如：后端开发、运营经理…',
  },
]

const fillDialogVisible = ref(false)
const fillDialogQuestion = ref<QuickQuestion | null>(null)
const fillDialogInput = ref('')

const handleQuickQuestion = (q: QuickQuestion) => {
  if (q.type === 'direct') {
    inputText.value = q.text!
    sendMessage()
  } else {
    fillDialogQuestion.value = q
    fillDialogInput.value = ''
    fillDialogVisible.value = true
  }
}

const submitFillDialog = () => {
  if (!fillDialogInput.value.trim() || !fillDialogQuestion.value) return
  const text = fillDialogQuestion.value.template!.replace('{input}', fillDialogInput.value.trim())
  fillDialogVisible.value = false
  inputText.value = text
  sendMessage()
}

// ==========================================
// Markdown 渲染
// ==========================================
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  let html = text

  // 代码块（```lang\n...\n```）
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    return `<div class="code-block"><div class="code-lang">${lang || 'code'}</div><pre><code>${escaped}</code></pre></div>`
  })

  // 行内代码
  html = html.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>')

  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 斜体
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // 标题 ##### #### ### ## #
  html = html.replace(/^##### (.+)$/gm, '<h6 class="md-h6">$1</h6>')
  html = html.replace(/^#### (.+)$/gm, '<h5 class="md-h5">$1</h5>')
  html = html.replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')

  // 有序列表（整块处理）
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line =>
      `<li>${line.replace(/^\d+\. /, '')}</li>`
    ).join('')
    return `<ol class="md-ol">${items}</ol>`
  })

  // 无序列表
  html = html.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(line =>
      `<li>${line.replace(/^[-*] /, '')}</li>`
    ).join('')
    return `<ul class="md-ul">${items}</ul>`
  })

  // Markdown 表格（| col | col | 格式）
  html = html.replace(/((?:^\|.+\|\n?)+)/gm, (block) => {
    const rows = block.trim().split('\n').filter(r => r.trim())
    if (rows.length < 2) return block
    const isSep = (r: string) => /^\|[\s|:-]+\|$/.test(r.trim())
    // 找分隔行索引
    const sepIdx = rows.findIndex(isSep)
    if (sepIdx === -1) return block
    const headerRow = rows[0]
    const dataRows = rows.slice(sepIdx + 1)
    const parseCells = (row: string) =>
      row.replace(/^\||\|$/g, '').split('|').map(c => c.trim())
    const headers = parseCells(headerRow).map(c => `<th>${c}</th>`).join('')
    const bodyHtml = dataRows.map(row =>
      `<tr>${parseCells(row).map(c => `<td>${c}</td>`).join('')}</tr>`
    ).join('')
    return `<table class="md-table"><thead><tr>${headers}</tr></thead><tbody>${bodyHtml}</tbody></table>`
  })

  // 分割线
  html = html.replace(/^---$/gm, '<hr class="md-hr">')

  // 换行（非 HTML 标签内）
  html = html.replace(/\n(?!<)/g, '<br>')

  return html
}

// ==========================================
// 消息发送
// ==========================================
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    bottomAnchor.value?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  })
}

const isNearBottom = () => {
  const el = messagesContainer.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

const addMessage = (role: 'user' | 'assistant', content: string) => {
  const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  messages.value.push({ id: ++msgIdCounter, role, content, time })
  scrollToBottom()
}

const triggerFileInput = () => fileInputRef.value?.click()

const onFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['pdf', 'doc', 'docx'].includes(ext || '')) {
    ElMessage.error('仅支持 PDF 或 Word 格式')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件不能超过 10MB')
    return
  }
  attachedFile.value = file
  ElMessage.success(`已选择：${file.name}\n点击发送按钮即可自动解析`)
  // 重置 input，允许重复选同一文件
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1024 / 1024).toFixed(1) + 'MB'
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  const file = attachedFile.value
  if (!text && !file) return
  if (loading.value || isAnalyzingResume.value) return

  const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''

  // 如果有文件，先进行简历解析
  if (file) {
    isAnalyzingResume.value = true
    addMessage('user', `📎 ${file.name}\n\n(正在解析简历，请稍候...)`)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const analyzeRes = await fetch(`${baseURL}/api/analyze`, {
        method: 'POST',
        body: formData,
      })

      const analyzeData = await analyzeRes.json()
      if (analyzeData.code === 0) {
        // 保存解析结果到Pinia store
        userStore.setStudentProfile({
          dimensions: analyzeData.data.dimensions,
          skills: analyzeData.data.skills,
          source: analyzeData.data.source || 'ai',
        })
        if (analyzeData.resumeText) {
          userStore.setResumeText(analyzeData.resumeText)
        }

        ElMessage.success('✓ 简历解析完成，已保存到「我的能力画像」')

        // 更新消息
        const sourceTag = analyzeData.data.source === 'fallback' ? '（本地分析）' : '（AI分析）'
        addMessage('assistant', `已完成简历解析 ${sourceTag}，你现在可以询问我任何职业相关的问题。例如：\n- 分析我的优势和不足\n- 推荐适合我的岗位\n- 制定职业发展计划`)
      } else {
        throw new Error(analyzeData.message || '解析失败')
      }
    } catch (err: any) {
      addMessage('assistant', `简历解析失败：${err.message || '请稍后重试'}`)
    } finally {
      isAnalyzingResume.value = false
      inputText.value = ''
      attachedFile.value = null
      resetTextareaHeight()
    }
    return
  }

  // 显示用户消息（纯文字）
  addMessage('user', text)
  inputText.value = ''
  resetTextareaHeight()
  loading.value = true
  thinkingSeconds.value = 0
  thinkingTimer = setInterval(() => { thinkingSeconds.value++ }, 1000)

  // 先占位一条空的 AI 消息，后续逐字填充
  const aiMsg: Message = {
    id: ++msgIdCounter,
    role: 'assistant',
    content: '',
    time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  }

  try {
    const profile = userStore.studentProfile
    let inputs: any = {}

    let finalMessage = text
    if (!conversationId.value) {
      // 仅在第一轮对话时注入简历信息和约束
      finalMessage += "\n(请直接给出你的职业建议或回答，不要输出任何关于'调用本地知识库'、'使用工具'、'引用'等元数据信息或调试信息。)"

      if (userStore.resumeText) {
        inputs.user_resume = userStore.resumeText.substring(0, 3000)
      } else if (profile) {
        inputs.user_resume = `姓名: ${profile.name || '未知'}, 专业: ${profile.major || '未知'}, 年级: ${profile.grade || '未知'}。
  技能: ${profile.skills?.professionalSkills?.join(', ') || '未提取'}。
  能力维度: 专业${profile.dimensions?.professional}, 证书${profile.dimensions?.certificate}, 创新${profile.dimensions?.innovation}, 学习${profile.dimensions?.learning}, 抗压${profile.dimensions?.stress}, 沟通${profile.dimensions?.communication}, 实习${profile.dimensions?.internship}。`
      }
    } else {
      // 后续对话不再重复发送 inputs，避免 Dify Agent 内部校验失败
      inputs = {}
    }

    const res = await fetch(`${baseURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: finalMessage,
        conversationId: conversationId.value || undefined,
        inputs,
        userId: (() => {
          let id = localStorage.getItem('careerAI_anonymous_id')
          if (!id) {
            id = 'user_' + Math.random().toString(36).substring(2, 11)
            localStorage.setItem('careerAI_anonymous_id', id)
          }
          return id
        })(),
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      if (res.status === 404) {
        conversationId.value = '' // 会话失效，清空 ID
      }
      throw new Error(errorData.message || `请求失败 (${res.status})`)
    }
    if (!res.body) throw new Error('响应正文为空')

    // 停止计时，切换到打字状态
    if (thinkingTimer) { clearInterval(thinkingTimer); thinkingTimer = null }
    loading.value = false
    messages.value.push(aiMsg)
    const msgIndex = messages.value.length - 1
    scrollToBottom()

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        try {
          const parsed = JSON.parse(line.slice(6))
          if (parsed.type === 'chunk' && parsed.answer) {
            messages.value[msgIndex].content += parsed.answer
            if (isNearBottom()) scrollToBottom(false)
          }
          if (parsed.type === 'done' && parsed.conversationId) {
            conversationId.value = parsed.conversationId
          }
          if (parsed.type === 'error') {
            if (!messages.value[msgIndex].content) messages.value[msgIndex].content = '抱歉，AI 响应异常，请重试。'
          }
        } catch {}
      }
    }

    if (!messages.value[msgIndex].content) messages.value[msgIndex].content = '抱歉，我没有生成回复，请重试。'

  } catch (err: any) {
    if (thinkingTimer) { clearInterval(thinkingTimer); thinkingTimer = null }
    loading.value = false
    addMessage('assistant', `抱歉，响应出错了：${err.message || '请检查网络连接或稍后重试'}`)
  } finally {
    if (thinkingTimer) { clearInterval(thinkingTimer); thinkingTimer = null }
    loading.value = false
  }
}

const sendQuickQuestion = (q: string) => {
  inputText.value = q
  sendMessage()
}

const clearChat = () => {
  messages.value = []
  conversationId.value = ''
  inputText.value = ''
}

// ==========================================
// 输入框自适应高度
// ==========================================
const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

const resetTextareaHeight = () => {
  if (textareaRef.value) textareaRef.value.style.height = 'auto'
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  // 不自动添加欢迎语，让欢迎屏展示
})
</script>

<style scoped>
/* ===========================
   整体布局
=========================== */
.ai-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ===========================
   顶部栏
=========================== */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  z-index: 10;
  flex-shrink: 0;
}
.top-bar-left { display: flex; align-items: center; gap: 10px; }
.ai-logo {
  width: 34px; height: 34px; border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
}
.logo-icon { color: #fff; font-size: 16px; }
.ai-name-wrap { display: flex; flex-direction: column; }
.ai-name { font-size: 15px; font-weight: 600; color: #111; line-height: 1.2; }
.ai-model { font-size: 11px; color: #999; }
.icon-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; border: 1px solid #e5e5e5; border-radius: 8px;
  background: #fff; cursor: pointer; font-size: 13px; color: #666;
  transition: all 0.15s;
}
.icon-btn:hover { background: #f5f5f5; color: #333; }

/* ===========================
   消息区
=========================== */
.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 0 0 20px;
  scroll-behavior: smooth;
}
.messages-area::-webkit-scrollbar { width: 4px; }
.messages-area::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 2px; }

/* 欢迎屏 */
.welcome-screen {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 40px 40px;
  text-align: center;
}
.welcome-logo {
  width: 60px; height: 60px; border-radius: 20px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(99,102,241,0.3);
}
.welcome-logo-icon { color: #fff; font-size: 28px; }
.welcome-title { font-size: 28px; font-weight: 700; color: #111; margin: 0 0 12px; }
.welcome-sub { font-size: 15px; color: #888; line-height: 1.7; margin: 0 0 24px; }

.profile-detected {
  background: linear-gradient(135deg, #ecf5ff 0%, #f0f9ff 100%);
  border: 1px solid #b3d8ff;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 0 0 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.profile-detected-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.profile-detected-text {
  text-align: left;
}

.profile-name {
  margin: 0 0 4px;
  font-weight: 600;
  color: #409eff;
  font-size: 14px;
}

.profile-hint {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 680px;
  width: 100%;
}
.suggestion-card {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px 16px; border: 1px solid #e8e8e8; border-radius: 12px;
  background: #fafafa; cursor: pointer; text-align: left;
  transition: all 0.15s; font-size: 13px; color: #444;
  line-height: 1.4;
}
.suggestion-card:hover { border-color: #6366f1; background: #f5f4ff; color: #6366f1; }
.suggestion-icon { font-size: 18px; flex-shrink: 0; }

/* 消息行 */
.msg-row {
  display: flex;
  padding: 16px 24px;
  gap: 14px;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
}
.msg-row.user { flex-direction: row-reverse; }

/* AI 头像 */
.ai-avatar-sm {
  width: 32px; height: 32px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-top: 2px;
}
.thinking-avatar { animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

/* AI 消息体 */
.ai-msg-body { flex: 1; min-width: 0; }
.ai-msg-text {
  font-size: 15px; line-height: 1.75; color: #1a1a1a;
  word-break: break-word;
}

/* 用户消息 */
.user-msg-body { max-width: 72%; display: flex; flex-direction: column; align-items: flex-end; }
.user-bubble {
  background: #6366f1; color: #fff;
  padding: 10px 16px; border-radius: 18px 4px 18px 18px;
  font-size: 15px; line-height: 1.6; word-break: break-word;
}

/* 时间戳 */
.msg-meta { font-size: 11px; color: #bbb; margin-top: 5px; }
.user-meta { text-align: right; }

/* 思考动画 */
.thinking-status {
  display: flex; align-items: center; gap: 10px;
}
.thinking-label {
  font-size: 14px; color: #888;
  display: flex; align-items: center; gap: 4px;
}
.thinking-timer {
  font-size: 13px; color: #6366f1; font-weight: 600;
  min-width: 28px;
}
.thinking-dots {
  display: flex; gap: 5px; align-items: center; padding: 8px 4px;
}
.thinking-dots span {
  width: 7px; height: 7px; border-radius: 50%;
  background: #aaa; animation: bounce 1.4s infinite;
}
.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-7px); opacity: 1; }
}

/* ===========================
   Markdown 样式
=========================== */
.ai-msg-text :deep(.code-block) {
  margin: 10px 0; border-radius: 10px; overflow: hidden;
  border: 1px solid #e0e0e0;
}
.ai-msg-text :deep(.code-lang) {
  padding: 6px 14px; background: #1e1e2e; color: #888;
  font-size: 12px; font-family: monospace;
}
.ai-msg-text :deep(pre) {
  margin: 0; padding: 14px 16px; background: #282c34;
  overflow-x: auto;
}
.ai-msg-text :deep(code) {
  font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
  font-size: 13px; color: #abb2bf; line-height: 1.6;
}
.ai-msg-text :deep(.inline-code) {
  background: #f3f3f3; color: #d14; padding: 1px 6px;
  border-radius: 4px; font-size: 13px; font-family: monospace;
}
.ai-msg-text :deep(.md-h2) { font-size: 18px; font-weight: 700; margin: 14px 0 6px; color: #111; }
.ai-msg-text :deep(.md-h3) { font-size: 16px; font-weight: 600; margin: 12px 0 4px; color: #222; }
.ai-msg-text :deep(.md-h4) { font-size: 15px; font-weight: 600; margin: 10px 0 4px; color: #333; }
.ai-msg-text :deep(.md-h5) { font-size: 14px; font-weight: 600; margin: 8px 0 4px; color: #444; }
.ai-msg-text :deep(.md-h6) { font-size: 13px; font-weight: 600; margin: 6px 0 4px; color: #555; }
.ai-msg-text :deep(.md-ul), .ai-msg-text :deep(.md-ol) {
  padding-left: 20px; margin: 8px 0;
}
.ai-msg-text :deep(li) { margin: 4px 0; line-height: 1.7; }
.ai-msg-text :deep(.md-hr) { border: none; border-top: 1px solid #e8e8e8; margin: 14px 0; }
.ai-msg-text :deep(strong) { font-weight: 600; color: #111; }
.ai-msg-text :deep(.md-table) {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 13px;
}
.ai-msg-text :deep(.md-table th),
.ai-msg-text :deep(.md-table td) {
  border: 1px solid #dcdfe6;
  padding: 6px 12px;
  text-align: left;
  line-height: 1.6;
}
.ai-msg-text :deep(.md-table thead tr) {
  background-color: #f5f7fa;
  font-weight: 600;
  color: #303133;
}
.ai-msg-text :deep(.md-table tbody tr:nth-child(even)) {
  background-color: #fafafa;
}

/* ===========================
   输入区
=========================== */
.input-zone {
  flex-shrink: 0;
  padding: 10px 24px 20px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

/* 全局快捷提问 */
.quick-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  max-width: 860px;
  margin: 0 auto 10px;
}
.quick-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fafafa;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.quick-chip:hover {
  border-color: #6366f1;
  background: #f5f4ff;
  color: #6366f1;
}
.quick-chip-icon { font-size: 14px; }

.fill-tip {
  font-size: 13px;
  color: #909399;
  margin: 0 0 12px;
}
.input-wrapper {
  display: flex; align-items: flex-end; gap: 10px;
  border: 1.5px solid #e0e0e0; border-radius: 14px;
  padding: 10px 12px; background: #fff;
  transition: border-color 0.2s, box-shadow 0.2s;
  max-width: 860px; margin: 0 auto;
}
.input-wrapper.focused {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}
.input-wrapper textarea {
  flex: 1; border: none; outline: none; resize: none;
  font-size: 15px; line-height: 1.6; color: #1a1a1a;
  background: transparent; max-height: 200px;
  font-family: inherit;
}
.input-wrapper textarea::placeholder { color: #bbb; }
.send-button {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: #e8e8e8; color: #aaa; cursor: not-allowed;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s;
}
.send-button.active {
  background: #6366f1; color: #fff; cursor: pointer;
}
.send-button.active:hover { background: #5558e3; transform: scale(1.05); }
.input-hint { font-size: 12px; color: #ccc; text-align: center; margin-top: 8px; max-width: 860px; margin: 8px auto 0; }

/* 附件 */
.attachment-preview {
  display: flex; align-items: center; gap: 10px;
  max-width: 860px; margin: 0 auto 8px;
}
.attach-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border: 1px solid #d0d5e8; border-radius: 20px;
  background: #f5f4ff; font-size: 13px; color: #444;
}
.attach-size { color: #999; font-size: 11px; }
.attach-remove {
  width: 18px; height: 18px; border: none; border-radius: 50%;
  background: #ddd; color: #666; cursor: pointer; font-size: 14px; line-height: 1;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.attach-remove:hover { background: #f56c6c; color: #fff; }
.attach-hint { font-size: 12px; color: #909399; }

.attach-btn {
  background: none; border: none; cursor: pointer;
  color: #bbb; padding: 4px; border-radius: 6px;
  display: flex; align-items: center; transition: color 0.15s;
  flex-shrink: 0;
}
.attach-btn:hover { color: #6366f1; }
</style>
