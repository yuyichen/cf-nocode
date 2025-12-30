<template>
  <div class="data-records">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">数据记录管理</h1>
          <p class="text-gray-500 mt-1">查看和管理数据表中的记录</p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="refreshData">
            <i class="i-carbon-renew mr-1"></i>
            刷新数据
          </el-button>
          <el-button @click="exportData">
            <i class="i-carbon-download mr-1"></i>
            导出数据
          </el-button>
        </div>
      </div>
    </div>

    <el-card class="mb-6" shadow="hover">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-bold">数据表选择</span>
          <el-select v-model="selectedTable" placeholder="选择数据表" style="width: 240px">
            <el-option
              v-for="table in tables"
              :key="table.name"
              :label="table.label"
              :value="table.name"
            />
          </el-select>
        </div>
      </template>

      <div v-if="selectedTable" class="space-y-4">
        <!-- 数据表格 -->
        <el-table
          :data="tableData"
          stripe
          style="width: 100%"
          v-loading="loading"
          height="400"
        >
          <el-table-column
            v-for="column in columns"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
          />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <div class="flex gap-1">
                <el-button size="small" @click="viewRecord(scope.row)">
                  查看
                </el-button>
                <el-button size="small" type="primary" @click="editRecord(scope.row)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click="deleteRecord(scope.row)">
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="flex justify-between items-center">
          <div class="text-gray-500 text-sm">
            共 {{ total }} 条记录，当前显示第 {{ currentPage }} 页
          </div>
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <div v-else class="text-center py-12">
        <i class="i-carbon-data-table text-4xl text-gray-400 mb-4"></i>
        <p class="text-gray-500">请选择一个数据表以查看记录</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../store'

const authStore = useAuthStore()

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const selectedTable = ref('')
const tables = ref([])
const tableData = ref([])
const columns = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

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

// 加载可用的数据表（从模型API获取）
const loadAvailableTables = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'GET',
      headers: getHeaders()
    })
    
    if (response.ok) {
      const models = await response.json()
      tables.value = models.map(model => ({
        name: model.name,
        label: model.label || model.name,
        id: model.id
      }))
    }
  } catch (error) {
    console.error('加载数据表失败:', error)
    ElMessage.error('加载数据表失败')
  }
}

// 加载表数据
const loadTableData = async () => {
  if (!selectedTable.value) return

  loading.value = true
  try {
    // 构建查询参数
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    const response = await fetch(`${API_BASE_URL}/api/data/${selectedTable.value}?${params}`, {
      method: 'GET',
      headers: getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('加载数据失败')
    }
    
    const result = await response.json()
    
    if (result.success) {
      tableData.value = result.data || []
      total.value = result.total || 0
      
      // 动态生成列
      if (tableData.value.length > 0) {
        const firstRow = tableData.value[0]
        columns.value = Object.keys(firstRow).map(key => ({
          prop: key,
          label: formatColumnLabel(key),
          width: getColumnWidth(key)
        }))
      } else {
        columns.value = []
      }
    } else {
      tableData.value = []
      columns.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 格式化列标签
const formatColumnLabel = (key) => {
  const labelMap = {
    id: 'ID',
    created_at: '创建时间',
    updated_at: '更新时间',
    name: '名称',
    email: '邮箱',
    username: '用户名',
    role: '角色',
    status: '状态'
  }
  
  return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

// 获取列宽度
const getColumnWidth = (key) => {
  const widthMap = {
    id: 80,
    created_at: 160,
    updated_at: 160,
    name: 150,
    email: 180,
    username: 120,
    role: 100,
    status: 100
  }
  
  return widthMap[key] || 120
}

const refreshData = () => {
  if (selectedTable.value) {
    loadTableData()
    ElMessage.success('数据已刷新')
  } else {
    ElMessage.warning('请先选择数据表')
  }
}

const exportData = () => {
  if (!selectedTable.value) {
    return ElMessage.warning('请先选择数据表')
  }
  
  ElMessage.info('数据导出功能开发中')
}

const viewRecord = async (record) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/${selectedTable.value}/${record.id}`, {
      method: 'GET',
      headers: getHeaders()
    })
    
    if (response.ok) {
      const result = await response.json()
      ElMessage.info(`查看记录: ${record.id} (数据已加载)`)
      console.log('记录详情:', result.data)
    } else {
      ElMessage.info(`查看记录: ${record.id}`)
    }
  } catch (error) {
    console.error('查看记录失败:', error)
    ElMessage.info(`查看记录: ${record.id}`)
  }
}

const editRecord = async (record) => {
  try {
    // 获取记录详情
    const response = await fetch(`${API_BASE_URL}/api/data/${selectedTable.value}/${record.id}`, {
      method: 'GET',
      headers: getHeaders()
    })
    
    if (!response.ok) {
      ElMessage.info(`编辑记录: ${record.id}`)
      return
    }
    
    const result = await response.json()
    
    // 创建一个更简单的编辑对话框，只编辑主要字段
    const recordData = result.data || record
    
    // 找出可以编辑的字段（排除id、created_at等系统字段）
    const editableFields = Object.keys(recordData).filter(key => 
      !['id', 'created_at', 'updated_at', 'password_hash'].includes(key)
    )
    
    if (editableFields.length === 0) {
      ElMessage.warning('没有可编辑的字段')
      return
    }
    
    // 创建编辑表单
    let editForm = ''
    editableFields.forEach(field => {
      const value = recordData[field]
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
      editForm += `${field}: <input type="text" value="${displayValue}" id="edit-${field}" style="width:100%;margin-bottom:10px;"><br>`
    })
    
    const resultDialog = await ElMessageBox.confirm(
      `<div style="max-height:400px;overflow-y:auto;">
        <h4>编辑记录 ${record.id}</h4>
        ${editForm}
      </div>`,
      '编辑记录',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        showClose: false
      }
    )
    
    if (resultDialog) {
      // 收集编辑后的数据
      const updateData = {}
      editableFields.forEach(field => {
        const input = document.getElementById(`edit-${field}`)
        if (input) {
          const value = input.value.trim()
          // 尝试解析JSON，如果不是JSON就保持原样
          try {
            updateData[field] = JSON.parse(value)
          } catch {
            updateData[field] = value
          }
        }
      })
      
      // 更新记录
      const updateResponse = await fetch(`${API_BASE_URL}/api/data/${selectedTable.value}/${record.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      })
      
      if (updateResponse.ok) {
        ElMessage.success('记录已更新')
        loadTableData() // 刷新列表
      } else {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || '更新记录失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('编辑记录失败:', error)
      ElMessage.error(error.message || '编辑记录失败')
    }
  }
}

const deleteRecord = async (record) => {
  try {
    await ElMessageBox.confirm(`确定要删除记录 "${record.id}" 吗？`, '删除确认', {
      type: 'warning'
    })
    
    const response = await fetch(`${API_BASE_URL}/api/data/${selectedTable.value}/${record.id}`, {
      method: 'DELETE',
      headers: getHeaders()
    })
    
    if (response.ok) {
      ElMessage.success('记录已删除')
      loadTableData() // 刷新列表
    } else {
      const errorData = await response.json()
      throw new Error(errorData.error || '删除记录失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除记录失败:', error)
      ElMessage.error(error.message || '删除记录失败')
    }
  }
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadTableData()
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadTableData()
}

// 监听表选择变化
watch(selectedTable, (newTable) => {
  if (newTable) {
    currentPage.value = 1
    loadTableData()
  }
})

// 初始化加载数据表
onMounted(() => {
  loadAvailableTables()
})
</script>

<style scoped>
.data-records {
  padding: 0;
}

.page-header {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
