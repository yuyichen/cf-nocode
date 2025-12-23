<template>
  <div class="ui-designer h-screen flex">
    <!-- Component Sidebar -->
    <div class="w-64 bg-white border-r p-4 shadow-sm z-10">
      <h3 class="font-bold mb-4 text-gray-700">Components</h3>
      <div class="grid grid-cols-2 gap-2">
        <div 
          v-for="comp in components" 
          :key="comp.type"
          class="p-2 border rounded cursor-move hover:bg-indigo-50 hover:border-indigo-300 transition-all text-sm text-center bg-gray-50"
          draggable="true"
          @dragstart="onDragStart(comp)"
        >
          {{ comp.label }}
        </div>
      </div>
    </div>

    <!-- Design Canvas -->
    <div 
      class="flex-1 bg-gray-100 p-8 overflow-auto"
      @dragover.prevent
      @drop="onDrop"
    >
      <div class="canvas-wrapper mx-auto bg-white shadow-xl min-h-full transition-all duration-300" :class="deviceClass">
        <div class="p-6">
          <div v-if="pageSchema.length === 0" class="h-64 flex items-center justify-center border-2 border-dashed rounded text-gray-400">
            Drop components here
          </div>
          <div v-for="(item, index) in pageSchema" :key="index" class="mb-4 group relative">
            <div class="absolute -right-8 top-0 hidden group-hover:flex flex-col gap-1">
              <el-button size="small" icon="Delete" circle @click="removeComponent(index)" />
            </div>
            
            <!-- Dynamic Component Rendering -->
            <el-input v-if="item.type === 'input'" v-model="item.value" :placeholder="item.label" />
            <el-button v-if="item.type === 'button'" type="primary">{{ item.label }}</el-button>
            <el-date-picker v-if="item.type === 'date'" class="w-full" />
            <el-card v-if="item.type === 'card'" class="p-4">{{ item.label }} Content</el-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Properties Panel -->
    <div class="w-72 bg-white border-l p-4 shadow-sm flex flex-col">
      <h3 class="font-bold mb-4 text-gray-700">Page Settings</h3>
      <el-form label-position="top">
        <el-form-item label="Page Name">
          <el-input v-model="pageName" placeholder="e.g. Home Page" />
        </el-form-item>
        <el-form-item label="Page Path">
          <el-input v-model="pagePath" placeholder="e.g. /home" />
        </el-form-item>
        <el-form-item label="Device View">
          <el-radio-group v-model="deviceType" size="small" class="w-full">
            <el-radio-button label="pc">Desktop</el-radio-button>
            <el-radio-button label="mobile">Mobile</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="w-full" @click="savePage">Save Page</el-button>
        </el-form-item>
      </el-form>
      
      <el-divider v-if="selectedComponent" />
      
      <div v-if="selectedComponent" class="space-y-4">
        <h3 class="font-bold mb-2 text-gray-700">Component Settings</h3>
        <el-form label-position="top">
          <el-form-item label="Label Text">
            <el-input v-model="selectedComponent.label" />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { ElMessage } from 'element-plus';

const components = [
  { type: 'input', label: 'Input Field' },
  { type: 'button', label: 'Button' },
  { type: 'date', label: 'Date Picker' },
  { type: 'card', label: 'Card Container' },
];

const pageName = ref('');
const pagePath = ref('');
const pageSchema = ref<any[]>([]);
const deviceType = ref('pc');
const draggedItem = ref<any>(null);
const selectedComponent = ref<any>(null);

const deviceClass = computed(() => {
  return deviceType.value === 'mobile' ? 'max-w-[375px] border-x-8 border-t-16 border-b-16 border-gray-800 rounded-[40px]' : 'w-full';
});

const onDragStart = (comp: any) => {
  draggedItem.value = comp;
};

const onDrop = () => {
  if (draggedItem.value) {
    const newItem = { ...draggedItem.value, id: Date.now(), value: '' };
    pageSchema.value.push(newItem);
    selectedComponent.value = newItem;
    draggedItem.value = null;
  }
};

const removeComponent = (index: number) => {
  pageSchema.value.splice(index, 1);
  selectedComponent.value = null;
};

const savePage = async () => {
  if (!pageName.value || !pagePath.value) {
    ElMessage.warning('Please enter a Page Name and Path');
    return;
  }

  const payload = {
    id: crypto.randomUUID(),
    name: pageName.value,
    path: pagePath.value,
    config: JSON.stringify(pageSchema.value),
    device_type: deviceType.value,
  };

  try {
    const response = await fetch('http://localhost:8787/api/data/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save page');
    }

    ElMessage.success('Page saved successfully!');
  } catch (error: any) {
    console.error(error);
    ElMessage.error(error.message || 'Error saving page');
  }
};
</script>

<style scoped>
.canvas-wrapper {
  min-height: 800px;
}
</style>
