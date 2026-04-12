<template>
  <el-config-provider :locale="zhCn">
    <Layout />
  </el-config-provider>
</template>

<script setup lang="ts">
import Layout from '@/components/Layout.vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden; /* 关键：禁止最外层滚动 */
}
.main-container {
  height: 100vh;      /* 撑满屏幕高度 */
  overflow-y: auto;   /* 允许纵向滚动 */
  overflow-x: hidden; /* 禁止横向滚动 */
  background-color: #f0f2f5;
}
</style>