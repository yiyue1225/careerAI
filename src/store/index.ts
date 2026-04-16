import { defineStore } from 'pinia'

const STORAGE_KEY = 'careerAI_studentProfile'

export const useUserStore = defineStore('user', {
  state: () => ({
    studentProfile: loadProfileFromStorage(),
    targetPositionId: null as string | null,
  }),
  actions: {
    setStudentProfile(profile: any) {
      this.studentProfile = profile
      // 持久化到 localStorage
      if (profile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      } else {
        localStorage.removeItem(STORAGE_KEY)
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