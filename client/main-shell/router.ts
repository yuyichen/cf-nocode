import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: { template: '<div class="p-10 text-center text-xl text-indigo-600">Welcome to Cloudflare No-Code Platform</div>' }
    },
    // Sub-apps are handled by qiankun, but routes must exist if using router-link
    { path: '/builder/:afterUser*', component: { template: '<div></div>' } },
    { path: '/runtime/:afterUser*', component: { template: '<div></div>' } },
  ]
})

export default router
