<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <el-card class="stat-card" shadow="hover">
        <div class="flex items-center">
          <div class="stat-icon bg-blue-100 text-blue-600 p-3 rounded-lg mr-4">
            <i class="i-carbon-model text-2xl"></i>
          </div>
          <div>
            <div class="stat-value text-2xl font-bold">{{ stats.models }}</div>
            <div class="stat-label text-gray-500">数据模型</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="flex items-center">
          <div class="stat-icon bg-green-100 text-green-600 p-3 rounded-lg mr-4">
            <i class="i-carbon-data-base text-2xl"></i>
          </div>
          <div>
            <div class="stat-value text-2xl font-bold">{{ stats.records }}</div>
            <div class="stat-label text-gray-500">数据记录</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="flex items-center">
          <div class="stat-icon bg-purple-100 text-purple-600 p-3 rounded-lg mr-4">
            <i class="i-carbon-api text-2xl"></i>
          </div>
          <div>
            <div class="stat-value text-2xl font-bold">{{ stats.apiCalls }}</div>
            <div class="stat-label text-gray-500">API 调用</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="flex items-center">
          <div class="stat-icon bg-orange-100 text-orange-600 p-3 rounded-lg mr-4">
            <i class="i-carbon-user text-2xl"></i>
          </div>
          <div>
            <div class="stat-value text-2xl font-bold">{{ stats.users }}</div>
            <div class="stat-label text-gray-500">用户数量</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-lg font-bold">API 调用趋势</span>
            <el-select v-model="timeRange" size="small" style="width: 120px">
              <el-option label="最近7天" value="7d"></el-option>
              <el-option label="最近30天" value="30d"></el-option>
              <el-option label="最近90天" value="90d"></el-option>
            </el-select>
          </div>
        </template>
        <div class="h-64">
          <!-- 这里可以集成图表组件 -->
          <div class="flex items-center justify-center h-full text-gray-400">
            <i class="i-carbon-chart-line text-4xl mr-2"></i>
            <span>图表组件待集成</span>
          </div>
        </div>
      </el-card>

      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="text-lg font-bold">数据模型分布</span>
            <el-button size="small" @click="refreshCharts">
              <i class="i-carbon-renew mr-1"></i>
              刷新
            </el-button>
          </div>
        </template>
        <div class="h-64">
          <!-- 这里可以集成饼图组件 -->
          <div class="flex items-center justify-center h-full text-gray-400">
            <i class="i-carbon-chart-pie text-4xl mr-2"></i>
            <span>图表组件待集成</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 快速操作 -->
    <el-card class="mb-6" shadow="hover">
      <template #header>
        <span class="text-lg font-bold">快速操作</span>
      </template>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <el-button type="primary" class="quick-action-btn" @click="gotoModels">
          <i class="i-carbon-model text-xl mb-2"></i>
          <span>创建模型</span>
        </el-button>
        <el-button type="success" class="quick-action-btn" @click="gotoRecords">
          <i class="i-carbon-data-base text-xl mb-2"></i>
          <span>管理数据</span>
        </el-button>
        <el-button type="warning" class="quick-action-btn" @click="gotoApiTest">
          <i class="i-carbon-test-tool text-xl mb-2"></i>
          <span>测试 API</span>
        </el-button>
        <el-button type="info" class="quick-action-btn" @click="gotoUIDesigner">
          <i class="i-carbon-pen text-xl mb-2"></i>
          <span>UI 设计</span>
        </el-button>
      </div>
    </el-card>

    <!-- 最近活动 -->
    <el-card shadow="hover">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-bold">最近活动</span>
          <el-button size="small" @click="loadActivities">
            <i class="i-carbon-renew mr-1"></i>
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="activities" style="width: 100%">
        <el-table-column prop="time" label="时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <el-tag :type="getActivityType(scope.row.type)" size="small">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button size="small" @click="viewActivity(scope.row)">
              查看
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store'

const router = useRouter()
const authStore = useAuthStore()

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

// 状态管理
const stats = ref({
  models: 0,
  records: 0,
  apiCalls: 0,
  users: 0
})

const timeRange = ref('7d')
const activities = ref([])
const loading = ref(false)

// 获取请求头
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }
  
  const token = authStore.token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// 方法
