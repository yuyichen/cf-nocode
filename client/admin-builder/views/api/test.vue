<template>
  <div class="api-test">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">API 测试工具</h1>
          <p class="text-gray-500 mt-1">在线测试和调试 API 接口</p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="sendRequest" :loading="sending">
            <i class="i-carbon-send mr-1"></i>
            发送请求
          </el-button>
          <el-button @click="clearRequest">
            <i class="i-carbon-clean mr-1"></i>
            清空
          </el-button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 请求配置 -->
      <el-card class="lg:col-span-2" shadow="hover">
        <template #header>
          <span class="font-bold">请求配置</span>
        </template>

        <div class="space-y-4">
          <!-- 请求行 -->
          <div class="flex items-center gap-2">
            <el-select v-model="request.method" style="width: 120px">
              <el-option label="GET" value="GET"></el-option>
              <el-option label="POST" value="POST"></el-option>
              <el-option label="PUT" value="PUT"></el-option>
              <el-option label="DELETE" value="DELETE"></el-option>
              <el-option label="PATCH" value="PATCH"></el-option>
            </el-select>
            
            <el-input v-model="request.url" placeholder="输入 API 地址">
              <template #prepend>
                <span class="text-gray-500">http://localhost:8787</span>
              </template>
            </el-input>
          </div>

          <!-- 请求头 -->
          <div>
            <h3 class="font-bold mb-2">请求头</h3>
            <div class="space-y-2">
              <div v-for="(header, index) in request.headers" :key="index" class="flex gap-2">
                <el-input v-model="header.key" placeholder="Header 名称" />
                <el-input v-model="header.value" placeholder="Header 值" />
                <el-button @click="removeHeader(index)" type="danger" plain>
                  <i class="i-carbon-trash-can"></i>
                </el-button>
              </div>
              <el-button @click="addHeader" size="small">
                <i class="i-carbon-add mr-1"></i>
                添加请求头
              </el-button>
            </div>
          </div>

          <!-- 请求体 -->
          <div v-if="showRequestBody">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold">请求体</h3>
              <el-select v-model="request.bodyType" size="small" style="width: 120px">
                <el-option label="JSON" value="json"></el-option>
                <el-option label="Form Data" value="form"></el-option>
                <el-option label="Raw" value="raw"></el-option>
              </el-select>
            </div>

            <div v-if="request.bodyType === 'json'">
              <el-input
                v-model="request.body"
                type="textarea"
                :rows="8"
                placeholder="输入 JSON 数据"
                class="font-mono text-sm"
              />
            </div>

            <div v-else-if="request.bodyType === 'form'">
              <div class="space-y-2">
                <div v-for="(field, index) in request.formData" :key="index" class="flex gap-2">
                  <el-input v-model="field.key" placeholder="字段名" />
                  <el-input v-model="field.value" placeholder="字段值" />
                  <el-button @click="removeFormField(index)" type="danger" plain>
                    <i class="i-carbon-trash-can"></i>
                  </el-button>
                </div>
                <el-button @click="addFormField" size="small">
                  <i class="i-carbon-add mr-1"></i>
                  添加字段
                </el-button>
              </div>
            </div>

            <div v-else>
              <el-input
                v-model="request.rawBody"
                type="textarea"
                :rows="8"
                placeholder="输入原始数据"
                class="font-mono text-sm"
              />
            </div>
          </div>
        </div>
      </el-card>

      <!-- 响应结果 -->
      <el-card class="response-card" shadow="hover">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold">响应结果</span>
            <el-tag :type="responseStatusType" size="small">
              {{ response.status || '等待请求' }}
            </el-tag>
          </div>
        </template>

        <div v-if="response.data" class="space-y-4">
          <!-- 响应头 -->
          <div>
            <h3 class="font-bold mb-2">响应头</h3>
            <pre class="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto max-h-[100px]">{{ formatHeaders(response.headers) }}</pre>
          </div>

          <!-- 响应体 -->
          <div>
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-bold">响应体</h3>
              <el-button size="small" @click="copyResponse">
                <i class="i-carbon-copy mr-1"></i>
                复制
              </el-button>
            </div>
            <pre class="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-auto max-h-[300px]">{{ formatResponse(response.data) }}</pre>
          </div>

          <!-- 响应时间 -->
          <div class="text-sm text-gray-500">
            <div class="flex justify-between">
              <span>响应时间</span>
              <span>{{ response.time }} ms</span>
            </div>
            <div class="flex justify-between">
              <span>响应大小</span>
              <span>{{ response.size }} bytes</span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <i class="i-carbon-test-tool text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">发送请求查看响应结果</p>
        </div>
      </el-card>
    </div>

    <!-- 历史记录 -->
    <el-card class="mt-6" shadow="hover">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-bold">历史记录</span>
          <el-button size="small" @click="clearHistory">
            <i class="i-carbon-trash-can mr-1"></i>
            清空历史
          </el-button>
        </div>
      </template>

      <el-table :data="history" size="small">
        <el-table-column width="100">
          <template #default="scope">
            <el-tag :type="getHistoryStatusType(scope.row.status)" size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="method" label="方法" width="80" />
        <el-table-column prop="url" label="URL" />
        <el-table-column prop="time" label="时间" width="120">
          <template #default="scope">
            {{ formatTime(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="80">
          <template #default="scope">
            {{ scope.row.duration }}ms
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="loadFromHistory(scope.row)">
              加载
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const sending = ref(false)
const request = ref({
  method: 'GET',
  url: '/api/models',
  headers: [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Accept', value: 'application/json' }
  ],
  bodyType: 'json',
  body: '{\n  "name": "test",\n  "label": "测试模型"\n}',
  formData: [
    { key: 'name', value: 'test' }
  ],
  rawBody: ''
})

const response = ref({
  status: '',
  headers: {},
  data: null,
  time: 0,
  size: 0
})

const history = ref([])

const showRequestBody = computed(() => {
  return ['POST', 'PUT', 'PATCH'].includes(request.value.method)
})

const responseStatusType = computed(() => {
  const status = response.value.status
  if (!status) return 'info'
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
})

const sendRequest = async () => {
  if (!request.value.url) {
    return ElMessage.warning('请输入 API 地址')
  }

  sending.value = true
  const startTime = Date.now()

  try {
    // 构建请求配置
    const config = {
      method: request.value.method,
      headers: {}
    }

    // 添加请求头
    request.value.headers.forEach(header => {
      if (header.key && header.value) {
        config.headers[header.key] = header.value
      }
    })

    // 添加请求体
    if (showRequestBody.value) {
      if (request.value.bodyType === 'json') {
        config.headers['Content-Type'] = 'application/json'
        config.body = request.value.body
      } else if (request.value.bodyType === 'form') {
        const formData = new FormData()
        request.value.formData.forEach(field => {
          if (field.key && field.value) {
            formData.append(field.key, field.value)
          }
        })
        config.body = formData
      } else {
        config.body = request.value.rawBody
      }
    }

    // 发送请求
    const fullUrl = request.value.url.startsWith('http')
      ? request.value.url
      : `http://localhost:8787${request.value.url}`

    const fetchResponse = await fetch(fullUrl, config)
    const endTime = Date.now()

    // 处理响应
    const responseHeaders = {}
    fetchResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value
    })

    let responseData
    const contentType = fetchResponse.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      responseData = await fetchResponse.json()
    } else {
      responseData = await fetchResponse.text()
    }

    response.value = {
      status: fetchResponse.status,
      statusText: fetchResponse.statusText,
      headers: responseHeaders,
      data: responseData,
      time: endTime - startTime,
      size: JSON.stringify(responseData).length
    }

    // 保存到历史记录
    history.value.unshift({
      method: request.value.method,
      url: request.value.url,
      status: fetchResponse.status,
      time: new Date().toISOString(),
      duration: endTime - startTime,
      request: { ...request.value },
      response: { ...response.value }
    })

    // 限制历史记录数量
    if (history.value.length > 10) {
      history.value = history.value.slice(0, 10)
    }

    ElMessage.success('请求发送成功')
  } catch (error) {
    console.error('请求失败:', error)
    ElMessage.error(`请求失败: ${error.message}`)
    
    response.value = {
      status: 'Error',
      headers: {},
      data: { error: error.message },
      time: Date.now() - startTime,
      size: 0
    }
  } finally {
    sending.value = false
  }
}

