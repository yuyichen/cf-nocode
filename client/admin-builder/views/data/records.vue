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
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const selectedTable = ref('')
const tables = ref([
  { name: 'users', label: '用户表' },
  { name: 'products', label: '产品表' },
  { name: 'orders', label: '订单表' },
  { name: 'categories', label: '分类表' }
])

const tableData = ref([])
const columns = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 模拟数据
const mockData = {
  users: {
    columns: [
      { prop: 'id', label: 'ID', width: 80 },
      { prop: 'username', label: '用户名', width: 120 },
      { prop: 'email', label: '邮箱', width: 180 },
      { prop: 'role', label: '角色', width: 100 },
      { prop: 'created_at', label: '创建时间', width: 160 }
    ],
    data: Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i % 3 === 0 ? 'admin' : i % 3 === 1 ? 'editor' : 'viewer',
      created_at: new Date(Date.now() - i * 86400000).toLocaleString()
    }))
  },
  products: {
    columns: [
      { prop: 'id', label: 'ID', width: 80 },
      { prop: 'name', label: '产品名称', width: 150 },
      { prop: 'price', label: '价格', width: 100 },
      { prop: 'stock', label: '库存', width: 100 },
      { prop: 'category', label: '分类', width: 120 }
    ],
    data: Array.from({ length: 32 }, (_, i) => ({
      id: i + 1,
      name: `产品 ${i + 1}`,
      price: (Math.random() * 1000).toFixed(2),
      stock: Math.floor(Math.random() * 1000),
      category: ['电子产品', '服装', '食品', '家居'][i % 4]
    }))
  }
}

const loadTableData = async () => {
  if (!selectedTable.value) return

  loading.value = true
  try {
    // 模拟 API 请求延迟
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const tableInfo = mockData[selectedTable.value]
    if (tableInfo) {
      columns.value = tableInfo.columns
      tableData.value = tableInfo.data
      total.value = tableInfo.data.length
    } else {
      columns.value = []
      tableData.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
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

const viewRecord = (record) => {
  ElMessage.info(`查看记录: ${record.id}`)
}

const editRecord = (record) => {
  ElMessage.info(`编辑记录: ${record.id}`)
}

const deleteRecord = (record) => {
  ElMessage.info(`删除记录: ${record.id}`)
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
