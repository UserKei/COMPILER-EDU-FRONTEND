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
import type { Node, Edge, Connection } from '@vue-flow/core'

import BaseCanvas from '../base/index.vue'
import RectangleNode from '../../components/rectangleNode/index.vue'
import CustomEdge from '../../components/edges/index.vue'
import {
  useNodeCreation,
  useNodeState,
  useEdgeManagement,
  useCanvasEvents,
} from '../../composables'
import type { NodeData, EdgeData, LRItem } from '../../types'

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

// Composables
const { createNode } = useNodeCreation()
const { updateNodeState } = useNodeState()
const { createEdge, updateEdgeLabel } = useEdgeManagement()
const {
  handlePaneClick,
  handleNodeClick,
  handleEdgeClick,
  handleConnection,
  handlePaneDoubleClick,
  handlePaneContextMenu,
} = useCanvasEvents()

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
  return nodes.value.some((node) => node.selected)
})

// Methods
const addItemSet = () => {
  const newNode = createNode({
    type: 'rectangle',
    position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
    data: {
      label: `I${nodes.value.length}`,
      items: [] as LRItem[],
      isInitial: false,
    },
  })
  addNodes([newNode])
  nodes.value.push(newNode)
}

const setInitialState = () => {
  const selectedNode = nodes.value.find((node) => node.selected)
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
  const selectedNode = nodes.value.find((node) => node.selected)
  if (selectedNode && selectedNode.data) {
    const items = (selectedNode.data.items as LRItem[]) || []
    const closure = computeItemClosure(items)
    selectedNode.data.items = closure

    // Update node size based on items
    const itemCount = closure.length
    selectedNode.style = {
      ...selectedNode.style,
      width: `${Math.max(120, itemCount * 30)}px`,
      height: `${Math.max(80, itemCount * 25)}px`,
    }
  }
}

const computeItemClosure = (items: LRItem[]): LRItem[] => {
  const closure = [...items]
  let changed = true

  while (changed) {
    changed = false

    for (const item of closure) {
      if (item.dotPosition < item.production.right.length) {
        const nextSymbol = item.production.right[item.dotPosition]

        // If next symbol is non-terminal, add its productions
        if (isNonTerminal(nextSymbol)) {
          const productions = grammarRules.value.filter((rule) => rule.left === nextSymbol)

          for (const production of productions) {
            const newItem: LRItem = {
              production,
              dotPosition: 0,
            }

            // Check if item already exists
            const exists = closure.some(
              (existingItem) =>
                existingItem.production.left === newItem.production.left &&
                existingItem.production.right.join('') === newItem.production.right.join('') &&
                existingItem.dotPosition === newItem.dotPosition,
            )

            if (!exists) {
              closure.push(newItem)
              changed = true
            }
          }
        }
      }
    }
  }

  return closure
}

const isNonTerminal = (symbol: string): boolean => {
  return symbol === symbol.toUpperCase() && symbol.length === 1
}

const autoConstruct = () => {
  // Clear existing nodes and edges
  removeNodes(nodes.value)
  removeEdges(edges.value)
  nodes.value = []
  edges.value = []

  // Create initial state I0
  const initialItem: LRItem = {
    production: { left: "S'", right: ['S'] },
    dotPosition: 0,
  }

  const i0 = createNode({
    type: 'rectangle',
    position: { x: 100, y: 100 },
    data: {
      label: 'I0',
      items: computeItemClosure([initialItem]),
      isInitial: true,
    },
  })

  addNodes([i0])
  nodes.value.push(i0)

  // Queue for processing states
  const queue = [i0]
  const processed = new Set<string>()

  while (queue.length > 0) {
    const currentState = queue.shift()!
    const stateKey = getStateKey((currentState.data?.items as LRItem[]) || [])

    if (processed.has(stateKey)) continue
    processed.add(stateKey)

    // Get all symbols after dots
    const symbols = new Set<string>()
    const items = (currentState.data?.items as LRItem[]) || []

    for (const item of items) {
      if (item.dotPosition < item.production.right.length) {
        symbols.add(item.production.right[item.dotPosition])
      }
    }

    // Create goto states for each symbol
    for (const symbol of symbols) {
      const gotoItems = computeGoto(items, symbol)
      if (gotoItems.length > 0) {
        const gotoKey = getStateKey(gotoItems)

        // Check if state already exists
        let targetState = nodes.value.find((node) => {
          const nodeItems = (node.data?.items as LRItem[]) || []
          return getStateKey(nodeItems) === gotoKey
        })

        if (!targetState) {
          // Create new state
          const stateNumber = nodes.value.length
          targetState = createNode({
            type: 'rectangle',
            position: {
              x: 100 + (stateNumber % 4) * 200,
              y: 100 + Math.floor(stateNumber / 4) * 150,
            },
            data: {
              label: `I${stateNumber}`,
              items: gotoItems,
              isInitial: false,
            },
          })

          addNodes([targetState])
          nodes.value.push(targetState)
          queue.push(targetState)
        }

        // Create edge
        const newEdge = createEdge({
          source: currentState.id,
          target: targetState.id,
          type: 'custom',
          data: {
            label: symbol,
            isEditing: false,
          },
        })

        addEdges([newEdge])
        edges.value.push(newEdge)
      }
    }
  }
}

