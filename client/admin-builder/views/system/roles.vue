<template>
  <div class="system-roles">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">角色权限管理</h1>
          <p class="text-gray-500 mt-1">管理系统角色和权限配置</p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="showAddRole = true">
            <i class="i-carbon-add mr-1"></i>
            添加角色
          </el-button>
          <el-button @click="refreshRoles">
            <i class="i-carbon-renew mr-1"></i>
            刷新
          </el-button>
          <el-button @click="exportRoles">
            <i class="i-carbon-download mr-1"></i>
            导出
          </el-button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 角色列表 -->
      <el-card class="lg:col-span-2" shadow="hover">
        <template #header>
          <div class="flex justify-between items-center">
            <span class="font-bold">角色列表</span>
            <el-input
              v-model="searchQuery"
              placeholder="搜索角色名称"
              style="width: 240px"
              size="small"
              clearable
            >
              <template #prefix>
                <i class="i-carbon-search"></i>
              </template>
            </el-input>
          </div>
        </template>

        <el-table
          :data="filteredRoles"
          stripe
          style="width: 100%"
          v-loading="loading"
          @row-click="selectRole"
        >
          <el-table-column prop="name" label="角色名称" width="150">
            <template #default="scope">
              <div class="flex items-center">
                <i class="i-carbon-user-certification text-blue-500 mr-2"></i>
                <div>
                  <div class="font-bold">{{ scope.row.name }}</div>
                  <div class="text-xs text-gray-500">{{ scope.row.code }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="user_count" label="用户数" width="100">
            <template #default="scope">
              <el-tag size="small" type="info">
                {{ scope.row.user_count }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="permission_count" label="权限数" width="100">
            <template #default="scope">
              <el-tag size="small" type="success">
                {{ scope.row.permission_count }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <div class="flex gap-1">
                <el-button size="small" @click.stop="editRole(scope.row)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click.stop="deleteRole(scope.row)" plain>
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 权限配置 -->
      <el-card class="permissions-card" shadow="hover">
        <template #header>
          <span class="font-bold">权限配置</span>
        </template>

        <div v-if="selectedRole" class="space-y-4">
          <div>
            <h3 class="font-bold mb-2">角色: {{ selectedRole.name }}</h3>
            <p class="text-gray-600 text-sm">{{ selectedRole.description }}</p>
          </div>

          <div>
            <h3 class="font-bold mb-2">模块权限</h3>
            <div class="space-y-3">
              <div v-for="module in modules" :key="module.id" class="module-permissions">
                <div class="flex justify-between items-center mb-1">
                  <span class="font-medium">{{ module.name }}</span>
                  <el-checkbox
                    :indeterminate="isModuleIndeterminate(module)"
                    :model-value="isModuleAllChecked(module)"
                    @change="toggleModule(module, $event)"
                  >
                    全选
                  </el-checkbox>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <el-checkbox
                    v-for="permission in module.permissions"
                    :key="permission.id"
                    :label="permission.name"
                    :model-value="isPermissionChecked(permission)"
                    @change="togglePermission(permission, $event)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t">
            <el-button type="primary" class="w-full" @click="savePermissions">
              <i class="i-carbon-save mr-2"></i>
              保存权限配置
            </el-button>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <i class="i-carbon-user-certification text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">选择一个角色进行权限配置</p>
        </div>
      </el-card>
    </div>

    <!-- 添加角色对话框 -->
    <el-dialog v-model="showAddRole" title="添加角色" width="500px">
      <el-form :model="newRole" label-width="100px">
        <el-form-item label="角色名称" required>
          <el-input v-model="newRole.name" placeholder="例如: 管理员" />
        </el-form-item>
        <el-form-item label="角色代码" required>
          <el-input v-model="newRole.code" placeholder="例如: admin" />
          <div class="text-xs text-gray-500 mt-1">小写字母、数字和下划线，用于系统识别</div>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newRole.description" type="textarea" :rows="3" placeholder="角色描述信息" />
        </el-form-item>
        <el-form-item label="继承角色">
          <el-select v-model="newRole.parent_id" placeholder="选择父角色（可选）" style="width: 100%">
            <el-option label="无" :value="null"></el-option>
            <el-option
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRole = false">取消</el-button>
        <el-button type="primary" @click="addRole" :loading="addingRole">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchQuery = ref('')
const loading = ref(false)
const showAddRole = ref(false)
const addingRole = ref(false)
const selectedRole = ref(null)

const newRole = ref({
  name: '',
  code: '',
  description: '',
  parent_id: null
})

// 模拟角色数据
const roles = ref([
  {
    id: 1,
    name: '管理员',
    code: 'admin',
    description: '系统管理员，拥有所有权限',
    user_count: 1,
    permission_count: 24,
    permissions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
  },
  {
    id: 2,
    name: '编辑者',
    code: 'editor',
    description: '内容编辑者，可以创建和编辑内容',
    user_count: 2,
    permission_count: 16,
    permissions: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
  },
  {
    id: 3,
    name: '查看者',
    code: 'viewer',
    description: '内容查看者，只能查看内容',
    user_count: 1,
    permission_count: 8,
    permissions: [1, 2, 3, 4, 5, 6, 7, 8]
  }
])

// 模拟权限模块数据
const modules = ref([
  {
    id: 1,
    name: '仪表盘',
    permissions: [
      { id: 1, name: '查看仪表盘', code: 'dashboard:view' },
      { id: 2, name: '导出数据', code: 'dashboard:export' }
    ]
  },
  {
    id: 2,
    name: '数据模型',
    permissions: [
      { id: 3, name: '查看模型', code: 'models:view' },
      { id: 4, name: '创建模型', code: 'models:create' },
      { id: 5, name: '编辑模型', code: 'models:edit' },
      { id: 6, name: '删除模型', code: 'models:delete' }
    ]
  },
  {
    id: 3,
    name: '数据记录',
    permissions: [
      { id: 7, name: '查看记录', code: 'records:view' },
      { id: 8, name: '创建记录', code: 'records:create' },
      { id: 9, name: '编辑记录', code: 'records:edit' },
      { id: 10, name: '删除记录', code: 'records:delete' },
      { id: 11, name: '导出记录', code: 'records:export' }
    ]
  },
  {
    id: 4,
    name: 'API 管理',
    permissions: [
      { id: 12, name: '查看 API', code: 'api:view' },
      { id: 13, name: '测试 API', code: 'api:test' },
      { id: 14, name: '管理 API', code: 'api:manage' }
    ]
  },
  {
    id: 5,
    name: '用户管理',
    permissions: [
      { id: 15, name: '查看用户', code: 'users:view' },
      { id: 16, name: '创建用户', code: 'users:create' },
      { id: 17, name: '编辑用户', code: 'users:edit' },
      { id: 18, name: '删除用户', code: 'users:delete' }
    ]
  },
  {
    id: 6,
    name: '角色管理',
    permissions: [
      { id: 19, name: '查看角色', code: 'roles:view' },
      { id: 20, name: '创建角色', code: 'roles:create' },
      { id: 21, name: '编辑角色', code: 'roles:edit' },
      { id: 22, name: '删除角色', code: 'roles:delete' },
      { id: 23, name: '分配权限', code: 'roles:assign' }
    ]
  },
  {
    id: 7,
    name: '系统设置',
    permissions: [
      { id: 24, name: '系统配置', code: 'system:config' }
    ]
  }
])

const filteredRoles = computed(() => {
  if (!searchQuery.value) return roles.value
  
  const query = searchQuery.value.toLowerCase()
  return roles.value.filter(role => 
    role.name.toLowerCase().includes(query) ||
    role.code.toLowerCase().includes(query) ||
    role.description.toLowerCase().includes(query)
  )
})

const selectRole = (role) => {
  // 创建角色的深拷贝，避免直接修改原始数据
  selectedRole.value = {
    ...role,
    permissions: [...role.permissions]
  }
}

const isPermissionChecked = (permission) => {
  if (!selectedRole.value) return false
  return selectedRole.value.permissions.includes(permission.id)
}

const isModuleAllChecked = (module) => {
  return module.permissions.every(p => isPermissionChecked(p))
}

const isModuleIndeterminate = (module) => {
  const checkedCount = module.permissions.filter(p => isPermissionChecked(p)).length
  return checkedCount > 0 && checkedCount < module.permissions.length
}

const togglePermission = (permission, checked) => {
  if (!selectedRole.value) return
  
  const index = selectedRole.value.permissions.indexOf(permission.id)
  if (checked && index === -1) {
    selectedRole.value.permissions.push(permission.id)
  } else if (!checked && index !== -1) {
    selectedRole.value.permissions.splice(index, 1)
  }
}

const toggleModule = (module, checked) => {
  if (!selectedRole.value) return
  
  const permissionIds = module.permissions.map(p => p.id)
  if (checked) {
    // 添加模块中所有未选中的权限
    permissionIds.forEach(id => {
      if (!selectedRole.value.permissions.includes(id)) {
        selectedRole.value.permissions.push(id)
      }
    })
  } else {
    // 移除模块中所有已选中的权限
    selectedRole.value.permissions = selectedRole.value.permissions.filter(
      id => !permissionIds.includes(id)
    )
  }
}

const refreshRoles = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('角色列表已刷新')
  }, 800)
}

