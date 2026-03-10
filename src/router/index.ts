import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import PositionLibrary from '@/views/PositionLibrary.vue'
import PositionDetail from '@/views/PositionDetail.vue'
import Profile from '@/views/Profile.vue'
import MatchReport from '@/views/MatchReport.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/positions', component: PositionLibrary },
  { path: '/position/:id', component: PositionDetail, props: true },
  { path: '/profile', component: Profile },
  { path: '/match', component: MatchReport },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router