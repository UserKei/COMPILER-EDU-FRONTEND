import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

// 导入开发专用路由模块
import devRoutes from './modules/dev'

// 开发环境基础路由
const devBaseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dev-root',
    redirect: '/dev',
    meta: {
      title: '开发环境首页',
      description: '重定向到画布演示页面',
    },
  },
]

// 合并开发路由
const devRouterRoutes: RouteRecordRaw[] = [...devBaseRoutes, ...devRoutes]

// 创建开发专用路由器
const devRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: devRouterRoutes,
})

// 开发环境路由守卫
devRouter.beforeEach((to, from, next) => {
  // 开发环境日志
  console.log(`[DEV ROUTER] Navigating from ${from.path} to ${to.path}`)

  // 设置页面标题
  if (to.meta?.title) {
    document.title = `[DEV] ${to.meta.title} - Yuki Compiler`
  }

  next()
})

devRouter.afterEach((to) => {
  console.log(`[DEV ROUTER] Navigation completed: ${to.path}`)
  console.log('[DEV ROUTER] Route meta:', to.meta)
})

export default devRouter
