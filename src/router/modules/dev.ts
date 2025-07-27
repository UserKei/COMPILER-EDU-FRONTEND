import type { RouteRecordRaw } from 'vue-router'

const devRoutes: RouteRecordRaw[] = [
  {
    path: '/dev',
    name: 'dev-index',
    component: () => import('../../views/dev/index.vue'),
    meta: {
      title: '开发调试中心',
      description: '画布组件测试导航页面',
    },
  },
  {
    path: '/dev/lr-canvas',
    name: 'dev-lr-canvas',
    component: () => import('../../views/dev/pages/LRCanvasTest.vue'),
    meta: {
      title: 'LR Canvas 测试',
      description: 'LR 项目集分析画布组件测试',
    },
  },
  {
    path: '/dev/fa-canvas',
    name: 'dev-fa-canvas',
    component: () => import('../../views/dev/pages/FACanvasTest.vue'),
    meta: {
      title: 'FA Canvas 测试',
      description: '有限自动机画布组件测试 (NFA/DFA)',
    },
  },
]

export default devRoutes
