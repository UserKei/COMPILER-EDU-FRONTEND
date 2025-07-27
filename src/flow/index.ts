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
export { default as FACanvas } from './faCanvas/index.vue'
export { default as LRCanvas } from './lrCanvas/index.vue'

// 节点组件导出
export { default as CircleNode } from './components/circleNode/index.vue'
export { default as RectangleNode } from './components/rectangleNode/index.vue'

// 边组件导出
export { default as CustomEdge } from './components/edges/index.vue'

// 便捷导出：组合所有组件
export const FlowComponents = {
  FACanvas: () => import('./faCanvas/index.vue'),
  LRCanvas: () => import('./lrCanvas/index.vue'),
  CircleNode: () => import('./components/circleNode/index.vue'),
  RectangleNode: () => import('./components/rectangleNode/index.vue'),
  CustomEdge: () => import('./components/edges/index.vue'),
}

// 便捷导出：所有节点类型
export const NodeTypes = {
  circle: () => import('./components/circleNode/index.vue'),
  rectangle: () => import('./components/rectangleNode/index.vue'),
}

// 便捷导出：所有边类型
export const EdgeTypes = {
  custom: () => import('./components/edges/index.vue'),
}

// 版本信息
export const version = '1.0.0'

// 默认配置
export { defaultNodeData, defaultEdgeData, defaultCanvasConfig } from './types'
