<template>
  <BaseCanvas
    title="LR0 分析器"
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    :edge-types="edgeTypes"
    canvas-class="lr0-mode"
    :config="canvasConfig"
    :toolbar-buttons="toolbarButtons"
    @connect="onConnect"
    @node-click="onNodeClick"
    @edge-click="onEdgeClick"
    @pane-click="onPaneClick"
    @pane-double-click="onPaneDoubleClick"
    @pane-context-menu="onPaneContextMenu"
    @pane-ready="onPaneReady"
  >
    <template #sidebar>
      <div class="lr0-panel">
        <h4 class="text-lg font-semibold mb-4">LR0 分析</h4>

        <div class="grammar-section mb-4">
          <h5 class="font-medium mb-2">文法规则</h5>
          <div class="grammar-rules">
            <div v-for="(rule, index) in grammarRules" :key="index" class="rule">
              <span class="rule-number">{{ index }}.</span>
              <span class="rule-text">{{ rule.left }} → {{ rule.right.join(' ') }}</span>
            </div>
          </div>
          <button
            @click="addGrammarRule"
            class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            添加规则
          </button>
        </div>

        <div class="items-section mb-4">
          <h5 class="font-medium mb-2">项目集统计</h5>
          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">状态数:</span>
              <span class="stat-value">{{ nodes.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">转移数:</span>
              <span class="stat-value">{{ edges.length }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">冲突数:</span>
              <span class="stat-value">{{ conflictCount }}</span>
            </div>
          </div>
        </div>

        <div class="actions-section">
          <button
            @click="generateLR0Table"
            class="w-full mb-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            生成 LR0 表
          </button>
          <button
            @click="checkConflicts"
            class="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            检查冲突
          </button>
        </div>
      </div>
    </template>
  </BaseCanvas>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { Node, Edge, Connection, MouseTouchEvent } from '@vue-flow/core'

import BaseCanvas from '../base/index.vue'
import RectangleNode from '../../components/rectangleNode/index.vue'
import CustomEdge from '../../components/edges/index.vue'
import type { NodeData, EdgeData, LRItem } from '../../types'
import { LRItemUtils, GrammarUtils } from '../../utils'

// Vue Flow instance
const { findNode, findEdge, addNodes, addEdges, removeNodes, removeEdges } = useVueFlow()

// Canvas state
const nodes = ref<Node<NodeData>[]>([])
const edges = ref<Edge<EdgeData>[]>([])

// LR0 specific state
const grammarRules = ref<{ left: string; right: string[] }[]>([
  { left: 'S', right: ['E'] },
  { left: 'E', right: ['E', '+', 'T'] },
  { left: 'E', right: ['T'] },
  { left: 'T', right: ['T', '*', 'F'] },
  { left: 'T', right: ['F'] },
  { left: 'F', right: ['(', 'E', ')'] },
  { left: 'F', right: ['id'] },
])

const conflictCount = ref(0)

// Node and edge types
const nodeTypes = {
  rectangle: RectangleNode,
}

const edgeTypes = {
  custom: CustomEdge,
}

// Canvas configuration
const canvasConfig = {
  minZoom: 0.1,
  maxZoom: 2,
  fitViewOnInit: true,
  showControls: true,
  showBackground: true,
  backgroundPattern: 'dots' as const,
  backgroundGap: 20,
  backgroundSize: 1,
  backgroundColor: '#e5e7eb',
}

// Event handlers
const onNodeClick = (event: { node: Node; event: MouseTouchEvent }) => {
  // LR0-specific node click handling
  console.log('LR0 Node clicked:', event.node)
}

const onEdgeClick = (event: { edge: Edge; event: MouseTouchEvent }) => {
  // LR0-specific edge click handling
  console.log('LR0 Edge clicked:', event.edge)
}

const onPaneClick = (event: MouseEvent) => {
  // Handle pane click
}

const onConnect = (connection: Connection) => {
  // LR0-specific connection handling
  const newEdge = {
    id: `edge-${Date.now()}`,
    source: connection.source,
    target: connection.target,
    type: 'custom',
    data: {
      label: 'a',
      isEditing: false,
    },
  }
  addEdges([newEdge])
  edges.value.push(newEdge)
}

const onPaneDoubleClick = (event: MouseEvent) => {
  // Handle double click to create new node
}

const onPaneContextMenu = (event: MouseEvent) => {
  // Handle right click
}

const onPaneReady = (instance: any) => {
  // Handle pane ready
}

// Toolbar buttons
const toolbarButtons = computed(() => [
  {
    label: '添加项目集',
    action: addItemSet,
    variant: 'primary' as const,
  },
  {
    label: '设置初始状态',
    action: setInitialState,
    variant: 'secondary' as const,
    disabled: !hasSelectedNode.value,
  },
  {
    label: '计算闭包',
    action: computeClosure,
    variant: 'success' as const,
    disabled: !hasSelectedNode.value,
  },
  {
    label: '自动构造',
    action: autoConstruct,
    variant: 'warning' as const,
  },
  {
    label: '清空画布',
    action: clearCanvas,
    variant: 'danger' as const,
  },
])

// Computed properties
const hasSelectedNode = computed(() => {
  return nodes.value.some((node) => node.id) // Simplified check
})

// Methods
const addItemSet = () => {
  // 创建示例 LR 项目
  const sampleItems: LRItem[] = [
    LRItemUtils.create('E', ['E', '+', 'T'], 1), // E → E • + T
    LRItemUtils.create('E', ['T'], 0), // E → • T
  ]

  const newNode = {
    id: `node-${Date.now()}`,
    type: 'rectangle',
    position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
    data: {
      label: `I${nodes.value.length}`,
      items: sampleItems,
      isInitial: nodes.value.length === 0, // 第一个节点为初始状态
    },
  }
  addNodes([newNode])
  nodes.value.push(newNode as any) // Type assertion for compatibility
}

const setInitialState = () => {
  const selectedNode = nodes.value.find((node) => node.data?.isInitial)
  if (selectedNode) {
    nodes.value.forEach((node) => {
      if (node.data) {
        node.data.isInitial = false
      }
    })
    if (selectedNode.data) {
      selectedNode.data.isInitial = true
    }
  }
}

const computeClosure = () => {
  // 简化实现：使用第一个节点或初始状态节点
  const selectedNode = nodes.value.find((node) => node.data?.isInitial) || nodes.value[0]
  if (!selectedNode || !selectedNode.data?.items) {
    alert('请先创建一个项目集节点')
    return
  }

  // 使用 LRItemUtils 计算闭包
  const items = selectedNode.data.items as LRItem[]
  const closure = computeItemClosure(items)

  // 更新节点的项目集
  selectedNode.data.items = closure

  alert(`闭包计算完成，共 ${closure.length} 个项目`)
}

const computeItemClosure = (items: LRItem[]): LRItem[] => {
  return LRItemUtils.computeClosure(items, grammarRules.value)
}

const isNonTerminal = (symbol: string): boolean => {
  return GrammarUtils.isNonTerminal(symbol)
}

const autoConstruct = () => {
  if (grammarRules.value.length === 0) {
    alert('请先添加文法规则')
    return
  }

  // 清空现有节点和边
  removeNodes(nodes.value)
  removeEdges(edges.value)
  nodes.value = []
  edges.value = []

  // 创建增广文法
  const augmentedRules = GrammarUtils.createAugmentedGrammar(grammarRules.value)
  const initialItem = LRItemUtils.create(augmentedRules[0].left, augmentedRules[0].right, 0)

  // 创建初始状态 I0
  const i0Items = computeItemClosure([initialItem])
  const i0 = {
    id: 'I0',
    type: 'rectangle',
    position: { x: 100, y: 100 },
    data: {
      label: 'I0',
      items: i0Items,
      isInitial: true,
    },
  }

  addNodes([i0])
  nodes.value.push(i0 as any)

  // 显示增广文法信息
  const augmentedInfo = augmentedRules
    .map((rule, index) => `${index}. ${GrammarUtils.formatProduction(rule)}`)
    .join('\n')

  alert(
    `自动构造完成！\n\n增广文法：\n${augmentedInfo}\n\n创建了初始状态 I0，包含 ${i0Items.length} 个项目`,
  )
}

const computeGoto = (items: LRItem[], symbol: string): LRItem[] => {
  return LRItemUtils.computeGoto(items, symbol, grammarRules.value)
}

const getStateKey = (items: LRItem[]): string => {
  return LRItemUtils.getStateKey(items)
}

const addGrammarRule = () => {
  const left = prompt('输入产生式左部 (如: E):')
  const right = prompt('输入产生式右部 (用空格分隔, 如: E + T):')

  if (left && right) {
    grammarRules.value.push({
      left: left.trim(),
      right: right.trim().split(/\s+/),
    })
  }
}

const generateLR0Table = () => {
  alert('LR0 分析表生成功能开发中...')
}

const checkConflicts = () => {
  // Simplified conflict checking
  conflictCount.value = 0
  alert('冲突检查功能开发中...')
}

const clearCanvas = () => {
  if (confirm('确定要清空画布吗？')) {
    removeNodes(nodes.value)
    removeEdges(edges.value)
    nodes.value = []
    edges.value = []
    conflictCount.value = 0
  }
}
</script>

<style scoped>
:deep(.lr0-mode) {
  background: #f0fdf4;
}

:deep(.lr0-mode .vue-flow__node-rectangle) {
  border-color: #16a34a;
}

:deep(.lr0-mode .vue-flow__edge-custom) {
  stroke: #16a34a;
}

.lr0-panel {
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.grammar-rules {
  max-height: 120px;
  overflow-y: auto;
  font-size: 0.875rem;
}

.rule {
  display: flex;
  margin-bottom: 0.25rem;
  padding: 0.25rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
}

.rule-number {
  font-weight: 600;
  margin-right: 0.5rem;
  color: #059669;
}

.rule-text {
  font-family: monospace;
}

.stats {
  display: grid;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.stat-label {
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: #059669;
}
</style>
