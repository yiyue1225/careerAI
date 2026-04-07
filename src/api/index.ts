import axios from 'axios'
import { ElMessage } from 'element-plus'

// 根据环境变量设置 baseURL（开发环境使用代理，生产环境使用实际地址）
// 如果没有 .env 文件，默认使用 '/api'，开发时 Vite 代理会转发
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const service = axios.create({
  baseURL,
  timeout: 15000, // 15秒超时
})

// 请求拦截器：可添加 token 等
service.interceptors.request.use(
  (config) => {
    // 如果有 token，可以在这里添加
    // const token = localStorage.getItem('token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => {
    console.error('请求错误', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：统一处理错误和返回数据
service.interceptors.response.use(
  (response) => {
    // 假设后端统一返回格式为 { code: 0, data: any, message: string }
    const res = response.data
    if (res.code !== undefined && res.code !== 0) {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    // 直接返回 data 字段，方便调用
    return res.data
  },
  (error) => {
    console.error('响应错误', error)
    ElMessage.error(error.message || '网络错误，请稍后重试')
    return Promise.reject(error)
  }
)

// 定义接口函数
export const api = {
  // ========== 岗位相关 ==========
  // 获取岗位列表（支持分页和搜索）
  getPositions: (params?: { page?: number; size?: number; keyword?: string }) =>
    service.get('/positions', { params }),

  // 获取单个岗位详情
  getPositionById: (id: string) => service.get(`/positions/${id}`),

  // ========== 简历上传与解析 ==========
  uploadResume: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return service.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // 获取学生能力画像（如果后端有单独接口）
  getStudentProfile: () => service.get('/profile'),

  // ========== 人岗匹配 ==========
  matchPosition: (studentId: string, positionId: string) =>
    service.post('/match', { studentId, positionId }),

  // ========== 报告相关 ==========
  generateReport: (studentId: string, positionId: string) =>
    service.post('/report', { studentId, positionId }),

  polishReport: (content: string) => service.post('/polish', { content }),

  // ========== AI 对话 ==========
  aiChat: (data: { message: string; context?: any[] }) => service.post('/ai/chat', data),
}

// 默认导出，方便按需导入
export default api