const clearRequest = () => {
  request.value = {
    method: 'GET',
    url: '/api/models',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Accept', value: 'application/json' }
    ],
    bodyType: 'json',
    body: '{\n  "name": "test",\n  "label": "测试模型"\n}',
    formData: [
      { key: 'name', value: 'test' }
    ],
    rawBody: ''
  }
  response.value = {
    status: '',
    headers: {},
    data: null,
    time: 0,
    size: 0
  }
}

const addHeader = () => {
  request.value.headers.push({ key: '', value: '' })
}

const removeHeader = (index) => {
  request.value.headers.splice(index, 1)
}

const addFormField = () => {
  request.value.formData.push({ key: '', value: '' })
}

const removeFormField = (index) => {
  request.value.formData.splice(index, 1)
}

const copyResponse = () => {
  const text = JSON.stringify(response.value.data, null, 2)
  navigator.clipboard.writeText(text)
  ElMessage.success('响应已复制到剪贴板')
}

const clearHistory = () => {
  history.value = []
  ElMessage.success('历史记录已清空')
}

const loadFromHistory = (record) => {
  request.value = { ...record.request }
  response.value = { ...record.response }
  ElMessage.success('已加载历史记录')
}

const formatHeaders = (headers) => {
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')
}

const formatResponse = (data) => {
  if (typeof data === 'string') {
    try {
      return JSON.stringify(JSON.parse(data), null, 2)
    } catch {
      return data
    }
  }
  return JSON.stringify(data, null, 2)
}

const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleTimeString('zh-CN')
}

const getHistoryStatusType = (status) => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 400 && status < 500) return 'warning'
  if (status >= 500) return 'danger'
  return 'info'
}
</script>

<style scoped>
.api-test {
  padding: 0;
}

.page-header {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.response-card {
  height: fit-content;
  position: sticky;
  top: 1rem;
}

:deep(.el-input-group__prepend) {
  background-color: #f5f7fa;
}

:deep(pre) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  line-height: 1.5;
}
</style>
