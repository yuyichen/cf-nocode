import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store'
import Layout from '../views/layout/index.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Layout,
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/dashboard/index.vue'),
          meta: { title: '仪表盘', icon: 'dashboard' }
        },
        {
          path: 'data-models',
          name: 'DataModels',
          component: () => import('../views/data/models.vue'),
          meta: { title: '数据模型', icon: 'model' }
        },
        {
          path: 'data-records',
          name: 'DataRecords',
          component: () => import('../views/data/records.vue'),
          meta: { title: '数据记录', icon: 'data-base' }
        },
        {
          path: 'api-docs',
          name: 'ApiDocs',
          component: () => import('../views/api/docs.vue'),
          meta: { title: 'API 文档', icon: 'document' }
        },
        {
          path: 'api-test',
          name: 'ApiTest',
          component: () => import('../views/api/test.vue'),
          meta: { title: 'API 测试', icon: 'test-tool' }
        },
        {
          path: 'system-users',
          name: 'SystemUsers',
          component: () => import('../views/system/users.vue'),
          meta: { title: '用户管理', icon: 'user' }
        },
        {
          path: 'system-roles',
          name: 'SystemRoles',
          component: () => import('../views/system/roles.vue'),
          meta: { title: '角色权限', icon: 'user-certification' }
        },
        {
          path: 'ui-designer',
          name: 'UIDesigner',
          component: () => import('../views/designer/index.vue'),
          meta: { title: 'UI 设计器', icon: 'pen' }
        },
        {
          path: 'help',
          name: 'Help',
          component: () => import('../views/help/index.vue'),
          meta: { title: '帮助中心', icon: 'help' }
        }
      ]
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/index.vue'),
      meta: { title: '登录', requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../views/register/index.vue'),
      meta: { title: '注册', requiresAuth: false }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('../views/error/404.vue'),
      meta: { title: '页面不存在' }
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - Cloudflare No-Code`
  }
  
  // 获取认证状态
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated
  
  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  
  // 如果路由需要认证但用户未登录，重定向到登录页
  if (requiresAuth && !isAuthenticated) {
    next('/login')
  }
  // 如果用户已登录但访问登录/注册页，重定向到首页
  else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    next('/dashboard')
  }
  // 其他情况正常导航
  else {
    next()
  }
})

export default router
