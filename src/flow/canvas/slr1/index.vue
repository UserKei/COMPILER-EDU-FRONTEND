<template>
  <BaseCanvas
    title="SLR1 分析器"
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    :edge-types="edgeTypes"
    canvas-class="slr1-mode"
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
      <div class="slr1-panel">
        <h4 class="text-lg font-semibold mb-4">SLR1 分析</h4>

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

        <div class="follow-section mb-4">
          <h5 class="font-medium mb-2">FOLLOW 集</h5>
          <div class="follow-sets">
            <div v-for="(followSet, symbol) in followSets" :key="symbol" class="follow-item">
              <span class="symbol">FOLLOW({{ symbol }}):</span>
              <span class="set">{ {{ followSet.join(', ') }} }</span>
            </div>
          </div>
          <button
            @click="computeFollowSets"
            class="mt-2 px-3 py-1 bg-purple-500 text-white rounded text-sm"
          >
            计算 FOLLOW
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
            @click="generateSLR1Table"
            class="w-full mb-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            生成 SLR1 表
          </button>
          <button
            @click="checkSLR1Conflicts"
            class="w-full px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            检查 SLR1 冲突
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
import RectangleNode from '../../nodes/rectangle/index.vue'
import CustomEdge from '../../components/edges/index.vue'
import type { NodeData, EdgeData, LRItem } from '../../types'
import { LRItemUtils, GrammarUtils } from '../../utils'

// Vue Flow instance
const { findNode, findEdge, addNodes, addEdges, removeNodes, removeEdges } = useVueFlow()

// Canvas state
const nodes = ref<Node<NodeData>[]>([])
const edges = ref<Edge<EdgeData>[]>([])

// SLR1 specific state
const grammarRules = ref<{ left: string; right: string[] }[]>([
  { left: 'S', right: ['E'] },
  { left: 'E', right: ['E', '+', 'T'] },
  { left: 'E', right: ['T'] },
  { left: 'T', right: ['T', '*', 'F'] },
  { left: 'T', right: ['F'] },
  { left: 'F', right: ['(', 'E', ')'] },
  { left: 'F', right: ['id'] },
])

const followSets = ref<Record<string, string[]>>({})
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
  // 简化实现：检查是否有初始状态节点或第一个节点
  return nodes.value.length > 0
})

// Methods
const addItemSet = () => {
  // 创建示例 LR 项目使用工具类
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
  nodes.value.push(newNode as any)
}

const setInitialState = () => {
  // 简化实现：设置第一个节点为初始状态
  const targetNode = nodes.value[0]
  if (targetNode) {
    nodes.value.forEach((node) => {
      if (node.data) {
        node.data.isInitial = false
      }
    })
    if (targetNode.data) {
      targetNode.data.isInitial = true
    }
  }
}

const computeClosure = () => {
  // 简化实现：使用第一个节点或初始状态节点
  const selectedNode = nodes.value.find((node) => node.data?.isInitial) || nodes.value[0]
  if (selectedNode && selectedNode.data) {
    const items = (selectedNode.data.items as LRItem[]) || []
    const closure = computeItemClosure(items)
    selectedNode.data.items = closure

    const itemCount = closure.length
    selectedNode.style = {
      ...selectedNode.style,
      width: `${Math.max(120, itemCount * 30)}px`,
      height: `${Math.max(80, itemCount * 25)}px`,
    }

    alert(`闭包计算完成，共 ${closure.length} 个项目`)
  }
}

const computeItemClosure = (items: LRItem[]): LRItem[] => {
  return LRItemUtils.computeClosure(items, grammarRules.value)
}

const isNonTerminal = (symbol: string): boolean => {
  return GrammarUtils.isNonTerminal(symbol)
}

