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
          <div class="thinking-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- 底部锚点 -->
      <div ref="bottomAnchor" />
    </div>

    <!-- 输入区 -->
    <div class="input-zone">
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
        <span class="attach-hint">发送后 AI 将分析此文件</span>
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
          :class="{ active: (inputText.trim() || attachedFile) && !loading }"
          :disabled="(!inputText.trim() && !attachedFile) || loading"
          @click="sendMessage"
          title="发送 (Enter)"
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

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  time: string
}

let msgIdCounter = 0

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

const quickQuestions = [
  { icon: '📄', text: '帮我分析一下我的简历有哪些不足' },
  { icon: '🎯', text: '根据我的能力画像推荐几个合适的岗位' },
  { icon: '🚀', text: 'Java 后端工程师的职业发展路径是什么？' },
  { icon: '💡', text: '应届生如何准备技术面试？' },
  { icon: '📊', text: '产品经理和数据分析师哪个更适合我？' },
  { icon: '🏆', text: '哪些证书对找互联网工作最有用？' },
]

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

  // 标题 ### ## #
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
  ElMessage.success(`已选择：${file.name}`)
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
  if (loading.value) return

  // 显示用户消息（带文件提示）
  const displayText = file
    ? (text ? `📎 ${file.name}\n\n${text}` : `📎 ${file.name}\n\n请分析这份简历`)
    : text
  addMessage('user', displayText)

  const messageToSend = text || '请帮我分析这份简历，提取技能和能力评估。'
  inputText.value = ''
  attachedFile.value = null
  resetTextareaHeight()
  loading.value = true
  scrollToBottom()

  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''
    let res: Response

    if (file) {
      // 有文件：用 FormData 发送
      const formData = new FormData()
      formData.append('file', file)
      formData.append('message', messageToSend)
      if (conversationId.value) formData.append('conversationId', conversationId.value)

      res = await fetch(`${baseURL}/api/chat`, {
        method: 'POST',
        body: formData,
      })
    } else {
      // 纯文字
      res = await fetch(`${baseURL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageToSend,
          conversationId: conversationId.value || undefined,
        }),
      })
    }

    const data = await res.json()
    if (data.code === 0) {
      conversationId.value = data.conversationId || ''
      addMessage('assistant', data.answer)
    } else {
      throw new Error(data.message || '请求失败')
    }
  } catch (err: any) {
    addMessage('assistant', '抱歉，我现在无法响应，请检查网络连接或稍后重试。')
  } finally {
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
.welcome-sub { font-size: 15px; color: #888; line-height: 1.7; margin: 0 0 36px; }

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
.ai-msg-text :deep(.md-ul), .ai-msg-text :deep(.md-ol) {
  padding-left: 20px; margin: 8px 0;
}
.ai-msg-text :deep(li) { margin: 4px 0; line-height: 1.7; }
.ai-msg-text :deep(.md-hr) { border: none; border-top: 1px solid #e8e8e8; margin: 14px 0; }
.ai-msg-text :deep(strong) { font-weight: 600; color: #111; }

/* ===========================
   输入区
=========================== */
.input-zone {
  flex-shrink: 0;
  padding: 16px 24px 20px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
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
