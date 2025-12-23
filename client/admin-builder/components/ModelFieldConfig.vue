<template>
  <div class="field-config p-4 border rounded-lg bg-white shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <h4 class="font-bold text-gray-700">{{ field.label || 'New Field' }}</h4>
      <el-button size="small" type="danger" text @click="$emit('remove')">
        <i class="i-carbon-trash-can"></i>
      </el-button>
    </div>

    <el-form :model="field" label-width="100px" size="small">
      <el-form-item label="Field Name" required>
        <el-input v-model="field.name" placeholder="e.g. username" @change="validateFieldName" />
        <div class="text-xs text-gray-500 mt-1">Used in database and API</div>
      </el-form-item>

      <el-form-item label="Display Label" required>
        <el-input v-model="field.label" placeholder="e.g. Username" />
      </el-form-item>

      <el-form-item label="Field Type" required>
        <el-select v-model="field.type" class="w-full">
          <el-option label="Text" value="text" />
          <el-option label="Number" value="number" />
          <el-option label="Boolean" value="boolean" />
          <el-option label="Date" value="date" />
          <el-option label="DateTime" value="datetime" />
          <el-option label="Relation" value="relation" />
        </el-select>
      </el-form-item>

      <el-form-item label="Required">
        <el-switch v-model="field.required" />
      </el-form-item>

      <el-form-item label="Unique">
        <el-switch v-model="field.unique_key" />
      </el-form-item>

      <el-form-item v-if="field.type === 'text'" label="Default Value">
        <el-input v-model="field.default_value" placeholder="Default text value" />
      </el-form-item>

      <el-form-item v-if="field.type === 'number'" label="Default Value">
        <el-input-number v-model="field.default_value" placeholder="Default number" />
      </el-form-item>

      <el-form-item v-if="field.type === 'boolean'" label="Default Value">
        <el-switch v-model="field.default_value" />
      </el-form-item>

      <div v-if="field.type === 'relation'" class="p-3 bg-blue-50 rounded border border-blue-200 mb-4">
        <div class="text-sm font-medium text-blue-700 mb-2">Relation Settings</div>
        <el-form-item label="Related Model">
          <el-select v-model="field.relation_model" placeholder="Select related model" class="w-full">
            <el-option v-for="model in availableModels" :key="model.id" :label="model.label" :value="model.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="Relation Type">
          <el-radio-group v-model="field.relation_type">
            <el-radio label="hasOne">Has One</el-radio>
            <el-radio label="hasMany">Has Many</el-radio>
            <el-radio label="belongsTo">Belongs To</el-radio>
          </el-radio-group>
        </el-form-item>
      </div>

      <el-form-item label="Validation Rules">
        <el-input
          v-model="field.validation_rules"
          type="textarea"
          :rows="2"
          placeholder='JSON format, e.g. {"minLength": 3, "maxLength": 50}'
        />
      </el-form-item>
    </el-form>

    <div class="mt-4 pt-4 border-t text-xs text-gray-500">
      <div class="flex justify-between">
        <span>Database Type:</span>
        <span class="font-mono">{{ getDatabaseType(field.type) }}</span>
      </div>
      <div class="flex justify-between mt-1">
        <span>SQL Column:</span>
        <span class="font-mono">{{ generateSQLColumn(field) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  field: {
    type: Object,
    required: true,
    default: () => ({
      id: '',
      name: '',
      label: '',
      type: 'text',
      required: false,
      unique_key: false,
      default_value: '',
      validation_rules: '',
      relation_model: '',
      relation_type: 'belongsTo'
    })
  },
  availableModels: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:field', 'remove']);

const validateFieldName = () => {
  // Ensure field name is lowercase and uses underscores
  if (props.field.name) {
    props.field.name = props.field.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }
};

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

const generateSQLColumn = (field) => {
  let sql = `${field.name} ${getDatabaseType(field.type)}`;
  if (field.required) sql += ' NOT NULL';
  if (field.unique_key) sql += ' UNIQUE';
  if (field.default_value !== undefined && field.default_value !== '') {
    sql += ` DEFAULT '${field.default_value}'`;
  }
  return sql;
};
</script>

<style scoped>
.field-config {
  transition: all 0.2s ease;
}
.field-config:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>