const computeFollowSets = () => {
  const follow: Record<string, Set<string>> = {}

  // Get all non-terminals using grammar utils
  const symbols = GrammarUtils.getAllSymbols(grammarRules.value)
  const nonTerminals = symbols.nonTerminals

  // Initialize FOLLOW sets
  for (const nt of nonTerminals) {
    follow[nt] = new Set()
  }

  // Start symbol gets $ in its FOLLOW set
  if (nonTerminals.length > 0) {
    follow[nonTerminals[0]].add('$')
  }

  let changed = true
  while (changed) {
    changed = false

    for (const rule of grammarRules.value) {
      for (let i = 0; i < rule.right.length; i++) {
        const symbol = rule.right[i]

        if (GrammarUtils.isNonTerminal(symbol)) {
          const oldSize = follow[symbol].size

          // Add FIRST of everything after this symbol
          for (let j = i + 1; j < rule.right.length; j++) {
            const nextSymbol = rule.right[j]

            if (!GrammarUtils.isNonTerminal(nextSymbol)) {
              follow[symbol].add(nextSymbol)
              break
            } else {
              // Add FIRST(nextSymbol) - {ε} to FOLLOW(symbol)
              const firstSet = computeFirstSet(nextSymbol)
              for (const first of firstSet) {
                if (first !== 'ε') {
                  follow[symbol].add(first)
                }
              }

              // If ε not in FIRST(nextSymbol), break
              if (!firstSet.has('ε')) {
                break
              }
            }
          }

          // If we're at the end or all following symbols derive ε
          // Add FOLLOW(rule.left) to FOLLOW(symbol)
          let allDeriveEpsilon = true
          for (let j = i + 1; j < rule.right.length; j++) {
            const nextSymbol = rule.right[j]
            if (!GrammarUtils.isNonTerminal(nextSymbol) || !computeFirstSet(nextSymbol).has('ε')) {
              allDeriveEpsilon = false
              break
            }
          }

          if (i === rule.right.length - 1 || allDeriveEpsilon) {
            for (const followSymbol of follow[rule.left]) {
              follow[symbol].add(followSymbol)
            }
          }

          if (follow[symbol].size > oldSize) {
            changed = true
          }
        }
      }
    }
  }

  // Convert sets to arrays
  const result: Record<string, string[]> = {}
  for (const [symbol, set] of Object.entries(follow)) {
    result[symbol] = Array.from(set).sort()
  }

  followSets.value = result

  // Show computed FOLLOW sets
  const followInfo = Object.entries(result)
    .map(([symbol, set]) => `FOLLOW(${symbol}) = { ${set.join(', ')} }`)
    .join('\n')

  alert(`FOLLOW 集合计算完成：\n${followInfo}`)
}

const computeFirstSet = (symbol: string): Set<string> => {
  const first = new Set<string>()

  if (!GrammarUtils.isNonTerminal(symbol)) {
    first.add(symbol)
    return first
  }

  const productions = grammarRules.value.filter((rule) => rule.left === symbol)

  for (const production of productions) {
    if (production.right.length === 0 || GrammarUtils.isEpsilon(production.right[0])) {
      first.add('ε')
    } else {
      for (let i = 0; i < production.right.length; i++) {
        const currentSymbol = production.right[i]

        if (!GrammarUtils.isNonTerminal(currentSymbol)) {
          first.add(currentSymbol)
          break
        } else {
          const symbolFirst = computeFirstSet(currentSymbol)
          for (const f of symbolFirst) {
            if (f !== 'ε') {
              first.add(f)
            }
          }

          if (!symbolFirst.has('ε')) {
            break
          }

          if (i === production.right.length - 1) {
            first.add('ε')
          }
        }
      }
    }
  }

  return first
}