const addRole = async () => {
  if (!newRole.value.name || !newRole.value.code) {
    return ElMessage.error('请填写角色名称和代码')
  }

  addingRole.value = true
  try {
    // 模拟 API 请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newRoleData = {
      id: roles.value.length + 1,
      name: newRole.value.name,
      code: newRole.value.code,
      description: newRole.value.description,
      user_count: 0,
      permission_count: 0,
      permissions: [],
      parent_id: newRole.value.parent_id
    }
    
    roles.value.unshift(newRoleData)
    showAddRole.value = false
    newRole.value = {
      name: '',
      code: '',
      description: '',
      parent_id: null
    }
    
    ElMessage.success('角色添加成功')
  } catch (error) {
    console.error('添加角色失败:', error)
    ElMessage.error('添加角色失败')
  } finally {
    addingRole.value = false
  }
}

const editRole = (role) => {
  // 创建角色的深拷贝，避免直接修改原始数据
  selectedRole.value = {
    ...role,
    permissions: [...role.permissions]
  }
  ElMessage.info(`编辑角色: ${role.name}`)
}

const exportRoles = () => {
  const data = roles.value.map(role => ({
    角色名称: role.name,
    角色代码: role.code,
    描述: role.description,
    用户数: role.user_count,
    权限数: role.permission_count,
    创建时间: new Date().toLocaleString('zh-CN')
  }))
  
  // 模拟导出
  const csvContent = 'data:text/csv;charset=utf-8,' 
    + ['角色名称,角色代码,描述,用户数,权限数,创建时间']
      .concat(data.map(row => Object.values(row).join(',')))
      .join('\n')
  
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `角色列表_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('角色列表已导出')
}

const deleteRole = (role) => {
  if (role.user_count > 0) {
    return ElMessage.error('该角色下还有用户，无法删除')
  }

  ElMessageBox.confirm(`确定要删除角色 "${role.name}" 吗？`, '删除确认', {
    type: 'warning'
  }).then(() => {
    roles.value = roles.value.filter(r => r.id !== role.id)
    if (selectedRole.value?.id === role.id) {
      selectedRole.value = null
    }
    ElMessage.success('角色已删除')
  })
}

const savePermissions = async () => {
  if (!selectedRole.value) return
  
  const loadingMessage = ElMessage({
    type: 'loading',
    message: '正在保存权限配置...',
    duration: 0
  })
  
  try {
    // 首先尝试调用后端API
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
    
    // 构建请求数据 - 将数字ID转换为权限代码
    // 创建数字ID到权限代码的映射
    const idToCodeMap = {}
    modules.value.forEach(module => {
      module.permissions.forEach(perm => {
        idToCodeMap[perm.id] = perm.code
      })
    })
    
    // 将数字ID转换为权限代码
    const permissionCodes = selectedRole.value.permissions.map(id => {
      const code = idToCodeMap[id]
      if (!code) {
        console.warn(`Permission code not found for ID: ${id}`)
        return id.toString() // 如果找不到映射，返回原始ID
      }
      return code
    })
    
    const requestData = {
      permissions: permissionCodes
    }
    
    // 角色代码到UUID的映射（根据后端实际数据）
    const roleCodeToIdMap = {
      'admin': '09ebf96b-32cc-4ac4-9f62-7527fe02fbfe',
      'editor': 'eaceb047-5002-49f6-bc10-f9a6b1420891',
      'viewer': 'c0f4ae07-2c80-4b90-ac6c-ec5b23653534'
    }
    
    // 获取当前角色的代码
    const currentRole = roles.value.find(r => r.id === selectedRole.value.id)
    if (!currentRole) {
      throw new Error('角色未找到')
    }
    
    // 使用角色代码获取正确的UUID
    const roleId = roleCodeToIdMap[currentRole.code] || selectedRole.value.id
    
    // 尝试调用API
    const response = await fetch(`${API_BASE_URL}/api/roles/${roleId}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify(requestData)
    })
    
    if (response.ok) {
      // API调用成功
      const data = await response.json()
      
      // 更新前端数据
      const roleIndex = roles.value.findIndex(r => r.id === selectedRole.value.id)
      if (roleIndex !== -1) {
        roles.value[roleIndex].permissions = [...selectedRole.value.permissions]
        roles.value[roleIndex].permission_count = selectedRole.value.permissions.length
        
        if (selectedRole.value.id === roles.value[roleIndex].id) {
          selectedRole.value = { ...roles.value[roleIndex] }
        }
      }
      
      loadingMessage.close()
      ElMessage.success('权限配置已保存到服务器')
    } else {
      // API调用失败，使用模拟数据保存
      const errorText = await response.text()
      console.error('API调用失败:', response.status, errorText)
      throw new Error(`API调用失败: ${response.status}`)
    }
  } catch (error) {
    // API调用失败，使用模拟数据保存
    console.warn('API调用失败，使用本地保存:', error)
    
    // 找到对应的角色并更新权限（模拟数据）
    const roleIndex = roles.value.findIndex(r => r.id === selectedRole.value.id)
    if (roleIndex !== -1) {
      // 更新角色的权限和权限数量
      roles.value[roleIndex].permissions = [...selectedRole.value.permissions]
      roles.value[roleIndex].permission_count = selectedRole.value.permissions.length
      
      // 如果当前选中的角色就是正在编辑的角色，也需要更新
      if (selectedRole.value.id === roles.value[roleIndex].id) {
        selectedRole.value = { ...roles.value[roleIndex] }
      }
    }
    
    loadingMessage.close()
    ElMessage.success('权限配置已保存（本地）')
  }
}
</script>

<style scoped>
.system-roles {
  padding: 0;
}

.page-header {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.permissions-card {
  height: fit-content;
  position: sticky;
  top: 1rem;
}

.module-permissions {
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
