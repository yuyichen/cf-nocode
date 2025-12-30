<template>
  <div class="admin-layout">
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-left">
        <div class="logo">
          <i class="i-carbon-cloud-service-management text-2xl mr-2"></i>
          <span class="text-xl font-bold">Cloudflare No-Code</span>
        </div>
      </div>
      <div class="header-right">
        <el-dropdown>
          <span class="user-info">
            <el-avatar :size="32" class="mr-2">
              <i class="i-carbon-user-avatar"></i>
            </el-avatar>
            <span class="username">{{ username }}</span>
            <i class="i-carbon-chevron-down ml-1"></i>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>
                <i class="i-carbon-user-profile mr-2"></i>
                个人中心
              </el-dropdown-item>
              <el-dropdown-item>
                <i class="i-carbon-settings mr-2"></i>
                系统设置
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <i class="i-carbon-logout mr-2"></i>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <div class="main-container">
      <!-- 侧边栏 -->
      <el-aside class="sidebar" :width="sidebarWidth">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapse"
          :collapse-transition="false"
          class="sidebar-menu"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <i class="i-carbon-dashboard mr-2"></i>
            <template #title>仪表盘</template>
          </el-menu-item>

          <el-sub-menu index="data">
            <template #title>
              <i class="i-carbon-data-table mr-2"></i>
              <span>数据管理</span>
            </template>
            <el-menu-item index="data-models">
              <i class="i-carbon-model mr-2"></i>
              数据模型
            </el-menu-item>
            <el-menu-item index="data-records">
              <i class="i-carbon-data-base mr-2"></i>
              数据记录
            </el-menu-item>
            <el-menu-item index="data-import">
              <i class="i-carbon-data-refresh mr-2"></i>
              数据导入
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="api">
            <template #title>
              <i class="i-carbon-api mr-2"></i>
              <span>API 管理</span>
            </template>
            <el-menu-item index="api-docs">
              <i class="i-carbon-document mr-2"></i>
              API 文档
            </el-menu-item>
            <el-menu-item index="api-test">
              <i class="i-carbon-test-tool mr-2"></i>
              API 测试
            </el-menu-item>
            <el-menu-item index="api-logs">
              <i class="i-carbon-list mr-2"></i>
              访问日志
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="system">
            <template #title>
              <i class="i-carbon-settings mr-2"></i>
              <span>系统管理</span>
            </template>
            <el-menu-item index="system-users">
              <i class="i-carbon-user mr-2"></i>
              用户管理
            </el-menu-item>
            <el-menu-item index="system-roles">
              <i class="i-carbon-user-certification mr-2"></i>
              角色权限
            </el-menu-item>
            <el-menu-item index="system-logs">
              <i class="i-carbon-event mr-2"></i>
              系统日志
            </el-menu-item>
            <el-menu-item index="system-settings">
              <i class="i-carbon-settings-adjust mr-2"></i>
              系统设置
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item index="ui-designer">
            <i class="i-carbon-pen mr-2"></i>
            <template #title>UI 设计器</template>
          </el-menu-item>

          <el-menu-item index="help">
            <i class="i-carbon-help mr-2"></i>
            <template #title>帮助中心</template>
          </el-menu-item>
        </el-menu>

        <div class="sidebar-collapse" @click="toggleSidebar">
          <i :class="isCollapse ? 'i-carbon-chevron-right' : 'i-carbon-chevron-left'"></i>
        </div>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="main-content">
        <div class="content-header">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumb" :key="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <div class="content-actions">
            <el-button-group>
              <el-button size="small" @click="refreshPage">
                <i class="i-carbon-renew mr-1"></i>
                刷新
              </el-button>
              <el-button size="small" @click="fullscreen">
                <i class="i-carbon-maximize mr-1"></i>
                全屏
              </el-button>
            </el-button-group>
          </div>
        </div>

        <div class="content-body">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 状态管理
const isCollapse = ref(false)
const breadcrumb = ref([])

// 计算属性
const sidebarWidth = computed(() => isCollapse.value ? '64px' : '200px')
const activeMenu = computed(() => route.path.split('/').pop() || 'dashboard')
const userInfo = computed(() => authStore.user)
const username = computed(() => userInfo.value?.username || '用户')

// 方法
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

const handleMenuSelect = (index) => {
  router.push(`/${index}`)
}

const handleLogout = () => {
  authStore.logout()
  ElMessage.success('退出登录成功')
  router.push('/login')
}

const refreshPage = () => {
  window.location.reload()
}

const fullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen()
    }
  }
}

// 初始化面包屑
const updateBreadcrumb = () => {
  const matched = route.matched
  breadcrumb.value = matched.map(item => ({
    path: item.path,
    title: item.meta?.title || item.name || '未命名'
  }))
}

// 监听路由变化
watch(route, updateBreadcrumb, { immediate: true })
</script>

<style scoped>
.admin-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.header-left .logo {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.header-right .user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.header-right .user-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.username {
  font-weight: 500;
}

.main-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  background-color: white;
  border-right: 1px solid #e4e7ed;
  position: relative;
  transition: width 0.3s;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar-menu {
  border-right: none;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

/* .sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
} */

.sidebar-collapse {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  text-align: center;
  padding: 12px;
  cursor: pointer;
  color: #909399;
  border-top: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.sidebar-collapse:hover {
  color: #409eff;
  background-color: #f5f7fa;
}

.main-content {
  padding: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  background-color: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.content-body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #f5f7fa;
}

/* 过渡动画 */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* 滚动条样式 */
.sidebar-menu::-webkit-scrollbar,
.content-body::-webkit-scrollbar {
  width: 6px;
}

.sidebar-menu::-webkit-scrollbar-track,
.content-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar-menu::-webkit-scrollbar-thumb,
.content-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.sidebar-menu::-webkit-scrollbar-thumb:hover,
.content-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
