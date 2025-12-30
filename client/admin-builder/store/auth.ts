import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: number
  username: string
  email: string
  avatar: string
  role: string
  permissions: string[]
}

export interface AuthState {
  token: string | null
  user: UserInfo | null
  isAuthenticated: boolean
}

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<UserInfo | null>(null)
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 从本地存储加载用户信息
  const loadUserFromStorage = () => {
    const userStr = localStorage.getItem('auth_user')
    if (userStr) {
      try {
        user.value = JSON.parse(userStr)
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error)
        localStorage.removeItem('auth_user')
      }
    }
  }

  // 初始化时加载用户信息
  loadUserFromStorage()

  // 登录
  const login = async (username: string, password: string) => {
    try {
      // 模拟 API 请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟响应数据
      const mockToken = 'mock_jwt_token_' + Date.now()
      const mockUser: UserInfo = {
        id: 1,
        username: username,
        email: `${username}@example.com`,
        avatar: '',
        role: 'admin',
        permissions: ['dashboard:view', 'models:manage', 'users:view']
      }

      // 保存到状态
      token.value = mockToken
      user.value = mockUser

      // 保存到本地存储
      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify(mockUser))

      return { success: true, user: mockUser }
    } catch (error) {
      console.error('Login failed:', error)
      return { success: false, error: '登录失败' }
    }
  }

  // 注册
  const register = async (userData: {
    username: string
    email: string
    password: string
    inviteCode?: string
  }) => {
    try {
      // 模拟 API 请求
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 模拟响应数据
      const mockUser: UserInfo = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        avatar: '',
        role: 'viewer',
        permissions: ['dashboard:view']
      }

      return { success: true, user: mockUser }
    } catch (error) {
      console.error('Registration failed:', error)
      return { success: false, error: '注册失败' }
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  // 检查权限
  const hasPermission = (permission: string) => {
    if (!user.value) return false
    return user.value.permissions.includes(permission)
  }

  // 检查角色
  const hasRole = (role: string) => {
    if (!user.value) return false
    return user.value.role === role
  }

  // 更新用户信息
  const updateUser = (userData: Partial<UserInfo>) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      localStorage.setItem('auth_user', JSON.stringify(user.value))
    }
  }

  // 刷新 token
  const refreshToken = async () => {
    if (!token.value) return false
    
    try {
      // 模拟 token 刷新
      await new Promise(resolve => setTimeout(resolve, 500))
      const newToken = 'refreshed_mock_jwt_token_' + Date.now()
      token.value = newToken
      localStorage.setItem('auth_token', newToken)
      return true
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      return false
    }
  }

  return {
    // 状态
    token,
    user,
    isAuthenticated,

    // Getters
    hasPermission,
    hasRole,

    // Actions
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    loadUserFromStorage
  }
})
