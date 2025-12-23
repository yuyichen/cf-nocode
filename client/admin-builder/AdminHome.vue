<template>
  <div class="admin-builder p-4 bg-gray-100 min-h-screen">
    <!-- Model Management Section -->
    <el-card class="mb-6">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-bold">Data Model Builder</span>
          <div class="flex gap-2">
            <el-button type="primary" @click="showCreateModel = true">
              <i class="i-carbon-add mr-1"></i> Create Model
            </el-button>
            <el-button @click="fetchModels">
              <i class="i-carbon-renew mr-1"></i> Refresh
            </el-button>
          </div>
        </div>
      </template>
      
      <el-table :data="models" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="name" label="Model Name" width="180">
          <template #default="scope">
            <div class="font-mono text-sm">{{ scope.row.name }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="label" label="Display Label" />
        <el-table-column prop="fields" label="Fields" width="120">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.fields?.length || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="Created" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="Actions" width="280">
          <template #default="scope">
            <div class="flex gap-1">
              <el-button size="small" @click="editModel(scope.row)">
                <i class="i-carbon-edit mr-1"></i> Edit
              </el-button>
              <el-button size="small" type="success" @click="designModel(scope.row)">
                <i class="i-carbon-code mr-1"></i> Design
              </el-button>
              <el-button size="small" type="warning" @click="createTable(scope.row)">
                <i class="i-carbon-sql mr-1"></i> Create Table
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
          <span class="text-lg font-bold">Model Designer: {{ editingModel.label }}</span>
          <div class="flex gap-2">
            <el-button type="primary" @click="addField">
              <i class="i-carbon-add mr-1"></i> Add Field
            </el-button>
            <el-button type="success" @click="saveModelFields">
              <i class="i-carbon-save mr-1"></i> Save Fields
            </el-button>
            <el-button @click="editingModel = null">
              <i class="i-carbon-close mr-1"></i> Close
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
            <p class="text-gray-500">No fields defined. Add your first field to start building the model.</p>
          </div>
        </div>

        <!-- SQL Preview -->
        <div class="lg:col-span-1">
          <div class="sticky top-4">
            <el-card>
              <template #header>
                <span class="font-bold">SQL Preview</span>
              </template>
              <div class="font-mono text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-[400px]">
                <pre>{{ generateSQLPreview() }}</pre>
              </div>
              <div class="mt-4 text-xs text-gray-500">
                <div class="flex items-center gap-2 mb-2">
                  <i class="i-carbon-information"></i>
                  <span>This SQL will be executed when you click "Create Table"</span>
                </div>
              </div>
            </el-card>

            <!-- Quick Actions -->
            <el-card class="mt-4">
              <template #header>
                <span class="font-bold">Quick Actions</span>
              </template>
              <div class="grid grid-cols-2 gap-2">
                <el-button type="primary" @click="createTable(editingModel)" :loading="creatingTable">
                  <i class="i-carbon-sql mr-1"></i> Create Table
                </el-button>
                <el-button @click="generateAPIDocs">
                  <i class="i-carbon-document mr-1"></i> API Docs
                </el-button>
                <el-button @click="exportModel">
                  <i class="i-carbon-export mr-1"></i> Export
                </el-button>
                <el-button @click="testModelAPI">
                  <i class="i-carbon-test-tool mr-1"></i> Test API
                </el-button>
              </div>
            </el-card>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Create Model Dialog -->
    <el-dialog v-model="showCreateModel" title="Create New Model" width="500px">
      <el-form :model="newModel" label-width="100px">
        <el-form-item label="Model Name" required>
          <el-input v-model="newModel.name" placeholder="e.g. users" @input="validateModelName" />
          <div class="text-xs text-gray-500 mt-1">Lowercase, letters, numbers, and underscores only</div>
        </el-form-item>
        <el-form-item label="Display Label" required>
          <el-input v-model="newModel.label" placeholder="e.g. User Data" />
        </el-form-item>
        <el-form-item label="Description">
          <el-input v-model="newModel.description" type="textarea" :rows="2" placeholder="Optional description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModel = false">Cancel</el-button>
        <el-button type="primary" @click="createModel" :loading="creatingModel">Create</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ModelFieldConfig from './components/ModelFieldConfig.vue';

const API_BASE = 'http://localhost:8787';

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

// Fetch all models
const fetchModels = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE}/api/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    models.value = await response.json();
  } catch (error) {
    console.error('Error fetching models:', error);
    ElMessage.error('Failed to load models');
  } finally {
    loading.value = false;
  }
};

