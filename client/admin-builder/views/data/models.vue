<template>
  <div class="data-models">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">数据模型管理</h1>
          <p class="text-gray-500 mt-1">创建和管理数据模型，自动生成数据库表和 API</p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="showCreateModel = true">
            <i class="i-carbon-add mr-1"></i>
            新建模型
          </el-button>
          <el-button @click="refreshModels">
            <i class="i-carbon-renew mr-1"></i>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 这里将集成现有的 AdminHome.vue 功能 -->
    <div class="bg-white rounded-lg shadow p-6">
      <p class="text-gray-600 mb-4">正在集成现有的模型设计器功能...</p>
      <div class="text-center py-8">
        <i class="i-carbon-model text-4xl text-blue-500 mb-4"></i>
        <p class="text-gray-500">模型设计器功能将在这里显示</p>
        <p class="text-sm text-gray-400 mt-2">基于现有的 AdminHome.vue 重构</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const API_BASE = 'http://localhost:8787'

const showCreateModel = ref(false)
const loading = ref(false)

const fetchModels = async () => {
  try {
    loading.value = true
    const response = await fetch(`${API_BASE}/api/models`)
    if (!response.ok) throw new Error('获取模型列表失败')
    const models = await response.json()
    ElMessage.success(`成功加载 ${models.length} 个模型`)
  } catch (error) {
    console.error('获取模型列表失败:', error)
    ElMessage.error('获取模型列表失败')
  } finally {
    loading.value = false
  }
}

const refreshModels = () => {
  fetchModels()
}

onMounted(() => {
  fetchModels()
})
</script>

<style scoped>
.data-models {
  padding: 0;
}

.page-header {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
