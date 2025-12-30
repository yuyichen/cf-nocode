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
          <el-button @click="fetchModels">
            <i class="i-carbon-renew mr-1"></i>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- Model Management Section -->
    <el-card class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-bold">数据模型列表</span>
          <div class="flex gap-2">
            <el-button type="primary" @click="showCreateModel = true">
              <i class="i-carbon-add mr-1"></i>
              新建模型
            </el-button>
            <el-button @click="fetchModels">
              <i class="i-carbon-renew mr-1"></i>
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="models" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="模型名称" width="180">
          <template #default="scope">
            <div class="font-mono text-sm">{{ scope.row.name }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="label" label="显示名称" />
        <el-table-column prop="fields" label="字段数" width="120">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.fields?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template #default="scope">
            <div class="flex gap-1">
              <el-button size="small" @click="editModel(scope.row)">
                <i class="i-carbon-edit mr-1"></i>
                编辑
              </el-button>
              <el-button size="small" type="success" @click="designModel(scope.row)">
                <i class="i-carbon-code mr-1"></i>
                设计
              </el-button>
              <el-button size="small" type="warning" @click="createTable(scope.row)">
                <i class="i-carbon-sql mr-1"></i>
                创建表
              </el-button>
              <el-button size="small" type="danger" @click="deleteModel(scope.row)">
                <i class="i-carbon-trash-can mr-1"></i>
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Model Designer Section -->
    <el-card v-if="editingModel" class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-bold">模型设计器: {{ editingModel.label }}</span>
          <div class="flex gap-2">
            <el-button type="primary" @click="addField">
              <i class="i-carbon-add mr-1"></i>
              添加字段
            </el-button>
            <el-button type="success" @click="saveModelFields">
              <i class="i-carbon-save mr-1"></i>
              保存字段
            </el-button>
            <el-button @click="editingModel = null">
              <i class="i-carbon-close mr-1"></i>
              关闭
            </el-button>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Fields List -->
        <div class="space-y-4">
          <div v-for="(field, index) in editingModel.fields" :key="field.id || index" class="field-item">
            <ModelFieldConfig
              :field="field"
              :available-models="models"
              @remove="removeField(index)"
              @update:field="updateField(index, $event)"
            />
          </div>
          
          <div v-if="!editingModel.fields || editingModel.fields.length === 0" class="text-center p-8 border-2 border-dashed rounded-lg">
            <i class="i-carbon-data-table text-4xl text-gray-400 mb-2"></i>
            <p class="text-gray-500">未定义字段。添加第一个字段开始构建模型。</p>
          </div>
        </div>

        <!-- SQL Preview -->
        <div class="lg:col-span-1">
          <div class="sticky top-4">
            <el-card>
              <template #header>
                <span class="font-bold">SQL 预览</span>
              </template>
              <div class="font-mono text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-[400px]">
                <pre>{{ generateSQLPreview() }}</pre>
              </div>
              <div class="mt-4 text-xs text-gray-500">
                <div class="flex items-center gap-2 mb-2">
                  <i class="i-carbon-information"></i>
                  <span>点击"创建表"时将执行此 SQL</span>
                </div>
              </div>
            </el-card>

            <!-- Quick Actions -->
            <el-card class="mt-4">
              <template #header>
                <span class="font-bold">快速操作</span>
              </template>
              <div class="grid grid-cols-2 gap-2">
                <el-button type="primary" @click="createTable(editingModel)" :loading="creatingTable">
                  <i class="i-carbon-sql mr-1"></i>
                  创建表
                </el-button>
                <el-button @click="generateAPIDocs">
                  <i class="i-carbon-document mr-1"></i>
                  API 文档
                </el-button>
                <el-button @click="exportModel">
                  <i class="i-carbon-export mr-1"></i>
                  导出
                </el-button>
                <el-button @click="testModelAPI">
                  <i class="i-carbon-test-tool mr-1"></i>
                  测试 API
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Create Model Dialog -->
    <el-dialog v-model="showCreateModel" title="创建新模型" width="500px">
      <el-form :model="newModel" label-width="100px">
        <el-form-item label="模型名称" required>
          <el-input v-model="newModel.name" placeholder="例如: users" @input="validateModelName" />
          <div class="text-xs text-gray-500 mt-1">小写字母、数字和下划线</div>
        </el-form-item>
        <el-form-item label="显示名称" required>
          <el-input v-model="newModel.label" placeholder="例如: 用户数据" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newModel.description" type="textarea" :rows="2" placeholder="可选描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModel = false">取消</el-button>
        <el-button type="primary" @click="createModel" :loading="creatingModel">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '../../store';
import ModelFieldConfig from '../../components/ModelFieldConfig.vue';

const authStore = useAuthStore();

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const models = ref([]);
const loading = ref(false);
const showCreateModel = ref(false);
const editingModel = ref(null);
const creatingModel = ref(false);
const creatingTable = ref(false);

const newModel = ref({
  name: '',
  label: '',
  description: ''
});

// 获取请求头
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  const token = authStore.token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// 获取所有模型
const fetchModels = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error('获取模型列表失败');
    }
    
    models.value = await response.json();
    ElMessage.success(`成功加载 ${models.value.length} 个模型`);
  } catch (error) {
    console.error('获取模型列表失败:', error);
    ElMessage.error('获取模型列表失败');
  } finally {
    loading.value = false;
  }
};

