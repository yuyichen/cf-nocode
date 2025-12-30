<template>
  <div class="system-users">
    <div class="page-header mb-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold">用户管理</h1>
          <p class="text-gray-500 mt-1">管理系统用户账号和权限</p>
        </div>
        <div class="flex gap-2">
          <el-button type="primary" @click="showAddUser = true">
            <i class="i-carbon-user-follow mr-1"></i>
            添加用户
          </el-button>
          <el-button @click="refreshUsers">
            <i class="i-carbon-renew mr-1"></i>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <el-card class="mb-6" shadow="hover">
      <template #header>
        <div class="flex justify-between items-center">
          <span class="font-bold">用户列表</span>
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户名、邮箱或角色"
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
        :data="filteredUsers"
        stripe
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="avatar" label="头像" width="80">
          <template #default="scope">
            <el-avatar :size="40" :src="scope.row.avatar">
              {{ scope.row.username.charAt(0).toUpperCase() }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="scope">
            <el-tag :type="getRoleType(scope.row.role)" size="small">
              {{ scope.row.role }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              :active-value="'active'"
              :inactive-value="'inactive'"
              @change="updateUserStatus(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.last_login) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <div class="flex gap-1">
              <el-button size="small" @click="editUser(scope.row)">
                编辑
              </el-button>
              <el-button size="small" type="primary" @click="resetPassword(scope.row)">
                重置密码
              </el-button>
              <el-dropdown @command="handleUserCommand($event, scope.row)">
                <el-button size="small">
                  <i class="i-carbon-overflow-menu-horizontal"></i>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="permissions">
                      <i class="i-carbon-user-certification mr-2"></i>
                      权限设置
                    </el-dropdown-item>
                    <el-dropdown-item command="logs">
                      <i class="i-carbon-list mr-2"></i>
                      操作日志
                    </el-dropdown-item>
                    <el-dropdown-item command="impersonate" divided>
                      <i class="i-carbon-user-avatar mr-2"></i>
                      模拟登录
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided class="text-red-500">
                      <i class="i-carbon-trash-can mr-2"></i>
                      删除用户
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-between items-center">
        <div class="text-gray-500 text-sm">
          共 {{ filteredUsers.length }} 个用户
        </div>
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredUsers.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加用户对话框 -->
    <el-dialog v-model="showAddUser" title="添加用户" width="500px">
      <el-form 
        ref="addUserFormRef" 
        :model="newUser" 
        :rules="addUserRules"
        label-width="100px"
        @submit.prevent="addUser"
      >
        <el-form-item label="用户名" prop="username" required>
          <el-input 
            v-model="newUser.username" 
            placeholder="请输入用户名（3-20位字母、数字、下划线）" 
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email" required>
          <el-input 
            v-model="newUser.email" 
            placeholder="请输入邮箱地址" 
          />
        </el-form-item>
        <el-form-item label="密码" prop="password" required>
          <el-input 
            v-model="newUser.password" 
            type="password" 
            placeholder="请输入密码（包含大小写字母和数字）" 
            show-password 
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword" required>
          <el-input 
            v-model="newUser.confirmPassword" 
            type="password" 
            placeholder="请确认密码" 
            show-password 
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="newUser.role" placeholder="选择角色" style="width: 100%">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="编辑者" value="editor"></el-option>
            <el-option label="普通用户" value="user"></el-option>
            <el-option label="查看者" value="viewer"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="newUser.status" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddUser = false">取消</el-button>
        <el-button type="primary" @click="validateAndAddUser" :loading="addingUser">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../store'

const authStore = useAuthStore()
const addUserFormRef = ref()

// API基础URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const searchQuery = ref('')
const loading = ref(false)
const showAddUser = ref(false)
const addingUser = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const newUser = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'user',
  status: true
})

// 真实用户数据
const users = ref([])

// 获取请求头
const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  }
  
  const token = authStore.token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

// 加载用户数据
const loadUsers = async () => {
  try {
    loading.value = true
    
    // 构建查询参数
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      pageSize: pageSize.value.toString(),
      sortBy: 'created_at',
      sortOrder: 'desc'
    })

    const response = await fetch(`${API_BASE_URL}/api/data/users?${params}`, {
      method: 'GET',
      headers: getHeaders()
    })
    
    if (!response.ok) {
      throw new Error('加载用户数据失败')
    }
    
    const result = await response.json()
    
    if (result.data) {
      // 转换API数据为前端格式
      users.value = result.data.map(user => ({
        id: user.id,
        username: user.name || user.email.split('@')[0],
        email: user.email,
        role: user.role || 'user',
        status: 'active', // 默认状态
        avatar: '',
        last_login: user.last_login || user.updated_at || user.created_at,
        created_at: user.created_at
      }))
      total.value = result.total || 0
    } else {
      users.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载用户数据失败:', error)
    ElMessage.error('加载用户数据失败')
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query) ||
    user.role.toLowerCase().includes(query)
  )
})

