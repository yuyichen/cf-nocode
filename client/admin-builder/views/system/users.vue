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
      <el-form :model="newUser" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="newUser.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="newUser.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="newUser.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" required>
          <el-input v-model="newUser.confirmPassword" type="password" placeholder="请确认密码" show-password />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="newUser.role" placeholder="选择角色" style="width: 100%">
            <el-option label="管理员" value="admin"></el-option>
            <el-option label="编辑者" value="editor"></el-option>
            <el-option label="查看者" value="viewer"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="newUser.status" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddUser = false">取消</el-button>
        <el-button type="primary" @click="addUser" :loading="addingUser">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const searchQuery = ref('')
const loading = ref(false)
const showAddUser = ref(false)
const addingUser = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)

const newUser = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: 'viewer',
  status: true
})

// 模拟用户数据
const users = ref([
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    status: 'active',
    avatar: '',
    last_login: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 2,
    username: 'editor1',
    email: 'editor1@example.com',
    role: 'editor',
    status: 'active',
    avatar: '',
    last_login: new Date(Date.now() - 7200000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    id: 3,
    username: 'viewer1',
    email: 'viewer1@example.com',
    role: 'viewer',
    status: 'active',
    avatar: '',
    last_login: new Date(Date.now() - 10800000).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 4,
    username: 'editor2',
    email: 'editor2@example.com',
    role: 'editor',
    status: 'inactive',
    avatar: '',
    last_login: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 10).toISOString()
  }
])

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
    viewer: 'success'
  }
  return types[role] || 'info'
}

const refreshUsers = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('用户列表已刷新')
  }, 800)
}

const addUser = async () => {
  if (!newUser.value.username || !newUser.value.email || !newUser.value.password) {
    return ElMessage.error('请填写完整信息')
  }

  if (newUser.value.password !== newUser.value.confirmPassword) {
    return ElMessage.error('两次输入的密码不一致')
  }

  addingUser.value = true
  try {
    // 模拟 API 请求
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newUserData = {
      id: users.value.length + 1,
      username: newUser.value.username,
      email: newUser.value.email,
      role: newUser.value.role,
      status: newUser.value.status ? 'active' : 'inactive',
      avatar: '',
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    
    users.value.unshift(newUserData)
    showAddUser.value = false
    newUser.value = {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'viewer',
      status: true
    }
    
    ElMessage.success('用户添加成功')
  } catch (error) {
    console.error('添加用户失败:', error)
    ElMessage.error('添加用户失败')
  } finally {
    addingUser.value = false
  }
}

const editUser = (user) => {
  ElMessage.info(`编辑用户: ${user.username}`)
}

const resetPassword = (user) => {
  ElMessageBox.prompt('请输入新密码', '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password'
  }).then(({ value }) => {
    if (value) {
      ElMessage.success(`用户 ${user.username} 的密码已重置`)
    }
  })
}

const updateUserStatus = (user) => {
  ElMessage.success(`用户 ${user.username} 状态已更新为 ${user.status}`)
}

const handleUserCommand = (command, user) => {
  switch (command) {
    case 'permissions':
      ElMessage.info(`设置用户 ${user.username} 的权限`)
      break
    case 'logs':
      ElMessage.info(`查看用户 ${user.username} 的操作日志`)
      break
    case 'impersonate':
      ElMessage.info(`模拟登录用户 ${user.username}`)
      break
    case 'delete':
      ElMessageBox.confirm(`确定要删除用户 ${user.username} 吗？`, '删除确认', {
        type: 'warning'
      }).then(() => {
        users.value = users.value.filter(u => u.id !== user.id)
        ElMessage.success('用户已删除')
      })
      break
  }
}

const formatTime = (timeString) => {
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}

const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}
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
