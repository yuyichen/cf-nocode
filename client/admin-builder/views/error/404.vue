<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-icon">
        <i class="i-carbon-error text-8xl text-red-500"></i>
      </div>
      <h1 class="error-title">404</h1>
      <p class="error-description">抱歉，您访问的页面不存在</p>
      <p class="error-detail">可能的原因：页面已被删除、地址输入错误或您没有访问权限</p>
      
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <i class="i-carbon-home mr-2"></i>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <i class="i-carbon-arrow-left mr-2"></i>
          返回上一页
        </el-button>
        <el-button size="large" @click="reload">
          <i class="i-carbon-renew mr-2"></i>
          刷新页面
        </el-button>
      </div>

      <div class="error-help">
        <p class="help-title">需要帮助？</p>
        <div class="help-links">
          <el-link type="primary" :underline="false" @click="contactSupport">
            <i class="i-carbon-chat mr-1"></i>
            联系技术支持
          </el-link>
          <el-link type="primary" :underline="false" @click="viewDocumentation">
            <i class="i-carbon-document mr-1"></i>
            查看文档
          </el-link>
          <el-link type="primary" :underline="false" @click="reportIssue">
            <i class="i-carbon-report mr-1"></i>
            报告问题
          </el-link>
        </div>
      </div>
    </div>

    <div class="error-background">
      <div class="background-grid"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.go(-1)
}

const reload = () => {
  window.location.reload()
}

const contactSupport = () => {
  ElMessage.info('技术支持功能开发中')
}

const viewDocumentation = () => {
  window.open('https://github.com/pure-admin/vue-pure-admin', '_blank')
}

const reportIssue = () => {
  ElMessage.info('问题报告功能开发中')
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
}

.error-content {
  text-align: center;
  max-width: 600px;
  padding: 60px 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  z-index: 10;
  position: relative;
}

.error-icon {
  margin-bottom: 24px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.error-title {
  font-size: 120px;
  font-weight: 800;
  color: #2c3e50;
  margin: 0;
  line-height: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.error-description {
  font-size: 24px;
  font-weight: 600;
  color: #34495e;
  margin: 20px 0 10px;
}

.error-detail {
  color: #7f8c8d;
  font-size: 16px;
  margin-bottom: 40px;
  line-height: 1.6;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.error-help {
  border-top: 1px solid #e4e7ed;
  padding-top: 30px;
}

.help-title {
  color: #7f8c8d;
  font-size: 14px;
  margin-bottom: 16px;
}

.help-links {
  display: flex;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.error-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.background-grid {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background-image: 
    linear-gradient(rgba(102, 126, 234, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
  animation: grid-move 20s linear infinite;
}

@keyframes grid-move {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(40px, 40px);
  }
}

:deep(.el-button) {
  border-radius: 8px;
  font-weight: 500;
  padding: 12px 24px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