const getRoleType = (role) => {
  const types = {
    admin: 'danger',
    editor: 'warning',
    user: 'success',
    viewer: 'info'
  }
  return types[role] || 'info'
}

const refreshUsers = () => {
  loadUsers()
  ElMessage.success('用户列表已刷新')
}

const addUser = async () => {
  // 验证必填字段
  if (!newUser.value.username || !newUser.value.email || !newUser.value.password) {
    return ElMessage.error('请填写完整信息')
  }

  // 验证用户名格式
  if (newUser.value.username.length < 3 || newUser.value.username.length > 20) {
    return ElMessage.error('用户名长度在 3 到 20 个字符')
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(newUser.value.username)) {
    return ElMessage.error('用户名只能包含字母、数字和下划线')
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newUser.value.email)) {
    return ElMessage.error('请输入正确的邮箱格式')
  }

  // 验证密码强度（与注册页面保持一致）
  if (newUser.value.password.length < 6) {
    return ElMessage.error('密码长度不能少于6位')
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newUser.value.password)) {
    return ElMessage.error('密码必须包含大小写字母和数字')
  }

  // 验证确认密码
  if (newUser.value.password !== newUser.value.confirmPassword) {
    return ElMessage.error('两次输入的密码不一致')
  }

  addingUser.value = true
  try {
    // 调用注册API添加用户
    const result = await authStore.register({
      username: newUser.value.username,
      email: newUser.value.email,
      password: newUser.value.password
    })
    
    if (result.success) {
      // 如果注册成功，更新用户角色（如果需要）
      if (newUser.value.role !== 'user') {
        try {
          const updateResponse = await fetch(`${API_BASE_URL}/api/data/users/${result.user.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
              name: newUser.value.username,
              email: newUser.value.email,
              role: newUser.value.role
            })
          })
          
          if (!updateResponse.ok) {
            console.warn('更新用户角色失败，但用户已创建成功')
          }
        } catch (roleError) {
          console.warn('更新用户角色失败:', roleError)
        }
      }
      
      showAddUser.value = false
      newUser.value = {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        status: true
      }
      
      ElMessage.success('用户添加成功')
      loadUsers() // 刷新用户列表
    } else {
      throw new Error(result.error || '添加用户失败')
    }
  } catch (error) {
    console.error('添加用户失败:', error)
    ElMessage.error(error.message || '添加用户失败')
  } finally {
    addingUser.value = false
  }
}

const editUser = async (user) => {
  try {
    // 创建一个更完整的编辑对话框
    const result = await ElMessageBox.prompt('请输入新的用户名', '编辑用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputValue: user.username,
      inputPlaceholder: '请输入用户名'
    })
    
    if (result.value) {
      const newUsername = result.value.trim()
      if (!newUsername) {
        ElMessage.error('用户名不能为空')
        return
      }
      
      // 更新用户信息
      const updateResponse = await fetch(`${API_BASE_URL}/api/data/users/${user.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({
          name: newUsername,
          email: user.email,
          role: user.role
        })
      })
      
      if (updateResponse.ok) {
        ElMessage.success('用户信息已更新')
        loadUsers() // 刷新列表
      } else {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || '更新用户失败')
      }
    }
  } catch (error) {
    // 如果用户点击取消，会抛出 'cancel' 错误
    if (error !== 'cancel') {
      console.error('编辑用户失败:', error)
      ElMessage.error(error.message || '编辑用户失败')
    }
  }
}

const resetPassword = async (user) => {
  try {
    ElMessageBox.prompt('请输入新密码', '重置密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'password'
    }).then(async ({ value }) => {
      if (value) {
        // 调用更新密码API
        const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
          method: 'PUT',
          headers: getHeaders(),
          body: JSON.stringify({
            userId: user.id,
            newPassword: value
          })
        })
        
        if (response.ok) {
          ElMessage.success(`用户 ${user.username} 的密码已重置`)
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || '重置密码失败')
        }
      }
    })
  } catch (error) {
    console.error('重置密码失败:', error)
    ElMessage.error(error.message || '重置密码失败')
  }
}

