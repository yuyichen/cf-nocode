<template>
  <div class="file-uploader">
    <el-card>
      <template #header>
        <div class="flex justify-between items-center">
          <span class="text-lg font-bold">文件管理</span>
          <div class="flex gap-2">
            <el-button type="primary" @click="triggerFileUpload">
              <i class="i-carbon-upload mr-1"></i>
              上传文件
            </el-button>
            <el-button @click="refreshFiles">
              <i class="i-carbon-renew mr-1"></i>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- Upload Area -->
      <div 
        class="upload-area mb-6 p-8 border-2 border-dashed rounded-lg text-center cursor-pointer hover:border-blue-400 transition-colors"
        :class="{ 'border-blue-500 bg-blue-50': isDragging }"
        @click="triggerFileUpload"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <input 
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="handleFileSelect"
        />
        
        <i class="i-carbon-cloud-upload text-4xl text-gray-400 mb-2"></i>
        <p class="text-gray-600 mb-2">拖拽文件到此处或点击选择文件</p>
        <p class="text-sm text-gray-400">支持多文件上传，最大 100MB</p>
      </div>

      <!-- Upload Options -->
      <div class="upload-options mb-4 p-4 bg-gray-50 rounded-lg">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-checkbox v-model="uploadOptions.isPublic">公开文件</el-checkbox>
          </el-col>
          <el-col :span="8">
            <el-select v-model="uploadOptions.allowedType" placeholder="文件类型过滤" clearable>
              <el-option label="所有类型" value="" />
              <el-option label="图片" value="image" />
              <el-option label="文档" value="document" />
              <el-option label="视频" value="video" />
              <el-option label="音频" value="audio" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input v-model="uploadOptions.tags" placeholder="标签 (用逗号分隔)" />
          </el-col>
        </el-row>
      </div>

      <!-- Upload Progress -->
      <div v-if="uploadQueue.length > 0" class="upload-queue mb-6">
        <h3 class="text-sm font-semibold mb-3">上传队列</h3>
        <div class="space-y-2">
          <div 
            v-for="upload in uploadQueue" 
            :key="upload.id"
            class="upload-item p-3 bg-white border rounded-lg"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center flex-1">
                <i class="i-carbon-document text-xl mr-3 text-blue-500"></i>
                <div>
                  <p class="font-medium text-sm">{{ upload.file.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatFileSize(upload.file.size) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <el-progress 
                  :percentage="upload.progress" 
                  :status="upload.status"
                  :show-text="false"
                  class="w-24"
                />
                <span class="text-sm text-gray-500 w-12">{{ upload.progress }}%</span>
                <el-button 
                  v-if="upload.status === 'exception'"
                  type="text" 
                  size="small"
                  @click="retryUpload(upload)"
                >
                  重试
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- File List -->
      <div class="file-list">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">文件列表</h3>
          <div class="flex gap-2 items-center">
            <el-input 
              v-model="searchQuery" 
              placeholder="搜索文件..." 
              class="w-48"
              clearable
              @clear="refreshFiles"
              @input="debounceSearch"
            >
              <template #prefix>
                <i class="i-carbon-search"></i>
              </template>
            </el-input>
            <el-select v-model="filterType" placeholder="类型筛选" clearable class="w-32">
              <el-option label="所有类型" value="" />
              <el-option label="图片" value="image" />
              <el-option label="视频" value="video" />
              <el-option label="文档" value="document" />
            </el-select>
          </div>
        </div>

        <el-table :data="filteredFiles" v-loading="loading" stripe>
          <el-table-column width="60">
            <template #default="{ row }">
              <div class="file-icon">
                <i :class="getFileIcon(row.mimeType)" class="text-2xl"></i>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="originalName" label="文件名">
            <template #default="{ row }">
              <div class="file-name">
                <p class="font-medium">{{ row.originalName }}</p>
                <p class="text-xs text-gray-500">{{ formatFileSize(row.size) }}</p>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="mimeType" label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getFileType(row.mimeType) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="可见性" width="100">
            <template #default="{ row }">
              <el-tag :type="row.isPublic ? 'success' : 'warning'" size="small">
                {{ row.isPublic ? '公开' : '私有' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="uploadedAt" label="上传时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.uploadedAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <div class="flex gap-1">
                <el-button size="small" @click="downloadFile(row)">
                  <i class="i-carbon-download mr-1"></i>
                  下载
                </el-button>
                <el-button size="small" @click="copyFileUrl(row)">
                  <i class="i-carbon-link mr-1"></i>
                  复制链接
                </el-button>
                <el-button size="small" type="danger" @click="deleteFile(row)">
                  <i class="i-carbon-trash-can mr-1"></i>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div class="flex justify-center mt-4" v-if="total > pageSize">
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
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const API_BASE_URL = import.meta.env.VITE_STORAGE_URL || 'http://localhost:8789';
const STORAGE_API_URL = import.meta.env.VITE_STORAGE_API_URL || 'http://localhost:8789';

const files = ref([]);
const loading = ref(false);
const isDragging = ref(false);
const uploadQueue = ref([]);
const searchQuery = ref('');
const filterType = ref('');
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const fileInput = ref(null);

const uploadOptions = ref({
  isPublic: false,
  allowedType: '',
  tags: ''
});

const filteredFiles = computed(() => {
  let result = files.value;
  
  if (searchQuery.value) {
    result = result.filter(file => 
      file.originalName.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  
  if (filterType.value) {
    result = result.filter(file => 
      getFileType(file.mimeType).toLowerCase().includes(filterType.value.toLowerCase())
    );
  }
  
  return result;
});

const fetchFiles = async () => {
  try {
    loading.value = true;
    const response = await fetch(`${STORAGE_API_URL}/files?page=${currentPage.value}&pageSize=${pageSize.value}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    
    const result = await response.json();
    if (result.success) {
      files.value = result.files || [];
      total.value = result.total || 0;
    }
  } catch (error) {
    console.error('Error fetching files:', error);
    ElMessage.error('获取文件列表失败');
  } finally {
    loading.value = false;
  }
};

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files);
  uploadFiles(selectedFiles);
  event.target.value = '';
};

const handleDrop = (event) => {
  isDragging.value = false;
  const droppedFiles = Array.from(event.dataTransfer.files);
  uploadFiles(droppedFiles);
};

const uploadFiles = (fileList) => {
  const allowedTypes = getAllowedTypes(uploadOptions.value.allowedType);
  
  fileList.forEach(file => {
    if (allowedTypes.length > 0 && !allowedTypes.some(type => file.type.includes(type))) {
      ElMessage.warning(`文件 ${file.name} 类型不支持`);
      return;
    }
    
    const uploadItem = {
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: 'uploading',
      error: null
    };
    
    uploadQueue.value.push(uploadItem);
    uploadFile(uploadItem);
  });
};

const uploadFile = async (uploadItem) => {
  try {
    const formData = new FormData();
    formData.append('file', uploadItem.file);
    formData.append('options', JSON.stringify({
      isPublic: uploadOptions.value.isPublic,
      tags: uploadOptions.value.tags ? uploadOptions.value.tags.split(',').reduce((obj, tag) => {
        const trimmed = tag.trim();
        if (trimmed) obj[trimmed] = trimmed;
        return obj;
      }, {}) : {}
    }));

    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        uploadItem.progress = Math.round((event.loaded / event.total) * 100);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        uploadItem.progress = 100;
        uploadItem.status = 'success';
        setTimeout(() => {
          const index = uploadQueue.value.findIndex(item => item.id === uploadItem.id);
          if (index > -1) uploadQueue.value.splice(index, 1);
        }, 2000);
        refreshFiles();
      } else {
        uploadItem.status = 'exception';
        uploadItem.error = 'Upload failed';
      }
    });

    xhr.addEventListener('error', () => {
      uploadItem.status = 'exception';
      uploadItem.error = 'Network error';
    });

    xhr.open('POST', `${STORAGE_API_URL}/upload`);
    xhr.send(formData);
  } catch (error) {
    uploadItem.status = 'exception';
    uploadItem.error = error.message;
  }
};

const retryUpload = (uploadItem) => {
  uploadItem.progress = 0;
  uploadItem.status = 'uploading';
  uploadItem.error = null;
  uploadFile(uploadItem);
};

const downloadFile = async (file) => {
  try {
    const response = await fetch(`${STORAGE_API_URL}/file/${file.id}`);
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    ElMessage.error('下载失败');
  }
};

const copyFileUrl = async (file) => {
  try {
    const response = await fetch(`${STORAGE_API_URL}/url/${file.id}`);
    const result = await response.json();
    
    if (result.success) {
      await navigator.clipboard.writeText(result.url);
      ElMessage.success('链接已复制到剪贴板');
    }
  } catch (error) {
    ElMessage.error('复制链接失败');
  }
};

const deleteFile = async (file) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.originalName}" 吗？`,
      '确认删除',
      { type: 'warning' }
    );
    
    const response = await fetch(`${STORAGE_API_URL}/files/${file.id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      ElMessage.success('删除成功');
      refreshFiles();
    } else {
      throw new Error('Delete failed');
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const refreshFiles = () => {
  fetchFiles();
};

const debounceSearch = (() => {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(refreshFiles, 500);
  };
})();

const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchFiles();
};

const handlePageChange = (page) => {
  currentPage.value = page;
  fetchFiles();
};

const getFileIcon = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'i-carbon-image text-green-500';
  if (mimeType.startsWith('video/')) return 'i-carbon-video-filled text-blue-500';
  if (mimeType.startsWith('audio/')) return 'i-carbon-volume-up-filled text-purple-500';
  if (mimeType.includes('pdf')) return 'i-carbon-document-text text-red-500';
  if (mimeType.includes('word')) return 'i-carbon-document text-blue-500';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'i-carbon-table text-green-500';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'i-carbon-presentation text-orange-500';
  return 'i-carbon-document text-gray-500';
};

const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return '图片';
  if (mimeType.startsWith('video/')) return '视频';
  if (mimeType.startsWith('audio/')) return '音频';
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint')) return '文档';
  return '其他';
};

const getAllowedTypes = (type) => {
  const types = {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/webm', 'video/ogg'],
    audio: ['audio/mp3', 'audio/wav', 'audio/ogg'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  return types[type] || [];
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN');
};

onMounted(() => {
  fetchFiles();
});
</script>

<style scoped>
.file-uploader {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.upload-area {
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #3b82f6;
  background-color: #f0f9ff;
}

.upload-item {
  transition: all 0.2s ease;
}

.upload-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-name {
  line-height: 1.2;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

:deep(.el-table) {
  --el-table-border-color: #e5e7eb;
}

:deep(.el-upload-dragger) {
  border: 2px dashed #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: 0.2s;
}

:deep(.el-upload-dragger:hover) {
  border-color: #3b82f6;
}
</style>