const computeGoto = (items: LRItem[], symbol: string): LRItem[] => {
  const gotoItems: LRItem[] = []

  for (const item of items) {
    if (
      item.dotPosition < item.production.right.length &&
      item.production.right[item.dotPosition] === symbol
    ) {
      gotoItems.push({
        production: item.production,
        dotPosition: item.dotPosition + 1,
      })
    }
  }

  return computeItemClosure(gotoItems)
}

const getStateKey = (items: LRItem[]): string => {
  return items
    .map((item) => `${item.production.left}->${item.production.right.join('')}.${item.dotPosition}`)
    .sort()
    .join('|')
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
  conflictCount.value = 0

  for (const node of nodes.value) {
    const items = (node.data?.items as LRItem[]) || []

    // Check for shift-reduce conflicts
    const reduceItems = items.filter((item) => item.dotPosition === item.production.right.length)
    const shiftItems = items.filter((item) => item.dotPosition < item.production.right.length)

    if (reduceItems.length > 0 && shiftItems.length > 0) {
      conflictCount.value++
    }

    // Check for reduce-reduce conflicts
    if (reduceItems.length > 1) {
      conflictCount.value++
    }
  }

  if (conflictCount.value > 0) {
    alert(`发现 ${conflictCount.value} 个冲突`)
  } else {
    alert('未发现冲突，该文法是 LR0 文法')
  }
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

// Event handlers
const onConnect = (connection: Connection) => {
  const newEdge = createEdge({
    ...connection,
    type: 'custom',
    data: {
      label: 'a',
      isEditing: false,
    },
  })
  addEdges([newEdge])
  edges.value.push(newEdge)
}

const onNodeClick = (event: { node: Node; event: MouseEvent }) => {
  handleNodeClick(event, {
    nodes: nodes.value,
    onNodeUpdate: (updatedNode) => {
      const index = nodes.value.findIndex((n) => n.id === updatedNode.id)
      if (index !== -1) {
        nodes.value[index] = updatedNode
      }
    },
  })
}

const onEdgeClick = (event: { edge: Edge; event: MouseEvent }) => {
  handleEdgeClick(event, {
    edges: edges.value,
    onEdgeUpdate: (updatedEdge) => {
      const index = edges.value.findIndex((e) => e.id === updatedEdge.id)
      if (index !== -1) {
        edges.value[index] = updatedEdge
      }
    },
  })
}

const onPaneClick = (event: MouseEvent) => {
  handlePaneClick(event, { nodes: nodes.value })
}

const onPaneDoubleClick = (event: MouseEvent) => {
  handlePaneDoubleClick(event, {
    onCreate: (position) => {
      const newNode = createNode({
        type: 'rectangle',
        position,
        data: {
          label: `I${nodes.value.length}`,
          items: [] as LRItem[],
          isInitial: false,
        },
      })
      addNodes([newNode])
      nodes.value.push(newNode)
    },
  })
}

const onPaneContextMenu = (event: MouseEvent) => {
  handlePaneContextMenu(event)
}

const onPaneReady = (vueFlowInstance: any) => {
  console.log('LR0 Canvas ready:', vueFlowInstance)
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
