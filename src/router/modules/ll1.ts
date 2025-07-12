import type { RouteRecordRaw } from 'vue-router'

const ll1Routes: RouteRecordRaw[] = [
  {
    path: '/ll1',
    name: 'll1',
    component: () => import('../../views/ll1/index.vue'),
    meta: {
      title: 'LL1 语法分析',
      description: '自顶向下语法分析算法'
    }
  },
  {
    path: '/ll1/:step',
    name: 'll1-step',
    component: () => import('../../views/ll1/index.vue'),
    meta: {
      title: 'LL1 分析步骤',
      description: 'LL1算法的具体步骤'
    }
  }
]

export default ll1Routes
