import type { RouteRecordRaw } from 'vue-router'

const lr0Routes: RouteRecordRaw[] = [
  {
    path: '/lr0',
    name: 'lr0',
    component: () => import('../../views/lr0/index.vue'),
    meta: {
      title: 'LR0 语法分析',
      description: '自底向上语法分析算法'
    }
  },
  {
    path: '/lr0/:step',
    name: 'lr0-step',
    component: () => import('../../views/lr0/index.vue'),
    meta: {
      title: 'LR0 分析步骤',
      description: 'LR0算法的具体步骤'
    }
  }
]

export default lr0Routes