const updateUserStatus = async (user) => {
  try {
    // 更新用户状态
    const response = await fetch(`${API_BASE_URL}/api/data/users/${user.id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        status: user.status === 'active' ? 'active' : 'inactive'
      })
    })
    
    if (response.ok) {
      ElMessage.success(`用户 ${user.username} 状态已更新为 ${user.status}`)
    } else {
      throw new Error('更新用户状态失败')
    }
  } catch (error) {
    console.error('更新用户状态失败:', error)
    ElMessage.error('更新用户状态失败')
  }
}

const handleUserCommand = async (command, user) => {
  switch (command) {
    case 'permissions':
      try {
        // 获取用户当前信息
        const response = await fetch(`${API_BASE_URL}/api/data/users/${user.id}`, {
          method: 'GET',
          headers: getHeaders()
        })
        
        if (!response.ok) {
          throw new Error('获取用户信息失败')
        }
        
        const userData = await response.json()
        const currentUser = userData.data || user
        
        // 创建权限设置对话框
        const result = await ElMessageBox.confirm(
          `<div style="max-height:400px;overflow-y:auto;">
            <h4>设置用户 ${user.username} 的权限</h4>
            <p>当前角色: <strong>${currentUser.role || 'user'}</strong></p>
            <div style="margin: 15px 0;">
              <label style="display:block;margin-bottom:8px;">选择新角色:</label>
              <select id="role-select" style="width:100%;padding:8px;border:1px solid #dcdfe6;border-radius:4px;">
                <option value="admin" ${currentUser.role === 'admin' ? 'selected' : ''}>管理员</option>
                <option value="editor" ${currentUser.role === 'editor' ? 'selected' : ''}>编辑者</option>
                <option value="user" ${currentUser.role === 'user' ? 'selected' : ''}>普通用户</option>
                <option value="viewer" ${currentUser.role === 'viewer' ? 'selected' : ''}>查看者</option>
              </select>
            </div>
            <div style="margin: 15px 0;">
              <label style="display:block;margin-bottom:8px;">权限说明:</label>
              <ul style="padding-left:20px;margin:0;">
                <li><strong>管理员</strong>: 所有权限，包括用户管理、系统设置</li>
                <li><strong>编辑者</strong>: 可以创建、编辑、删除内容</li>
                <li><strong>普通用户</strong>: 基本操作权限</li>
                <li><strong>查看者</strong>: 只能查看内容，不能修改</li>
              </ul>
            </div>
          </div>`,
          '权限设置',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '保存',
            cancelButtonText: '取消',
            showClose: false
          }
        )
        
        if (result) {
          const roleSelect = document.getElementById('role-select')
          const newRole = roleSelect ? roleSelect.value : currentUser.role
          
          // 更新用户角色
          const updateResponse = await fetch(`${API_BASE_URL}/api/data/users/${user.id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({
              name: currentUser.name || user.username,
              email: currentUser.email || user.email,
              role: newRole
            })
          })
          
          if (updateResponse.ok) {
            ElMessage.success(`用户 ${user.username} 的角色已更新为 ${newRole}`)
            loadUsers() // 刷新列表
          } else {
            const errorData = await updateResponse.json()
            throw new Error(errorData.error || '更新角色失败')
          }
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('权限设置失败:', error)
          ElMessage.error(error.message || '权限设置失败')
        }
      }
      break
      
    case 'logs':
      try {
        // 获取用户操作日志
        const response = await fetch(`${API_BASE_URL}/api/data/user_logs?userId=${user.id}`, {
          method: 'GET',
          headers: getHeaders()
        })
        
        if (response.ok) {
          const logs = await response.json()
          ElMessage.info(`查看用户 ${user.username} 的操作日志 (共 ${logs.data?.length || 0} 条)`)
        } else {
          ElMessage.info(`查看用户 ${user.username} 的操作日志`)
        }
      } catch (error) {
        console.error('获取操作日志失败:', error)
        ElMessage.info(`查看用户 ${user.username} 的操作日志`)
      }
      break
      
    case 'impersonate':
      ElMessage.info(`模拟登录用户 ${user.username}`)
      break
      
    case 'delete':
      try {
        await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复。`, '删除确认', {
          type: 'warning'
        })
        
        const response = await fetch(`${API_BASE_URL}/api/data/users/${user.id}`, {
          method: 'DELETE',
          headers: getHeaders()
        })
        
        if (response.ok) {
          users.value = users.value.filter(u => u.id !== user.id)
          ElMessage.success('用户已删除')
          loadUsers() // 刷新列表
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || '删除用户失败')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除用户失败:', error)
          ElMessage.error(error.message || '删除用户失败')
        }
      }
      break
  }
}

const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

const handleSizeChange = (size) => {
  pageSize.value = size
  loadUsers()
}

// 表单验证规则
const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
    callback(new Error('密码必须包含大小写字母和数字'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请确认密码'))
  } else if (value !== newUser.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const addUserRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validateConfirmPassword, trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择用户角色', trigger: 'change' }
  ]
}

// 验证并添加用户
const validateAndAddUser = async () => {
  if (!addUserFormRef.value) return
  
  try {
    // 验证表单
    await addUserFormRef.value.validate()
    
    // 调用添加用户函数
    await addUser()
  } catch (error) {
    // 验证失败，错误信息已经由Element Plus显示
    console.log('表单验证失败:', error)
  }
}

const handleCurrentChange = (page) => {
  currentPage.value = page
  loadUsers()
}

// 初始化加载用户数据
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.system-users {
  padding: 0;
}

.page-header {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