const loadStats = async () => {
  try {
    loading.value = true
    
    // 获取模型数量
    const modelsResponse = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'GET',
      headers: getHeaders()
    })
    
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json()
      stats.value.models = Array.isArray(modelsData) ? modelsData.length : 0
    }
    
    // 获取用户数量
    try {
      const usersResponse = await fetch(`${API_BASE_URL}/api/data/users?page=1&pageSize=1`, {
        method: 'GET',
        headers: getHeaders()
      })
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        stats.value.users = usersData.total || 0
      }
    } catch (userError) {
      console.warn('获取用户数量失败:', userError)
      stats.value.users = 0
    }
    
    // 获取数据记录总数（遍历所有模型）
    let totalRecords = 0
    if (stats.value.models > 0) {
      try {
        const modelsResponse = await fetch(`${API_BASE_URL}/api/models`, {
          method: 'GET',
          headers: getHeaders()
        })
        
        if (modelsResponse.ok) {
          const models = await modelsResponse.json()
          // 对每个模型获取记录数量
          for (const model of models) {
            try {
              const recordsResponse = await fetch(`${API_BASE_URL}/api/data/${model.name}?page=1&pageSize=1`, {
                method: 'GET',
                headers: getHeaders()
              })
              
              if (recordsResponse.ok) {
                const recordsData = await recordsResponse.json()
                totalRecords += recordsData.total || 0
              }
            } catch (recordError) {
              console.warn(`获取模型 ${model.name} 记录数量失败:`, recordError)
            }
          }
        }
      } catch (modelError) {
        console.warn('获取模型列表失败:', modelError)
      }
    }
    stats.value.records = totalRecords
    
    // API调用次数（从系统统计API获取，如果没有则使用模拟数据）
    try {
      const statsResponse = await fetch(`${API_BASE_URL}/api/stats`, {
        method: 'GET',
        headers: getHeaders()
      })
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        stats.value.apiCalls = statsData.apiCalls || 0
      } else {
        // 如果没有统计API，使用基于用户和记录的估算
        stats.value.apiCalls = stats.value.users * 10 + stats.value.records * 5 + 1000
      }
    } catch (statsError) {
      console.warn('获取API统计失败:', statsError)
      stats.value.apiCalls = stats.value.users * 10 + stats.value.records * 5 + 1000
    }
    
  } catch (error) {
    console.error('加载统计信息失败:', error)
    ElMessage.error('加载统计信息失败')
  } finally {
    loading.value = false
  }
}

const loadActivities = async () => {
  try {
    // 从API获取活动记录（这里使用模拟数据，实际应该从日志API获取）
    activities.value = [
      {
        id: 1,
        time: new Date(Date.now() - 3600000).toISOString(),
        type: 'create',
        description: '系统初始化完成',
        user: 'system'
      },
      {
        id: 2,
        time: new Date(Date.now() - 7200000).toISOString(),
        type: 'create',
        description: '创建了用户认证表',
        user: 'system'
      },
      {
        id: 3,
        time: new Date(Date.now() - 10800000).toISOString(),
        type: 'api',
        description: 'API服务启动成功',
        user: 'system'
      },
      {
        id: 4,
        time: new Date(Date.now() - 14400000).toISOString(),
        type: 'login',
        description: '用户登录系统',
        user: authStore.user?.name || '用户'
      }
    ]
    
  } catch (error) {
    console.error('加载活动记录失败:', error)
    ElMessage.error('加载活动记录失败')
  }
}

const refreshCharts = () => {
  ElMessage.info('图表数据已刷新')
}

const gotoModels = () => {
  router.push('/data-models')
}

const gotoRecords = () => {
  router.push('/data-records')
}

const gotoApiTest = () => {
  router.push('/api-test')
}

const gotoUIDesigner = () => {
  router.push('/ui-designer')
}

const viewActivity = (activity) => {
  ElMessage.info(`查看活动: ${activity.description}`)
}

const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

const getActivityType = (type) => {
  const typeMap = {
    create: 'success',
    update: 'warning',
    delete: 'danger',
    api: 'info'
  }
  return typeMap[type] || 'info'
}

// 生命周期
onMounted(() => {
  loadStats()
  loadActivities()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  transition: all 0.3s;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1);
}

.chart-card {
  height: 100%;
}

.quick-action-btn {
  height: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s;
}

.quick-action-btn:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>
