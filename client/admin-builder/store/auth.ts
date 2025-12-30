import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
  id: string
  email: string
  name: string
  role?: string
  created_at: string
  updated_at?: string
}

export interface AuthState {
  token: string | null
  user: UserInfo | null
  isAuthenticated: boolean
}

// API基础URL - 根据环境配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

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

  // 设置请求头（带token）
  const getHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }
    
    return headers
  }

  // 设置请求头（不带token，用于登录注册）
  const getHeadersWithoutToken = () => {
    return {
      'Content-Type': 'application/json'
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: getHeadersWithoutToken(),
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || '登录失败' 
        }
      }

      if (data.success && data.token && data.user) {
        // 保存到状态
        token.value = data.token
        user.value = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || data.user.email.split('@')[0],
          role: data.user.role || 'user',
          created_at: data.user.created_at
        }

        // 保存到本地存储
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('auth_user', JSON.stringify(user.value))

        return { success: true, user: user.value }
      } else {
        return { success: false, error: '登录响应格式错误' }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '网络连接失败' 
      }
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
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: getHeadersWithoutToken(),
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.username
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || '注册失败' 
        }
      }

      if (data.success && data.user) {
        // 注册成功，但不自动登录，需要用户手动登录
        return { 
          success: true, 
          user: {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name || userData.username,
            role: data.user.role || 'user',
            created_at: data.user.created_at
          }
        }
      } else {
        return { success: false, error: '注册响应格式错误' }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '网络连接失败' 
      }
    }
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    if (!token.value) {
      return { success: false, error: '未登录' }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: getHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        // 如果token失效，清除登录状态
        if (response.status === 401) {
          logout()
        }
        return { 
          success: false, 
          error: data.error || '获取用户信息失败' 
        }
      }

      if (data.success && data.user) {
        user.value = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || data.user.email.split('@')[0],
          role: data.user.role || 'user',
          created_at: data.user.created_at,
          updated_at: data.user.updated_at
        }

        // 更新本地存储
        localStorage.setItem('auth_user', JSON.stringify(user.value))

        return { success: true, user: user.value }
      } else {
        return { success: false, error: '用户信息格式错误' }
      }
    } catch (error) {
      console.error('Fetch current user failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '网络连接失败' 
      }
    }
  }

  // 登出
  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  // 检查权限（简化版，根据角色判断）
  const hasPermission = (permission: string) => {
    if (!user.value) return false
    
    // 简单的权限映射
    const rolePermissions: Record<string, string[]> = {
      'admin': ['dashboard:view', 'models:manage', 'users:view', 'users:manage', 'system:manage'],
      'user': ['dashboard:view', 'models:view'],
      'viewer': ['dashboard:view']
    }
    
    const permissions = rolePermissions[user.value.role || 'user'] || []
    return permissions.includes(permission)
  }

  // 检查角色
  const hasRole = (role: string) => {
    if (!user.value) return false
    return user.value.role === role
  }

  // 更新用户信息
  const updateUser = async (userData: Partial<UserInfo>) => {
    if (!user.value || !token.value) {
      return { success: false, error: '未登录' }
    }

    try {
      // 这里可以调用更新用户信息的API
      // 暂时只更新本地状态
      user.value = { ...user.value, ...userData }
      localStorage.setItem('auth_user', JSON.stringify(user.value))
      
      return { success: true, user: user.value }
    } catch (error) {
      console.error('Update user failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : '更新失败' 
      }
    }
  }

  // 刷新 token
  const refreshToken = async () => {
    if (!token.value) return false
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: getHeaders()
      })

      const data = await response.json()

      if (!response.ok) {
        logout()
        return false
      }

      if (data.success && data.token) {
        token.value = data.token
        localStorage.setItem('auth_token', data.token)
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      return false
    }
  }

  // 初始化时尝试获取用户信息
  const init = async () => {
    if (token.value && !user.value) {
      await fetchCurrentUser()
    }
  }

  // 调用初始化
  init()

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
    fetchCurrentUser,
    loadUserFromStorage
  }
})
