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
      </el-menu>
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
import { HomeFilled, Briefcase, User, DataLine } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

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