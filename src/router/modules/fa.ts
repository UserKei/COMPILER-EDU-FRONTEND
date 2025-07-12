import type { RouteRecordRaw } from 'vue-router'

const faRoutes: RouteRecordRaw[] = [
  {
    path: '/fa',
    name: 'fa',
    component: () => import('../../views/fa/index.vue'),
    meta: {
      title: '有限自动机 (FA)',
      description: '正则表达式到NFA、DFA的转换和最小化'
    }
  },
  {
    path: '/fa/:step',
    name: 'fa-step',
    component: () => import('../../views/fa/index.vue'),
    meta: {
      title: '有限自动机步骤',
      description: 'FA算法的具体步骤'
    }
  }
]

export default faRoutes