// Create new model
const createModel = async () => {
  if (!newModel.value.name || !newModel.value.label) {
    return ElMessage.error('Name and label are required');
  }

  try {
    creatingModel.value = true;
    const response = await fetch(`${API_BASE}/api/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newModel.value)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create model');
    }

    const model = await response.json();
    models.value.unshift(model);
    showCreateModel.value = false;
    newModel.value = { name: '', label: '', description: '' };
    ElMessage.success('Model created successfully');
    
    // Open the new model for editing
    editModel(model);
  } catch (error) {
    console.error('Error creating model:', error);
    ElMessage.error(error.message);
  } finally {
    creatingModel.value = false;
  }
};

// Edit model (load with fields)
const editModel = async (model) => {
  try {
    const response = await fetch(`${API_BASE}/api/models/${model.id}`);
    if (!response.ok) throw new Error('Failed to load model details');
    
    const modelWithFields = await response.json();
    editingModel.value = {
      ...modelWithFields,
      fields: modelWithFields.fields || []
    };
  } catch (error) {
    console.error('Error loading model:', error);
    ElMessage.error('Failed to load model details');
  }
};

// Design model (simple edit)
const designModel = (model) => {
  editingModel.value = {
    ...model,
    fields: model.fields || []
  };
};

// Add new field
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

// Remove field
const removeField = (index) => {
  editingModel.value.fields.splice(index, 1);
};

// Update field
const updateField = (index, field) => {
  editingModel.value.fields[index] = field;
};

// Save model fields
const saveModelFields = async () => {
  if (!editingModel.value) return;

  try {
    // Save each field
    for (const field of editingModel.value.fields) {
      if (field.id) {
        // Update existing field
        await fetch(`${API_BASE}/api/fields/${field.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(field)
        });
      } else {
        // Create new field
        const response = await fetch(`${API_BASE}/api/models/${editingModel.value.id}/fields`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(field)
        });
        
        if (response.ok) {
          const newField = await response.json();
          field.id = newField.id;
        }
      }
    }

    ElMessage.success('Fields saved successfully');
    fetchModels(); // Refresh model list
  } catch (error) {
    console.error('Error saving fields:', error);
    ElMessage.error('Failed to save fields');
  }
};

// Create dynamic table
const createTable = async (model) => {
  try {
    creatingTable.value = true;
    const response = await fetch(`${API_BASE}/api/tables/${model.id}/create`, {
      method: 'POST'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create table');
    }

    const result = await response.json();
    ElMessage.success(result.message);
    
    // Show SQL in console for debugging
    console.log('Generated SQL:', result.sql);
  } catch (error) {
    console.error('Error creating table:', error);
    ElMessage.error(error.message);
  } finally {
    creatingTable.value = false;
  }
};

// Delete model
const deleteModel = async (model) => {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete model "${model.label}"? This will also delete all associated fields.`,
      'Confirm Delete',
      { type: 'warning' }
    );

    const response = await fetch(`${API_BASE}/api/models/${model.id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete model');
    }

    models.value = models.value.filter(m => m.id !== model.id);
    if (editingModel.value?.id === model.id) {
      editingModel.value = null;
    }
    
    ElMessage.success('Model deleted successfully');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Error deleting model:', error);
      ElMessage.error(error.message || 'Failed to delete model');
    }
  }
};

// Generate SQL preview
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

// Helper functions
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
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const generateAPIDocs = () => {
  if (!editingModel.value) return;
  
  const apiDocs = `
## API Endpoints for ${editingModel.value.label}

### REST API
- GET    /api/data/${editingModel.value.name} - List records
- GET    /api/data/${editingModel.value.name}/:id - Get single record
- POST   /api/data/${editingModel.value.name} - Create record
- PUT    /api/data/${editingModel.value.name}/:id - Update record
- DELETE /api/data/${editingModel.value.name}/:id - Delete record

### Query Parameters
- page: Page number (default: 1)
- pageSize: Items per page (default: 20)
- sortBy: Field to sort by (default: created_at)
- sortOrder: asc or desc (default: desc)
- Any field name: Filter by field value
  `;
  
  console.log('API Documentation:', apiDocs);
  ElMessage.info('API documentation generated in console');
};

const exportModel = () => {
  if (!editingModel.value) return;
  
  const modelData = {
    model: editingModel.value,
    sql: generateSQLPreview(),
    timestamp: new Date().toISOString()
  };
  
  const dataStr = JSON.stringify(modelData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${editingModel.value.name}_model.json`;
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  ElMessage.success('Model exported successfully');
};

const testModelAPI = async () => {
  if (!editingModel.value) return;
  
  try {
    const response = await fetch(`${API_BASE}/api/data/${editingModel.value.name}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Test API Response:', data);
      ElMessage.success(`API test successful. Found ${data.data?.length || 0} records.`);
    } else {
      ElMessage.warning('Table may not exist yet. Create the table first.');
    }
  } catch (error) {
    console.error('API test error:', error);
    ElMessage.error('API test failed. Table may not exist.');
  }
};

// Initialize
onMounted(() => {
  fetchModels();
});
</script>

<style scoped>
.field-item {
  transition: all 0.2s ease;
}

.field-item:hover {
  transform: translateY(-2px);
}

.admin-builder {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

:deep(.el-table) {
  --el-table-border-color: #e5e7eb;
}

:deep(.el-button) {
  font-weight: 500;
}
</style>