// 创建新模型
const createModel = async () => {
  if (!newModel.value.name || !newModel.value.label) {
    return ElMessage.error('模型名称和显示名称是必填项');
  }

  try {
    creatingModel.value = true;
    const response = await fetch(`${API_BASE_URL}/api/models`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(newModel.value)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建模型失败');
    }

    const model = await response.json();
    models.value.unshift(model);
    showCreateModel.value = false;
    newModel.value = { name: '', label: '', description: '' };
    ElMessage.success('模型创建成功');
    
    // 打开新模型进行编辑
    editModel(model);
  } catch (error) {
    console.error('创建模型失败:', error);
    ElMessage.error(error.message);
  } finally {
    creatingModel.value = false;
  }
};

// 编辑模型（加载字段）
const editModel = async (model) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/models/${model.id}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) throw new Error('加载模型详情失败');
    
    const modelWithFields = await response.json();
    editingModel.value = {
      ...modelWithFields,
      fields: modelWithFields.fields || []
    };
  } catch (error) {
    console.error('加载模型失败:', error);
    ElMessage.error('加载模型详情失败');
  }
};

// 设计模型（简单编辑）
const designModel = (model) => {
  editingModel.value = {
    ...model,
    fields: model.fields || []
  };
};

// 添加新字段
const addField = () => {
  if (!editingModel.value.fields) {
    editingModel.value.fields = [];
  }
  
  editingModel.value.fields.push({
    id: '',
    name: '',
    label: '',
    type: 'text',
    required: false,
    unique_key: false,
    default_value: '',
    validation_rules: ''
  });
};

// 删除字段
const removeField = (index) => {
  editingModel.value.fields.splice(index, 1);
};

// 更新字段
const updateField = (index, field) => {
  editingModel.value.fields[index] = field;
};

// 保存模型字段
const saveModelFields = async () => {
  if (!editingModel.value) return;

  try {
    // 保存每个字段
    for (const field of editingModel.value.fields) {
      if (field.id) {
        // 更新现有字段
        await fetch(`${API_BASE_URL}/api/fields/${field.id}`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify(field)
        });
      } else {
        // 创建新字段
        const response = await fetch(`${API_BASE_URL}/api/models/${editingModel.value.id}/fields`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify(field)
        });
        
        if (response.ok) {
          const newField = await response.json();
          field.id = newField.id;
        }
      }
    }

    ElMessage.success('字段保存成功');
    fetchModels(); // 刷新模型列表
  } catch (error) {
    console.error('保存字段失败:', error);
    ElMessage.error('保存字段失败');
  }
};