const autoConstruct = () => {
  // First compute FOLLOW sets
  computeFollowSets()

  // Clear existing nodes and edges
  removeNodes(nodes.value)
  removeEdges(edges.value)
  nodes.value = []
  edges.value = []

  // Create augmented grammar and initial state I0
  const augmentedRules = GrammarUtils.createAugmentedGrammar(grammarRules.value)
  const initialItem = LRItemUtils.create(augmentedRules[0].left, augmentedRules[0].right, 0)

  const i0 = {
    id: 'I0',
    type: 'rectangle',
    position: { x: 100, y: 100 },
    data: {
      label: 'I0',
      items: computeItemClosure([initialItem]),
      isInitial: true,
    },
  }

  addNodes([i0])
  nodes.value.push(i0 as any)

  // Queue for processing states
  const queue = [i0]
  const processed = new Set<string>()

  while (queue.length > 0) {
    const currentState = queue.shift()!
    const stateKey = getStateKey((currentState.data?.items as LRItem[]) || [])

    if (processed.has(stateKey)) continue
    processed.add(stateKey)

    const symbols = new Set<string>()
    const items = (currentState.data?.items as LRItem[]) || []

    for (const item of items) {
      const nextSymbol = LRItemUtils.getNextSymbol(item)
      if (nextSymbol) {
        symbols.add(nextSymbol)
      }
    }

    for (const symbol of symbols) {
      const gotoItems = computeGoto(items, symbol)
      if (gotoItems.length > 0) {
        const gotoKey = getStateKey(gotoItems)

        let targetState = nodes.value.find((node) => {
          const nodeItems = (node.data?.items as LRItem[]) || []
          return getStateKey(nodeItems) === gotoKey
        })

        if (!targetState) {
          const stateNumber = nodes.value.length
          targetState = {
            id: `I${stateNumber}`,
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
          }

          addNodes([targetState])
          nodes.value.push(targetState as any)
          queue.push(targetState as any)
        }

        const newEdge = {
          id: `e${currentState.id}-${targetState.id}-${Date.now()}`,
          source: currentState.id,
          target: targetState.id,
          type: 'custom',
          data: {
            label: symbol,
            isEditing: false,
          },
        }

        addEdges([newEdge])
        edges.value.push(newEdge as any)
      }
    }
  }

  alert(`SLR1 自动构造完成！创建了 ${nodes.value.length} 个状态，${edges.value.length} 个转移`)
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

const generateSLR1Table = () => {
  alert('SLR1 分析表生成功能开发中...')
}

const checkSLR1Conflicts = () => {
  conflictCount.value = 0

  for (const node of nodes.value) {
    const items = (node.data?.items as LRItem[]) || []

    const reduceItems = items.filter((item) => LRItemUtils.isReducible(item))
    const shiftItems = items.filter((item) => !LRItemUtils.isReducible(item))

    // Check for shift-reduce conflicts using FOLLOW sets
    for (const reduceItem of reduceItems) {
      const followSet = followSets.value[reduceItem.production.left] || []

      for (const shiftItem of shiftItems) {
        const nextSymbol = LRItemUtils.getNextSymbol(shiftItem)
        if (nextSymbol && followSet.includes(nextSymbol)) {
          conflictCount.value++
        }
      }
    }

    // Check for reduce-reduce conflicts using FOLLOW sets
    for (let i = 0; i < reduceItems.length; i++) {
      for (let j = i + 1; j < reduceItems.length; j++) {
        const follow1 = followSets.value[reduceItems[i].production.left] || []
        const follow2 = followSets.value[reduceItems[j].production.left] || []

        const intersection = follow1.filter((symbol) => follow2.includes(symbol))
        if (intersection.length > 0) {
          conflictCount.value++
        }
      }
    }
  }

  if (conflictCount.value > 0) {
    alert(`发现 ${conflictCount.value} 个 SLR1 冲突`)
  } else {
    alert('未发现冲突，该文法是 SLR1 文法')
  }
}

const clearCanvas = () => {
  if (confirm('确定要清空画布吗？')) {
    removeNodes(nodes.value)
    removeEdges(edges.value)
    nodes.value = []
    edges.value = []
    followSets.value = {}
    conflictCount.value = 0
  }
}

// Event handlers
const onConnect = (connection: Connection) => {
  const newEdge = {
    id: `e${connection.source}-${connection.target}-${Date.now()}`,
    source: connection.source,
    target: connection.target,
    type: 'custom',
    data: {
      label: 'a',
      isEditing: false,
    },
  }
  addEdges([newEdge])
  edges.value.push(newEdge as any)
}

const onNodeClick = (event: { node: Node; event: MouseTouchEvent }) => {
  // SLR1-specific node click handling
  console.log('SLR1 Node clicked:', event.node)
}

const onEdgeClick = (event: { edge: Edge; event: MouseTouchEvent }) => {
  // SLR1-specific edge click handling
  console.log('SLR1 Edge clicked:', event.edge)
}

const onPaneClick = (event: MouseEvent) => {
  // Handle pane click
}

const onPaneDoubleClick = (event: MouseEvent) => {
  // Handle double click to create new node
  const rect = (event.target as Element).getBoundingClientRect()
  const position = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }

  const newNode = {
    id: `node-${Date.now()}`,
    type: 'rectangle',
    position,
    data: {
      label: `I${nodes.value.length}`,
      items: [] as LRItem[],
      isInitial: false,
    },
  }
  addNodes([newNode])
  nodes.value.push(newNode as any)
}

const onPaneContextMenu = (event: MouseEvent) => {
  // Handle right click
  event.preventDefault()
}

const onPaneReady = (vueFlowInstance: any) => {
  console.log('SLR1 Canvas ready:', vueFlowInstance)
}
</script>

<style scoped>
:deep(.slr1-mode) {
  background: #fefce8;
}

:deep(.slr1-mode .vue-flow__node-rectangle) {
  border-color: #eab308;
}

:deep(.slr1-mode .vue-flow__edge-custom) {
  stroke: #eab308;
}

.slr1-panel {
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.grammar-rules {
  max-height: 100px;
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
  color: #ca8a04;
}

.rule-text {
  font-family: monospace;
}

.follow-sets {
  max-height: 100px;
  overflow-y: auto;
  font-size: 0.875rem;
}

.follow-item {
  display: flex;
  margin-bottom: 0.25rem;
  padding: 0.25rem;
  background: #fef3c7;
  border-radius: 0.25rem;
}

.symbol {
  font-weight: 600;
  margin-right: 0.5rem;
  color: #92400e;
}

.set {
  font-family: monospace;
  color: #451a03;
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
  color: #ca8a04;
}
</style>
