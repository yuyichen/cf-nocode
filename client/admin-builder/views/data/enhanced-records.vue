<template>
  <div class="data-management">
    <!-- 页面头部 -->
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold mb-2">数据管理</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>数据管理</el-breadcrumb-item>
            <el-breadcrumb-item v-if="selectedModel">{{ selectedModel.label }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="flex gap-2">
          <el-button v-if="!selectedModel" type="primary" @click="showModelSelector = true">
            <i class="i-carbon-data-base mr-1"></i>
            选择模型
          </el-button>
          <el-button v-if="selectedModel" type="success" @click="showCreateDialog = true">
            <i class="i-carbon-add-alt mr-1"></i>
            新增记录
          </el-button>
          <el-button v-if="selectedModel" @click="exportData">
            <i class="i-carbon-download mr-1"></i>
            导出数据
          </el-button>
          <el-button @click="refreshData">
            <i class="i-carbon-renew mr-1"></i>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 模型选择器 -->
    <el-card v-if="!selectedModel" class="mb-6">
      <template #header>
        <span class="text-lg font-bold">选择数据模型</span>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="model in models" 
          :key="model.id"
          class="model-card p-4 border rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
          @click="selectModel(model)"
        >
          <div class="flex items-center justify-between mb-3">
            <i class="i-carbon-data-table text-2xl text-blue-500"></i>
            <el-tag size="small">{{ model.fields?.length || 0 }} 字段</el-tag>
          </div>
          <h3 class="font-semibold text-lg mb-2">{{ model.label }}</h3>
          <p class="text-sm text-gray-500 mb-3">{{ model.description || '暂无描述' }}</p>
          <div class="flex justify-between items-center text-xs text-gray-400">
            <span>{{ model.name }}</span>
            <span>{{ formatDate(model.created_at) }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 (当选择模型后显示) -->
    <el-card v-if="selectedModel">
      <template #header>
        <div class="flex justify-between items-center">
          <div>
            <span class="text-lg font-bold">{{ selectedModel.label }} 数据</span>
            <el-tag class="ml-2" type="info">{{ total }} 条记录</el-tag>
          </div>
          
          <div class="flex gap-2 items-center">
            <!-- 搜索框 -->
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索记录..." 
              class="w-48"
              clearable
              @clear="clearSearch"
              @input="debounceSearch"
            >
              <template #prefix>
                <i class="i-carbon-search"></i>
              </template>
            </el-input>
            
            <!-- 高级筛选 -->
            <el-popover placement="bottom-end" :width="300" trigger="click">
              <template #reference>
                <el-button>
                  <i class="i-carbon-filter mr-1"></i>
                  筛选
                  <el-badge v-if="activeFiltersCount > 0" :value="activeFiltersCount" class="ml-2" />
                </el-button>
              </template>
              
              <div class="filter-panel">
                <h4 class="font-semibold mb-3">高级筛选</h4>
                <div class="space-y-3">
                  <div 
                    v-for="field in filterableFields" 
                    :key="field.name"
                    class="filter-item"
                  >
                    <label class="block text-sm font-medium mb-1">{{ field.label }}</label>
                    <el-input 
                      v-if="field.type === 'text'"
                      v-model="filters[field.name]"
                      :placeholder="`按${field.label}筛选`"
                      clearable
                      @change="applyFilters"
                    />
                    <el-date-picker
                      v-else-if="field.type === 'date' || field.type === 'datetime'"
                      v-model="filters[field.name]"
                      type="daterange"
                      range-separator="至"
                      start-placeholder="开始日期"
                      end-placeholder="结束日期"
                      @change="applyFilters"
                    />
                    <el-select
                      v-else-if="field.type === 'boolean'"
                      v-model="filters[field.name]"
                      :placeholder="`按${field.label}筛选`"
                      clearable
                      @change="applyFilters"
                    >
                      <el-option label="是" :value="true" />
                      <el-option label="否" :value="false" />
                    </el-select>
                  </div>
                </div>
                
                <div class="flex justify-between mt-4 pt-3 border-t">
                  <el-button size="small" @click="clearFilters">清除筛选</el-button>
                  <el-button type="primary" size="small" @click="applyFilters">应用筛选</el-button>
                </div>
              </div>
            </el-popover>
            
            <!-- 列设置 -->
            <el-dropdown trigger="click" @command="handleColumnCommand">
              <el-button>
                <i class="i-carbon-settings mr-1"></i>
                列设置
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="reset">重置列</el-dropdown-item>
                  <el-dropdown-item command="customize">自定义列</el-dropdown-item>
                  <el-dropdown-item divided command="export">导出配置</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>

      <!-- 批量操作栏 -->
      <div v-if="selectedRows.length > 0" class="batch-actions mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex justify-between items-center">
          <div class="flex items-center">
            <el-checkbox 
              v-model="selectAll" 
              @change="handleSelectAll"
              class="mr-3"
            />
            <span class="text-sm">已选择 {{ selectedRows.length }} 条记录</span>
          </div>
          
          <div class="flex gap-2">
            <el-button size="small" @click="batchEdit">批量编辑</el-button>
            <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
            <el-button size="small" @click="exportSelected">导出选中</el-button>
          </div>
        </div>
      </div>

      <!-- 数据表格 -->
      <el-table 
        :data="tableData" 
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        class="data-table"
        height="500"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" width="60" label="#" />
        
        <el-table-column 
          v-for="field in displayFields" 
          :key="field.name"
          :prop="field.name"
          :label="field.label"
          :sortable="true"
          :min-width="getColumnWidth(field.type)"
        >
          <template #default="{ row }">
            <div class="cell-content">
              <span v-if="field.type === 'boolean'">
                <el-tag :type="row[field.name] ? 'success' : 'danger'" size="small">
                  {{ row[field.name] ? '是' : '否' }}
                </el-tag>
              </span>
              <span v-else-if="field.type === 'date' || field.type === 'datetime'">
                {{ formatDate(row[field.name]) }}
              </span>
              <span v-else-if="field.type === 'number'">
                {{ formatNumber(row[field.name]) }}
              </span>
              <span v-else>
                {{ row[field.name] || '-' }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row, $index }">
            <div class="table-actions">
              <el-button size="small" @click="editRecord(row, $index)">
                <i class="i-carbon-edit mr-1"></i>
                编辑
              </el-button>
              <el-button size="small" type="danger" @click="deleteRecord(row)">
                <i class="i-carbon-trash-can mr-1"></i>
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-between items-center mt-4">
        <div class="text-sm text-gray-500">
          显示第 {{ (currentPage - 1) * pageSize + 1 }} - {{ Math.min(currentPage * pageSize, total) }} 条，
          共 {{ total }} 条记录
        </div>
        
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog 
      v-model="showCreateDialog" 
      :title="editingRecord ? '编辑记录' : '创建记录'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules" 
        label-width="100px"
      >
        <el-form-item 
          v-for="field in selectedModel?.fields || []" 
          :key="field.name"
          :label="field.label"
          :prop="field.name"
          :required="field.required"
        >
          <el-input 
            v-if="field.type === 'text'"
            v-model="formData[field.name]"
            :placeholder="`请输入${field.label}`"
          />
          <el-input-number 
            v-else-if="field.type === 'number'"
            v-model="formData[field.name]"
            :placeholder="`请输入${field.label}`"
            style="width: 100%"
          />
          <el-switch 
            v-else-if="field.type === 'boolean'"
            v-model="formData[field.name]"
            :active-text="'是'"
            :inactive-text="'否'"
          />
          <el-date-picker 
            v-else-if="field.type === 'date' || field.type === 'datetime'"
            v-model="formData[field.name]"
            :type="field.type === 'datetime' ? 'datetime' : 'date'"
            :placeholder="`请选择${field.label}`"
            style="width: 100%"
          />
          <el-select 
            v-else-if="field.type === 'relation'"
            v-model="formData[field.name]"
            :placeholder="`请选择${field.label}`"
            style="width: 100%"
          >
            <!-- 关联字段选项 -->
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRecord" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../store';

const authStore = useAuthStore();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

// 响应式状态
const models = ref([]);
const selectedModel = ref(null);
const tableData = ref([]);
const loading = ref(false);
const showModelSelector = ref(false);
const showCreateDialog = ref(false);
const editingRecord = ref(null);
const saving = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const selectedRows = ref([]);
const selectAll = ref(false);
const filters = ref({});
const sortBy = ref('created_at');
const sortOrder = ref('desc');

const formData = ref({});
const formRef = ref(null);

// 计算属性
const filterableFields = computed(() => {
  return selectedModel.value?.fields?.filter(field => 
    ['text', 'date', 'datetime', 'boolean'].includes(field.type)
  ) || [];
});

const displayFields = computed(() => {
  return selectedModel.value?.fields || [];
});

const activeFiltersCount = computed(() => {
  return Object.keys(filters.value).filter(key => filters.value[key] !== '' && filters.value[key] !== null).length;
});

const formRules = computed(() => {
  const rules = {};
  if (!selectedModel.value?.fields) return rules;
  
  selectedModel.value.fields.forEach(field => {
    if (field.required) {
      rules[field.name] = [
        { required: true, message: `请输入${field.label}`, trigger: 'blur' }
      ];
    }
    
    if (field.type === 'email') {
      rules[field.name] = rules[field.name] || [];
      rules[field.name].push({ type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' });
    }
  });
  
  return rules;
});

// API 请求头
const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = authStore.token;
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// 方法
const fetchModels = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      headers: getHeaders()
    });
    if (response.ok) {
      models.value = await response.json();
    }
  } catch (error) {
    ElMessage.error('获取模型列表失败');
  }
};

