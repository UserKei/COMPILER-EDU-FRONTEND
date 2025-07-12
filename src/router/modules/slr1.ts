import type { RouteRecordRaw } from 'vue-router'

const slr1Routes: RouteRecordRaw[] = [
  {
    path: '/slr1',
    name: 'slr1',
    component: () => import('../../views/slr1/index.vue'),
    meta: {
      title: 'SLR1 语法分析',
      description: '简单LR语法分析算法'
    }
  },
  {
    path: '/slr1/:step',
    name: 'slr1-step',
    component: () => import('../../views/slr1/index.vue'),
    meta: {
      title: 'SLR1 分析步骤',
      description: 'SLR1算法的具体步骤'
    }
  }
]

export default slr1Routes
