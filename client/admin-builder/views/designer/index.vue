<template>
  <div class="ui-designer h-screen flex">
    <!-- Component Sidebar -->
    <div class="w-64 bg-white border-r p-4 shadow-sm z-10">
      <h3 class="font-bold mb-4 text-gray-700">组件库</h3>
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
            拖拽组件到这里开始设计
          </div>
          <div v-for="(item, index) in pageSchema" :key="index" class="mb-4 group relative">
            <div class="absolute -right-8 top-0 hidden group-hover:flex flex-col gap-1">
              <el-button size="small" icon="Delete" circle @click="removeComponent(index)" />
            </div>
            
            <!-- Dynamic Component Rendering -->
            <el-input v-if="item.type === 'input'" v-model="item.value" :placeholder="item.label" />
            <el-button v-if="item.type === 'button'" type="primary">{{ item.label }}</el-button>
            <el-date-picker v-if="item.type === 'date'" class="w-full" />
            <el-card v-if="item.type === 'card'" class="p-4">{{ item.label }} 内容</el-card>
          </div>
        </div>
      </div>
    </div>

    <!-- Properties Panel -->
    <div class="w-72 bg-white border-l p-4 shadow-sm flex flex-col">
      <h3 class="font-bold mb-4 text-gray-700">页面设置</h3>
      <el-form label-position="top">
        <el-form-item label="页面名称">
          <el-input v-model="pageName" placeholder="例如: 首页" />
        </el-form-item>
        <el-form-item label="页面路径">
          <el-input v-model="pagePath" placeholder="例如: /home" />
        </el-form-item>
        <el-form-item label="设备视图">
          <el-radio-group v-model="deviceType" size="small" class="w-full">
            <el-radio-button label="pc">桌面端</el-radio-button>
            <el-radio-button label="mobile">移动端</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="w-full" @click="savePage">保存页面</el-button>
        </el-form-item>
      </el-form>
      
      <el-divider v-if="selectedComponent" />
      
      <div v-if="selectedComponent" class="space-y-4">
        <h3 class="font-bold mb-2 text-gray-700">组件设置</h3>
        <el-form label-position="top">
          <el-form-item label="标签文本">
            <el-input v-model="selectedComponent.label" />
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const components = [
  { type: 'input', label: '输入框' },
  { type: 'button', label: '按钮' },
  { type: 'date', label: '日期选择器' },
  { type: 'card', label: '卡片容器' },
]

const pageName = ref('')
const pagePath = ref('')
const pageSchema = ref([])
const deviceType = ref('pc')
const draggedItem = ref(null)
const selectedComponent = ref(null)

const deviceClass = computed(() => {
  return deviceType.value === 'mobile' ? 'max-w-[375px] border-x-8 border-t-16 border-b-16 border-gray-800 rounded-[40px]' : 'w-full'
})

const onDragStart = (comp) => {
  draggedItem.value = comp
}

const onDrop = () => {
  if (draggedItem.value) {
    const newItem = { ...draggedItem.value, id: Date.now(), value: '' }
    pageSchema.value.push(newItem)
    selectedComponent.value = newItem
    draggedItem.value = null
  }
}

const removeComponent = (index) => {
  pageSchema.value.splice(index, 1)
  selectedComponent.value = null
}

const savePage = async () => {
  if (!pageName.value || !pagePath.value) {
    ElMessage.warning('请输入页面名称和路径')
    return
  }

  const payload = {
    id: crypto.randomUUID(),
    name: pageName.value,
    path: pagePath.value,
    config: JSON.stringify(pageSchema.value),
    device_type: deviceType.value,
  }

  try {
    const response = await fetch('http://localhost:8787/api/data/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '保存页面失败')
    }

    ElMessage.success('页面保存成功！')
  } catch (error) {
    console.error(error)
    ElMessage.error(error.message || '保存页面时出错')
  }
}
</script>

<style scoped>
.canvas-wrapper {
  min-height: 800px;
}
</style>
