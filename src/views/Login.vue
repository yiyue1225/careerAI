<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-logo">
        <span class="logo-icon">🎓</span>
        <h1>AI职业规划</h1>
        <p>管理员登录</p>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" size="large">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="管理员账号" :prefix-icon="User" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" :prefix-icon="Lock" show-password @keyup.enter="handleLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" style="width:100%" :loading="loading" @click="handleLogin" round>
            登录管理后台
          </el-button>
        </el-form-item>
      </el-form>
      <div class="back-link">
        <el-button link @click="$router.push('/')">← 返回学生端</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const form = ref({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    loading.value = true
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form.value),
      })
      const data = await res.json()
      if (data.code === 0) {
        localStorage.setItem('adminToken', data.token)
        ElMessage.success('登录成功')
        router.push('/admin')
      } else {
        ElMessage.error(data.message || '用户名或密码错误')
      }
    } catch {
      ElMessage.error('网络错误，请稍后重试')
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1f2d3d 0%, #304156 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-box {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px 36px;
  width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.login-logo {
  text-align: center;
  margin-bottom: 36px;
}
.logo-icon { font-size: 48px; }
.login-logo h1 { font-size: 24px; font-weight: 700; color: #303133; margin: 8px 0 4px; }
.login-logo p { color: #909399; font-size: 14px; }
.back-link { text-align: center; margin-top: 12px; }
</style>
