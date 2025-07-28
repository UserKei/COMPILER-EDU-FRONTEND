/**
 * Vue Flow 模块统一导出
 * 提供所有 Flow 相关组件、类型、工具函数的统一入口
 */

// 类型导出
export * from './types'

// 组合函数导出
export * from './composables'

// 工具函数导出
export * from './utils'

// 状态管理导出
export * from './stores'

// 画布组件导出
export * from './canvas'

// 节点组件导出
export * from './nodes'

// 边组件导出
export * from './edges'

// 便捷导出：组合所有组件
export const FlowComponents = {
  // Canvas components
  NFACanvas: () => import('./canvas/nfa/index.vue'),
  DFACanvas: () => import('./canvas/dfa/index.vue'),
  MinDFACanvas: () => import('./canvas/min-dfa/index.vue'),
  LR0Canvas: () => import('./canvas/lr0/index.vue'),
  SLR1Canvas: () => import('./canvas/slr1/index.vue'),
  // Node components
  CircleNode: () => import('./nodes/circle/index.vue'),
  RectangleNode: () => import('./nodes/rectangle/index.vue'),
  BaseNode: () => import('./nodes/base/index.vue'),
  // Edge components
  CustomEdge: () => import('./edges/index.vue'),
}

// 便捷导出：所有节点类型
export const NodeTypes = {
  circle: () => import('./nodes/circle/index.vue'),
  rectangle: () => import('./nodes/rectangle/index.vue'),
}

// 便捷导出：所有边类型
export const EdgeTypes = {
  custom: () => import('./edges/index.vue'),
}

// 版本信息
export const version = '2.0.0'

// 默认配置
export { defaultNodeData, defaultEdgeData, defaultCanvasConfig } from './types'
