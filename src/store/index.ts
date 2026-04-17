import { defineStore } from 'pinia'

const STORAGE_KEY = 'careerAI_studentProfile'
const RESUME_TEXT_KEY = 'careerAI_resumeText'

export const useUserStore = defineStore('user', {
  state: () => ({
    studentProfile: loadProfileFromStorage(),
    resumeText: localStorage.getItem(RESUME_TEXT_KEY) || null as string | null,
    targetPositionId: null as string | null,
  }),
  actions: {
    setStudentProfile(profile: any) {
      this.studentProfile = profile
      if (profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      } else {
        localStorage.removeItem(STORAGE_KEY)
        this.resumeText = null
        localStorage.removeItem(RESUME_TEXT_KEY)
      }
    },
    setResumeText(text: string | null) {
      this.resumeText = text
      if (text) {
        localStorage.setItem(RESUME_TEXT_KEY, text)
      } else {
        localStorage.removeItem(RESUME_TEXT_KEY)
      }
    },
    setTargetPosition(id: string) {
      this.targetPositionId = id
    },
  },
})

// 从 localStorage 加载 profile
function loadProfileFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch (e) {
    console.error('Failed to load profile from storage:', e)
    return null
  }
}