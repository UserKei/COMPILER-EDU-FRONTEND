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
    path: '/dev/nfa',
    name: 'dev-nfa',
    component: () => import('../../views/dev/pages/NFATest.vue'),
    meta: {
      title: 'NFA 测试',
      description: '非确定有限自动机画布组件测试',
    },
  },
  {
    path: '/dev/dfa',
    name: 'dev-dfa',
    component: () => import('../../views/dev/pages/DFATest.vue'),
    meta: {
      title: 'DFA 测试',
      description: '确定有限自动机画布组件测试',
    },
  },
  {
    path: '/dev/min-dfa',
    name: 'dev-min-dfa',
    component: () => import('../../views/dev/pages/MinDFATest.vue'),
    meta: {
      title: '最小化 DFA 测试',
      description: '最小化确定有限自动机画布组件测试',
    },
  },
  {
    path: '/dev/lr0',
    name: 'dev-lr0',
    component: () => import('../../views/dev/pages/LR0Test.vue'),
    meta: {
      title: 'LR0 测试',
      description: 'LR0 分析器画布组件测试',
    },
  },
  {
    path: '/dev/slr1',
    name: 'dev-slr1',
    component: () => import('../../views/dev/pages/SLR1Test.vue'),
    meta: {
      title: 'SLR1 测试',
      description: 'SLR1 分析器画布组件测试',
    },
  },
]

export default devRoutes
