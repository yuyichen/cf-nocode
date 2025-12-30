<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <i class="i-carbon-cloud-service-management text-4xl text-blue-500 mb-4"></i>
        <h1 class="text-2xl font-bold">Cloudflare No-Code</h1>
        <p class="text-gray-500 mt-2">管理后台登录</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <div class="flex justify-between items-center w-full">
            <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
            <el-link type="primary" :underline="false">忘记密码？</el-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="w-full"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <div class="text-center text-gray-500 text-sm mt-6">
          还没有账号？
          <el-link type="primary" :underline="false" @click="gotoRegister">立即注册</el-link>
        </div>
      </el-form>

      <div class="login-footer">
        <div class="divider">
          <span class="divider-text">其他登录方式</span>
        </div>
        <div class="social-login">
          <el-button circle class="social-btn">
            <i class="i-carbon-logo-github text-xl"></i>
          </el-button>
          <el-button circle class="social-btn">
            <i class="i-carbon-logo-google text-xl"></i>
          </el-button>
          <el-button circle class="social-btn">
            <i class="i-carbon-logo-twitter text-xl"></i>
          </el-button>
        </div>
      </div>
    </div>

    <div class="login-background">
      <div class="background-pattern"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../../store'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: '',
  remember: false
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码长度在 6 到 30 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    // 使用 auth store 登录
    const result = await authStore.login(loginForm.username, loginForm.password)
    
    if (result.success) {
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(result.error || '登录失败')
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
    }
  } finally {
    loading.value = false
  }
}

const gotoRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.login-box {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 10;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-form {
  margin-bottom: 30px;
}

.login-footer {
  margin-top: 30px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 20px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e4e7ed;
}

.divider-text {
  position: relative;
  background: white;
  padding: 0 15px;
  color: #909399;
  font-size: 14px;
}

.social-login {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 20px;
}

.social-btn {
  width: 44px;
  height: 44px;
  border: 1px solid #e4e7ed;
  background: white;
  transition: all 0.3s;
}

.social-btn:hover {
  border-color: #409eff;
  background: #f5f7fa;
  transform: translateY(-2px);
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.background-pattern {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: float 20s infinite linear;
}

@keyframes float {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
}
</style>
