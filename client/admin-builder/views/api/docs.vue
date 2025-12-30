<template>
  <div class="api-docs">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">API 文档</h1>
          <p class="text-gray-500 mt-1">查看和管理自动生成的 API 接口文档</p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="refreshDocs">
            <i class="i-carbon-renew mr-1"></i>
            刷新文档
          </el-button>
          <el-button @click="exportDocs">
            <i class="i-carbon-download mr-1"></i>
            导出文档
          </el-button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- API 列表 -->
      <el-card class="lg:col-span-2" shadow="hover">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold">API 接口列表</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索 API 接口"
              style="width: 240px"
              size="small"
              clearable
            >
              <template #prefix>
                <i class="i-carbon-search"></i>
              </template>
            </el-input>
          </div>
        </template>

        <el-table
          :data="filteredApis"
          stripe
          style="width: 100%"
          v-loading="loading"
          @row-click="selectApi"
        >
          <el-table-column prop="method" label="方法" width="100">
            <template #default="scope">
              <el-tag :type="getMethodType(scope.row.method)" size="small">
                {{ scope.row.method }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="path" label="路径">
            <template #default="scope">
              <code class="text-sm">{{ scope.row.path }}</code>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="model" label="模型" width="120">
            <template #default="scope">
              <el-tag v-if="scope.row.model" size="small" type="info">
                {{ scope.row.model }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- API 详情 -->
      <el-card class="api-detail" shadow="hover">
        <template #header>
          <span class="font-bold">API 详情</span>
        </template>

        <div v-if="selectedApi" class="space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <el-tag :type="getMethodType(selectedApi.method)" size="large">
                {{ selectedApi.method }}
              </el-tag>
              <code class="text-lg font-bold">{{ selectedApi.path }}</code>
            </div>
            <p class="text-gray-600">{{ selectedApi.description }}</p>
          </div>

          <div>
            <h3 class="font-bold mb-2">请求参数</h3>
            <el-table :data="selectedApi.parameters" size="small">
              <el-table-column prop="name" label="参数名" width="120" />
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column prop="required" label="必填" width="80">
                <template #default="scope">
                  <el-tag v-if="scope.row.required" size="small" type="danger">是</el-tag>
                  <el-tag v-else size="small" type="info">否</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" />
            </el-table>
          </div>

          <div>
            <h3 class="font-bold mb-2">响应示例</h3>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto max-h-[200px]">{{ formatResponse(selectedApi.response) }}</pre>
          </div>

          <div class="pt-4 border-t">
            <el-button type="primary" class="w-full" @click="testApi">
              <i class="i-carbon-test-tool mr-2"></i>
              测试此 API
            </el-button>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <i class="i-carbon-api text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">选择一个 API 接口查看详情</p>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const searchQuery = ref('')
const loading = ref(false)
const selectedApi = ref(null)

// 模拟 API 数据
const apis = ref([
  {
    id: 1,
    method: 'GET',
    path: '/api/models',
    description: '获取所有数据模型列表',
    model: 'models',
    parameters: [],
    response: {
      success: true,
      data: [
        { id: 1, name: 'users', label: '用户表' },
        { id: 2, name: 'products', label: '产品表' }
      ]
    }
  },
  {
    id: 2,
    method: 'GET',
    path: '/api/models/{id}',
    description: '获取指定模型详情',
    model: 'models',
    parameters: [
      { name: 'id', type: 'number', required: true, description: '模型ID' }
    ],
    response: {
      success: true,
      data: {
        id: 1,
        name: 'users',
        label: '用户表',
        fields: [
          { name: 'id', type: 'number', label: 'ID' },
          { name: 'username', type: 'string', label: '用户名' }
        ]
      }
    }
  },
  {
    id: 3,
    method: 'POST',
    path: '/api/models',
    description: '创建新的数据模型',
    model: 'models',
    parameters: [
      { name: 'name', type: 'string', required: true, description: '模型名称' },
      { name: 'label', type: 'string', required: true, description: '显示标签' },
      { name: 'description', type: 'string', required: false, description: '描述信息' }
    ],
    response: {
      success: true,
      data: {
        id: 3,
        name: 'orders',
        label: '订单表',
        created_at: '2024-01-15T10:30:00Z'
      }
    }
  },
  {
    id: 4,
    method: 'GET',
    path: '/api/{model}/records',
    description: '获取数据记录列表',
    model: 'records',
    parameters: [
      { name: 'model', type: 'string', required: true, description: '模型名称' },
      { name: 'page', type: 'number', required: false, description: '页码' },
      { name: 'limit', type: 'number', required: false, description: '每页数量' }
    ],
    response: {
      success: true,
      data: {
        records: [
          { id: 1, username: 'admin', email: 'admin@example.com' },
          { id: 2, username: 'user1', email: 'user1@example.com' }
        ],
        total: 2,
        page: 1,
        limit: 10
      }
    }
  },
  {
    id: 5,
    method: 'POST',
    path: '/api/{model}/records',
    description: '创建数据记录',
    model: 'records',
    parameters: [
      { name: 'model', type: 'string', required: true, description: '模型名称' },
      { name: 'data', type: 'object', required: true, description: '记录数据' }
    ],
    response: {
      success: true,
      data: {
        id: 3,
        username: 'newuser',
        email: 'newuser@example.com',
        created_at: '2024-01-15T10:30:00Z'
      }
    }
  }
])

const filteredApis = computed(() => {
  if (!searchQuery.value) return apis.value
  
  const query = searchQuery.value.toLowerCase()
  return apis.value.filter(api => 
    api.path.toLowerCase().includes(query) ||
    api.description.toLowerCase().includes(query) ||
    api.method.toLowerCase().includes(query)
  )
})

const getMethodType = (method) => {
  const types = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    DELETE: 'danger',
    PATCH: 'info'
  }
  return types[method] || 'info'
}

const selectApi = (api) => {
  selectedApi.value = api
}

const refreshDocs = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('API 文档已刷新')
  }, 800)
}

const exportDocs = () => {
  ElMessage.info('文档导出功能开发中')
}

const testApi = () => {
  if (selectedApi.value) {
    ElMessage.info(`测试 API: ${selectedApi.value.method} ${selectedApi.value.path}`)
  }
}

const formatResponse = (response) => {
  return JSON.stringify(response, null, 2)
}
</script>

<style scoped>
.api-docs {
  padding: 0;
}

.page-header {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.api-detail {
  height: fit-content;
  position: sticky;
  top: 1rem;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
