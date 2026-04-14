<template>
  <div class="ai-assistant">
    <div class="chat-container">
      <div class="chat-header">
        <h2>🤖 AI 智能助手</h2>
        <p>我可以帮你优化简历、筛选合适岗位、规划职业路径等，随时向我提问～</p>
      </div>
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          :class="['message', msg.role === 'user' ? 'user' : 'assistant']"
        >
          <div class="message-avatar">
            <el-icon><User v-if="msg.role === 'user'" /><Service v-else /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatMessage(msg.content)"></div>
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>
        <div v-if="loading" class="message assistant">
          <div class="message-avatar">
            <el-icon><Service /></el-icon>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>
      <div class="chat-input-area">
        <div class="quick-questions">
          <el-button
            v-for="q in quickQuestions"
            :key="q"
            size="small"
            @click="sendQuickQuestion(q)"
            plain
          >
            {{ q }}
          </el-button>
        </div>
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="3"
          placeholder="输入你的问题... (Ctrl+Enter 发送)"
          @keyup.enter.ctrl="sendMessage"
        />
        <div class="send-btn">
          <el-button type="primary" :loading="loading" @click="sendMessage">
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Service } from '@element-plus/icons-vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
}

const messages = ref<Message[]>([])
const inputText = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()
const conversationId = ref('')

// 快速提问示例
const quickQuestions = [
  '如何优化我的简历？',
  '根据我的能力画像推荐几个岗位',
  'Java后端发展路径是什么？',
  '我适合产品经理岗位吗？'
]

// 模拟 AI 回复（根据关键词匹配）
const mockAIResponse = (userMessage: string): string => {
  const lowerMsg = userMessage.toLowerCase()
  if (lowerMsg.includes('简历') || lowerMsg.includes('优化简历')) {
    return '关于简历优化，我建议：\n1. 突出项目经验与量化成果\n2. 使用 STAR 法则描述经历\n3. 根据目标岗位调整技能关键词\n4. 确保排版清晰、无错别字\n是否需要更具体的建议？'
  } else if (lowerMsg.includes('岗位') || lowerMsg.includes('推荐')) {
    return '根据你的能力画像（当前为模拟数据），我推荐以下岗位：\n- Java开发工程师（匹配度85%）\n- 前端开发工程师（匹配度72%）\n- 大数据开发（匹配度68%）\n你可以进入“岗位画像库”查看详情。'
  } else if (lowerMsg.includes('发展路径') || lowerMsg.includes('职业路径')) {
    return 'Java开发常见发展路径：\n初级开发 → 高级开发 → 技术主管 → 架构师/技术总监\n横向可转向大数据、前端或产品经理。'
  } else if (lowerMsg.includes('产品经理')) {
    return '产品经理岗位需要较强的逻辑思维、沟通能力和用户洞察。你可以通过参与项目、学习产品设计课程、考取NPDP证书来提升竞争力。'
  } else {
    return '我可以帮助你优化简历、推荐岗位、规划职业路径等。请告诉我你具体想了解什么？'
  }
}

// 格式化消息（支持简单 Markdown）
const formatMessage = (text: string) => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code style="background:#f4f4f5;padding:2px 6px;border-radius:4px;font-size:13px">$1</code>')
    .replace(/^### (.+)$/gm, '<strong style="font-size:15px">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong style="font-size:16px">$1</strong>')
    .replace(/^- (.+)$/gm, '• $1')
    .replace(/\n/g, '<br>')
}

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 添加一条消息到列表
const addMessage = (role: 'user' | 'assistant', content: string) => {
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  messages.value.push({ role, content, time })
  scrollToBottom()
}

// 发送消息
const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text) return
  if (loading.value) {
    ElMessage.warning('等待回复中，请稍后再发送')
    return
  }

  addMessage('user', text)
  inputText.value = ''
  loading.value = true

  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL ?? ''
    const res = await fetch(`${baseURL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, conversationId: conversationId.value || undefined }),
    })
    const data = await res.json()
    if (data.code === 0) {
      conversationId.value = data.conversationId
      addMessage('assistant', data.answer)
    } else {
      throw new Error(data.message)
    }
  } catch (error) {
    console.error('AI 请求失败', error)
    addMessage('assistant', '抱歉，我现在无法回答，请稍后再试。')
    ElMessage.error('请求失败，请检查网络或稍后重试')
  } finally {
    loading.value = false
  }
}

// 快速提问发送
const sendQuickQuestion = (q: string) => {
  inputText.value = q
  sendMessage()
}

// 页面加载时显示欢迎消息
onMounted(() => {
  if (messages.value.length === 0) {
    addMessage('assistant', '你好！我是你的职业规划智能助手。你可以问我关于简历优化、岗位推荐、职业发展等问题。')
  }
})
</script>

<style scoped>
.ai-assistant {
  padding: 20px;
  background: #f0f2f5;
  height: calc(100vh - 100px);
}
.chat-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.chat-header {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
  background: #fafcff;
}
.chat-header h2 {
  margin: 0 0 8px;
}
.chat-header p {
  margin: 0;
  color: #909399;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.message.user {
  flex-direction: row-reverse;
}
.message.user .message-avatar {
  background: #409eff;
  color: white;
}
.message.assistant .message-avatar {
  background: #f0f2f5;
  color: #409eff;
}
.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.message-content {
  max-width: 70%;
  background: #f8f9fa;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.message.user .message-content {
  background: #ecf5ff;
}
.message-text {
  line-height: 1.5;
  word-break: break-word;
}
.message-time {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 6px;
  text-align: right;
}
.chat-input-area {
  padding: 20px;
  border-top: 1px solid #ebeef5;
  background: white;
}
.quick-questions {
  margin-bottom: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.send-btn {
  margin-top: 12px;
  text-align: right;
}
.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 4px 0;
}
.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #909399;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}
</style>