// 创建动态表
const createTable = async (model) => {
  try {
    creatingTable.value = true;
    const response = await fetch(`${API_BASE_URL}/api/tables/${model.id}/create`, {
      method: 'POST',
      headers: getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '创建表失败');
    }

    const result = await response.json();
    ElMessage.success(result.message);
    
    // 在控制台显示 SQL 用于调试
    console.log('生成的 SQL:', result.sql);
  } catch (error) {
    console.error('创建表失败:', error);
    ElMessage.error(error.message);
  } finally {
    creatingTable.value = false;
  }
};

// 删除模型
const deleteModel = async (model) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模型 "${model.label}" 吗？这将同时删除所有关联字段。`,
      '确认删除',
      { type: 'warning' }
    );

    const response = await fetch(`${API_BASE_URL}/api/models/${model.id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '删除模型失败');
    }

    models.value = models.value.filter(m => m.id !== model.id);
    if (editingModel.value?.id === model.id) {
      editingModel.value = null;
    }
    
    ElMessage.success('模型删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除模型失败:', error);
      ElMessage.error(error.message || '删除模型失败');
    }
  }
};

// 生成 SQL 预览
const generateSQLPreview = () => {
  if (!editingModel.value || !editingModel.value.fields) return '';

  const columns = [
    'id TEXT PRIMARY KEY',
    'created_at DATETIME DEFAULT CURRENT_TIMESTAMP',
    'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP'
  ];

  editingModel.value.fields.forEach(field => {
    let columnDef = `${field.name} ${getDatabaseType(field.type)}`;
    
    if (field.required) columnDef += ' NOT NULL';
    if (field.unique_key) columnDef += ' UNIQUE';
    if (field.default_value !== undefined && field.default_value !== '') {
      columnDef += ` DEFAULT '${field.default_value}'`;
    }

    columns.push(columnDef);
  });

  return `CREATE TABLE IF NOT EXISTS ${editingModel.value.name} (\n  ${columns.join(',\n  ')}\n);`;
};

// 辅助函数
const getDatabaseType = (type) => {
  const typeMap = {
    text: 'TEXT',
    number: 'REAL',
    boolean: 'INTEGER',
    date: 'DATE',
    datetime: 'DATETIME',
    relation: 'TEXT'
  };
  return typeMap[type] || 'TEXT';
};

const validateModelName = () => {
  if (newModel.value.name) {
    newModel.value.name = newModel.value.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

const generateAPIDocs = () => {
  if (!editingModel.value) return;
  
  const apiDocs = `
## ${editingModel.value.label} API 接口

### REST API
- GET    /api/data/${editingModel.value.name} - 获取记录列表
- GET    /api/data/${editingModel.value.name}/:id - 获取单条记录
- POST   /api/data/${editingModel.value.name} - 创建记录
- PUT    /api/data/${editingModel.value.name}/:id - 更新记录
- DELETE /api/data/${editingModel.value.name}/:id - 删除记录

### 查询参数
- page: 页码 (默认: 1)
- pageSize: 每页数量 (默认: 20)
- sortBy: 排序字段 (默认: created_at)
- sortOrder: 排序顺序 asc 或 desc (默认: desc)
- 任何字段名: 按字段值过滤
  `;
  
  console.log('API 文档:', apiDocs);
  ElMessage.info('API 文档已在控制台生成');
};

const exportModel = () => {
  if (!editingModel.value) return;
  
  const modelData = {
    model: editingModel.value,
    sql: generateSQLPreview(),
    timestamp: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(modelData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${editingModel.value.name}_model.json`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  ElMessage.success('模型导出成功');
};

const testModelAPI = async () => {
  if (!editingModel.value) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/data/${editingModel.value.name}`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('测试 API 响应:', data);
      ElMessage.success(`API 测试成功。找到 ${data.data?.length || 0} 条记录。`);
    } else {
      ElMessage.warning('表可能尚未存在。请先创建表。');
    }
  } catch (error) {
    console.error('API 测试错误:', error);
    ElMessage.error('API 测试失败。表可能尚未存在。');
  }
};

// 初始化
onMounted(() => {
  fetchModels();
});
</script>