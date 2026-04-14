import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import PositionLibrary from '@/views/PositionLibrary.vue'
import PositionDetail from '@/views/PositionDetail.vue'
import Profile from '@/views/Profile.vue'
import MatchReport from '@/views/MatchReport.vue'
import AIAssistant from '@/views/AIAssistant.vue'
import Volunteer from '@/views/Volunteer.vue'
import Admin from '@/views/Admin.vue'
import Login from '@/views/Login.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/positions', component: PositionLibrary },
  { path: '/position/:id', component: PositionDetail, props: true },
  { path: '/profile', component: Profile },
  { path: '/match', component: MatchReport },
  { path: '/ai-assistant', component: AIAssistant },
  { path: '/volunteer', component: Volunteer },
  { path: '/admin/login', component: Login, meta: { noLayout: true } },
  { path: '/admin', component: Admin, meta: { requiresAdmin: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 管理员路由守卫
router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAdmin) {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      next('/admin/login')
      return
    }
  }
  next()
})

export default router