const selectModel = (model) => {
  selectedModel.value = model;
  currentPage.value = 1;
  fetchData();
};

const fetchData = async () => {
  if (!selectedModel.value) return;
  
  try {
    loading.value = true;
    const params = new URLSearchParams({
      page: currentPage.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
      ...filters.value
    });
    
    const response = await fetch(`${API_BASE_URL}/api/data/${selectedModel.value.name}?${params}`, {
      headers: getHeaders()
    });
    
    if (response.ok) {
      const result = await response.json();
      tableData.value = result.data || [];
      total.value = result.total || 0;
    }
  } catch (error) {
    ElMessage.error('获取数据失败');
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  fetchData();
};

const createRecord = () => {
  editingRecord.value = null;
  formData.value = {};
  
  if (selectedModel.value?.fields) {
    selectedModel.value.fields.forEach(field => {
      formData.value[field.name] = field.type === 'boolean' ? false : '';
    });
  }
  
  showCreateDialog.value = true;
};

const editRecord = (row, index) => {
  editingRecord.value = { ...row, index };
  formData.value = { ...row };
  showCreateDialog.value = true;
};

const saveRecord = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    saving.value = true;
    
    const url = editingRecord.value 
      ? `${API_BASE_URL}/api/data/${selectedModel.value.name}/${editingRecord.value.id}`
      : `${API_BASE_URL}/api/data/${selectedModel.value.name}`;
    
    const method = editingRecord.value ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(formData.value)
    });
    
    if (response.ok) {
      ElMessage.success(editingRecord.value ? '更新成功' : '创建成功');
      showCreateDialog.value = false;
      fetchData();
    } else {
      const error = await response.json();
      throw new Error(error.error || '操作失败');
    }
  } catch (error) {
    ElMessage.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
};

