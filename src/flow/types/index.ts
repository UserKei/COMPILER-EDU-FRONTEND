/**
 * Vue Flow 组件类型定义
 * 统一管理所有 Flow 相关的 TypeScript 类型
 */

// 节点数据类型
export interface NodeData {
  label?: string
  text?: string
  size?: number // 节点尺寸（像素）
  isInitial?: boolean // 是否为初始状态
  isFinal?: boolean // 是否为终结状态
  title?: string // 节点标题
  items?: LRItem[] // LR 项目集项目
  pros?: LRItem[] // LR 项目集项目（别名）
  [key: string]: any
}

// 边数据类型
export interface EdgeData {
  label?: string
  controlOffset?: { x: number; y: number } // 控制点偏移
  labelT?: number // 标签在曲线上的位置 (0-1)
  isEditing?: boolean // 是否处于编辑状态
  [key: string]: any
}

// LR 项目类型 - 用于 LR 语法分析
export interface LRItem {
  // 产生式
  production: {
    left: string // 产生式左部 (非终结符)
    right: string[] // 产生式右部 (符号序列)
  }
  // 点的位置 (表示已经分析了多少符号)
  dotPosition: number
  // 可选的展示属性
  id?: string // 项目的唯一标识符
  text?: string // 项目的文本表示 (如 "E → E • + T")
  lookahead?: string // LR(1) 的向前看符号
}

// 节点创建选项
export interface NodeCreationOptions {
  nodeType: 'circle' | 'rectangle'
  defaultLabel?: string
  generateId?: () => string
  generateLabel?: (id: string) => string
}

// 画布模式类型
export type CanvasMode = 'nfa' | 'dfa' | 'lr0' | 'slr1' | 'll1'

// 坐标点类型
export interface Position {
  x: number
  y: number
}

// 节点尺寸类型
export interface NodeSize {
  width: number
  height: number
}

// 画布配置类型
export interface CanvasConfig {
  mode: CanvasMode
  title?: string
  minZoom?: number
  maxZoom?: number
  defaultZoom?: number
  showControls?: boolean
  showBackground?: boolean
  backgroundPattern?: 'dots' | 'lines' | 'cross'
  backgroundGap?: number
}

// 节点状态类型
export interface NodeState {
  isSelected: boolean
  isEditing: boolean
  isHovered: boolean
  isDragging: boolean
}

// 边状态类型
export interface EdgeState {
  isSelected: boolean
  isEditing: boolean
  isHovered: boolean
  isDragging: boolean
}

// 动画配置类型
export interface AnimationConfig {
  duration?: number
  ease?: string
  scale?: number
  opacity?: number
}

// 验证规则类型
export interface ValidationRule {
  type: 'dfa' | 'nfa' | 'lr'
  message: string
  validator: (nodes: any[], edges: any[]) => boolean
}

// 工具栏按钮配置
export interface ToolbarButton {
  label: string
  action: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  icon?: string
}

// 快捷键配置
export interface KeyboardShortcut {
  key: string
  modifiers?: string[]
  action: () => void
  description: string
}

// 导出所有类型的默认值
export const defaultNodeData: Partial<NodeData> = {
  label: '',
  text: '',
  size: 45,
  isInitial: false,
  isFinal: false,
}

export const defaultEdgeData: Partial<EdgeData> = {
  label: '',
  labelT: 0.5,
  isEditing: false,
}

export const defaultCanvasConfig: CanvasConfig = {
  mode: 'nfa',
  minZoom: 0.2,
  maxZoom: 4,
  defaultZoom: 1,
  showControls: true,
  showBackground: true,
  backgroundPattern: 'dots',
  backgroundGap: 20,
}

// 默认 LR 项目
export const defaultLRItem: LRItem = {
  production: { left: 'S', right: ['E'] },
  dotPosition: 0,
  id: 'S->E@0',
  text: 'S → • E',
}
