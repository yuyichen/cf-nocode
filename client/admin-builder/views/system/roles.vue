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
  selectedRole.value = role
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
  selectedRole.value = role
  ElMessage.info(`编辑角色: ${role.name}`)
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

const savePermissions = () => {
  if (!selectedRole.value) return
  
  // 更新权限数量
  selectedRole.value.permission_count = selectedRole.value.permissions.length
  
  ElMessage.success('权限配置已保存')
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