const deleteRecord = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条记录吗？`,
      '确认删除',
      { type: 'warning' }
    );
    
    const response = await fetch(`${API_BASE_URL}/api/data/${selectedModel.value.name}/${row.id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (response.ok) {
      ElMessage.success('删除成功');
      fetchData();
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
  selectAll.value = selection.length === tableData.value.length;
};

const handleSelectAll = (val) => {
  selectedRows.value = val ? [...tableData.value] : [];
};

const handleSortChange = ({ prop, order }) => {
  sortBy.value = prop;
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc';
  fetchData();
};

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchData();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchData();
};

const applyFilters = () => {
  currentPage.value = 1;
  fetchData();
};

const clearFilters = () => {
  filters.value = {};
  fetchData();
};

const clearSearch = () => {
  searchQuery.value = '';
  fetchData();
};

const debounceSearch = (() => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      currentPage.value = 1;
      fetchData();
    }, 500);
  };
})();

const getColumnWidth = (type) => {
  const widths = {
    text: 150,
    number: 120,
    date: 120,
    datetime: 150,
    boolean: 100,
    relation: 150
  };
  return widths[type] || 150;
};

const batchEdit = () => {
  ElMessage.info('批量编辑功能开发中...');
};

const batchDelete = async () => {
  if (selectedRows.value.length === 0) return;
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '批量删除',
      { type: 'warning' }
    );
    
    const ids = selectedRows.value.map(row => row.id);
    const response = await fetch(`${API_BASE_URL}/api/data/${selectedModel.value.name}/batch-delete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ ids })
    });
    
    if (response.ok) {
      ElMessage.success('批量删除成功');
      selectedRows.value = [];
      fetchData();
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败');
    }
  }
};

const exportData = () => {
  const csv = convertToCSV(tableData.value, displayFields.value);
  downloadCSV(csv, `${selectedModel.value.name}_data.csv`);
  ElMessage.success('数据导出成功');
};

const exportSelected = () => {
  const csv = convertToCSV(selectedRows.value, displayFields.value);
  downloadCSV(csv, `${selectedModel.value.name}_selected_data.csv`);
  ElMessage.success('选中数据导出成功');
};

const convertToCSV = (data, fields) => {
  const headers = fields.map(field => field.label).join(',');
  const rows = data.map(row => 
    fields.map(field => {
      const value = row[field.name];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) return `"${value}"`;
      return value;
    }).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleColumnCommand = (command) => {
  switch (command) {
    case 'reset':
      // 重置列设置
      break;
    case 'customize':
      ElMessage.info('自定义列功能开发中...');
      break;
    case 'export':
      // 导出列配置
      break;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
};

const formatNumber = (num) => {
  return typeof num === 'number' ? num.toLocaleString() : num;
};

// 监听器
watch(() => selectedModel.value, (newModel) => {
  if (newModel) {
    filters.value = {};
    searchQuery.value = '';
    selectedRows.value = [];
  }
});

// 初始化
onMounted(() => {
  fetchModels();
});
</script>

<style scoped>
.data-management {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  margin: -2rem -2rem 2rem -2rem;
  border-radius: 0 0 1rem 1rem;
}

.model-card {
  background: white;
  transition: all 0.3s ease;
  border: 2px solid #e5e7eb;
}

.model-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.filter-panel {
  max-height: 400px;
  overflow-y: auto;
}

.batch-actions {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #3b82f6;
}

.data-table {
  font-size: 14px;
}

.cell-content {
  line-height: 1.4;
}

.table-actions .el-button {
  margin-right: 4px;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

:deep(.el-table) {
  --el-table-border-color: #e5e7eb;
  --el-table-header-bg-color: #f8fafc;
}

:deep(.el-breadcrumb__inner) {
  color: rgba(255, 255, 255, 0.8);
}

:deep(.el-breadcrumb__inner.is-link) {
  color: white;
}

:deep(.el-breadcrumb__inner a:hover) {
  color: white;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1rem;
    margin: -1rem -1rem 1rem -1rem;
  }
  
  .page-header .flex {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .grid-cols-1.md\:grid-cols-2.lg\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
}
</style>