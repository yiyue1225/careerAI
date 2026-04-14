<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="aside">
      <div class="logo">AI职业规划</div>
      <el-menu router :default-active="$route.path">
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/positions">
          <el-icon><Briefcase /></el-icon>
          <span>岗位画像库</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>我的能力</span>
        </el-menu-item>
        <el-menu-item index="/match">
          <el-icon><DataLine /></el-icon>
          <span>职业匹配</span>
        </el-menu-item>
        <el-menu-item index="/volunteer">
          <el-icon><List /></el-icon>
          <span>求职投递</span>
        </el-menu-item>
        <el-menu-item index="/ai-assistant">
          <el-icon><ChatDotRound /></el-icon>
          <span>AI 智能助手</span>
        </el-menu-item>
      </el-menu>

      <!-- 底部：管理员入口 -->
      <div class="admin-entry">
        <template v-if="isAdmin">
          <el-divider style="border-color:#3d5166;margin:0" />
          <div class="admin-user">
            <el-icon><Setting /></el-icon>
            <span>管理员</span>
            <el-button link size="small" class="logout-btn" @click="logout">退出</el-button>
          </div>
          <el-menu router :default-active="$route.path" style="background:transparent;border:none">
            <el-menu-item index="/admin" style="color:#bfcbd9">
              <el-icon><Monitor /></el-icon>
              <span>管理后台</span>
            </el-menu-item>
          </el-menu>
        </template>
        <template v-else>
          <el-divider style="border-color:#3d5166;margin:0" />
          <div class="admin-login-link" @click="$router.push('/admin/login')">
            <el-icon><Setting /></el-icon>
            <span>管理员登录</span>
          </div>
        </template>
      </div>
    </el-aside>
    <el-container>
      <el-header class="header">基于AI的大学生职业规划智能体</el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { HomeFilled, Briefcase, User, DataLine, ChatDotRound, List, Setting, Monitor } from '@element-plus/icons-vue'

const router = useRouter()
const isAdmin = computed(() => !!localStorage.getItem('adminToken'))

const logout = () => {
  localStorage.removeItem('adminToken')
  router.push('/')
}
</script>

<style scoped>
.layout-container { height: 100vh; }
.aside {
  background-color: #304156;
  color: white;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
  flex-shrink: 0;
}
.el-menu {
  background-color: transparent;
  border-right: none;
}
.el-menu-item { color: #bfcbd9; }
.el-menu-item.is-active { color: #409eff; background-color: #263445; }

.admin-entry { margin-top: auto; }
.admin-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  color: #bfcbd9;
  font-size: 13px;
}
.logout-btn { color: #f56c6c !important; margin-left: auto; font-size: 12px; }
.admin-login-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  color: #5a7a9a;
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}
.admin-login-link:hover { color: #bfcbd9; }

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e9f0;
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}
.main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>

<style scoped>
.layout-container {
  height: 100vh;
}
.aside {
  background-color: #304156;
  color: white;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}
.el-menu {
  background-color: transparent;
  border-right: none;
}
.el-menu-item {
  color: #bfcbd9;
}
.el-menu-item.is-active {
  color: #409eff;
  background-color: #263445;
}
.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e9f0;
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}
.main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>