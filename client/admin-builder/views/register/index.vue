<template>
  <div class="register-container">
    <div class="register-box">
      <div class="register-header">
        <i class="i-carbon-user-follow text-4xl text-blue-500 mb-4"></i>
        <h1 class="text-2xl font-bold">创建新账号</h1>
        <p class="text-gray-500 mt-2">加入 Cloudflare No-Code 平台</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱地址"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>

        <el-form-item prop="inviteCode">
          <el-input
            v-model="registerForm.inviteCode"
            placeholder="邀请码（可选）"
            size="large"
            :prefix-icon="Key"
          />
        </el-form-item>

        <el-form-item prop="agreement">
          <el-checkbox v-model="registerForm.agreement">
            我已阅读并同意
            <el-link type="primary" :underline="false" @click="showAgreement">《用户协议》</el-link>
            和
            <el-link type="primary" :underline="false" @click="showPrivacy">《隐私政策》</el-link>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="w-full"
            :loading="loading"
            @click="handleRegister"
          >
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>

        <div class="text-center text-gray-500 text-sm mt-6">
          已有账号？
          <el-link type="primary" :underline="false" @click="gotoLogin">立即登录</el-link>
        </div>
      </el-form>

      <div class="register-footer">
        <div class="divider">
          <span class="divider-text">快速注册</span>
        </div>
        <div class="social-register">
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

    <div class="register-background">
      <div class="background-pattern"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Message, Key } from '@element-plus/icons-vue'
import { useAuthStore } from '../../store'

const router = useRouter()
const authStore = useAuthStore()

const registerFormRef = ref()
const loading = ref(false)

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  inviteCode: '',
  agreement: false
})

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
    callback(new Error('密码必须包含大小写字母和数字'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请确认密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const validateAgreement = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请同意用户协议和隐私政策'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  agreement: [
    { required: true, validator: validateAgreement, trigger: 'change' }
  ]
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    loading.value = true
    
    // 使用 auth store 注册
    const result = await authStore.register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password,
      inviteCode: registerForm.inviteCode || undefined
    })
    
    if (result.success) {
      ElMessage.success('注册成功！请登录您的账号')
      router.push('/login')
    } else {
      ElMessage.error(result.error || '注册失败')
    }
  } catch (error) {
    if (error instanceof Error) {
      ElMessage.error(error.message)
    }
  } finally {
    loading.value = false
  }
}

const gotoLogin = () => {
  router.push('/login')
}

const showAgreement = () => {
  ElMessage.info('用户协议功能开发中')
}

const showPrivacy = () => {
  ElMessage.info('隐私政策功能开发中')
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  position: relative;
  overflow: hidden;
}

.register-box {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  z-index: 10;
  position: relative;
}

.register-header {
  text-align: center;
  margin-bottom: 40px;
}

.register-form {
  margin-bottom: 30px;
}

.register-footer {
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

.social-register {
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

.register-background {
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

:deep(.el-checkbox) {
  margin-right: 0;
}
</style>
