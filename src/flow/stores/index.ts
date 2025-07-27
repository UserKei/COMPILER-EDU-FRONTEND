/**
 * Vue Flow 状态管理
 * 使用 Pinia 管理 Flow 相关的全局状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import type { CanvasMode, CanvasConfig, NodeData } from '../types'

/**
 * Flow 画布状态管理
 */
export const useFlowCanvasStore = defineStore('flowCanvas', () => {
  // 状态
  const currentMode = ref<CanvasMode>('nfa')
  const canvasConfig = ref<CanvasConfig>({
    mode: 'nfa',
    minZoom: 0.2,
    maxZoom: 4,
    defaultZoom: 1,
    showControls: true,
    showBackground: true,
    backgroundPattern: 'dots',
    backgroundGap: 20,
  })

  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])
  const isGridSnapEnabled = ref(false)
  const gridSize = ref(20)

  // 计算属性
  const nodeCount = computed(() => nodes.value.length)
  const edgeCount = computed(() => edges.value.length)

  const initialNodes = computed(() =>
    nodes.value.filter((node) => (node.data as NodeData)?.isInitial),
  )

  const finalNodes = computed(() => nodes.value.filter((node) => (node.data as NodeData)?.isFinal))

  const hasValidStructure = computed(() => {
    if (currentMode.value === 'dfa') {
      return initialNodes.value.length === 1 && finalNodes.value.length > 0
    }
    return initialNodes.value.length > 0
  })

  // 动作
  const setMode = (mode: CanvasMode) => {
    currentMode.value = mode
    canvasConfig.value.mode = mode
  }

  const updateConfig = (config: Partial<CanvasConfig>) => {
    canvasConfig.value = { ...canvasConfig.value, ...config }
  }

  const addNode = (node: Node) => {
    nodes.value.push(node)
  }

  const removeNode = (nodeId: string) => {
    const index = nodes.value.findIndex((n) => n.id === nodeId)
    if (index !== -1) {
      nodes.value.splice(index, 1)
    }
    // 同时移除相关的边
    edges.value = edges.value.filter((e) => e.source !== nodeId && e.target !== nodeId)
  }

  const updateNode = (nodeId: string, updates: Partial<Node>) => {
    const index = nodes.value.findIndex((n) => n.id === nodeId)
    if (index !== -1) {
      nodes.value[index] = { ...nodes.value[index], ...updates }
    }
  }

  const addEdge = (edge: Edge) => {
    edges.value.push(edge)
  }

  const removeEdge = (edgeId: string) => {
    const index = edges.value.findIndex((e) => e.id === edgeId)
    if (index !== -1) {
      edges.value.splice(index, 1)
    }
  }

  const updateEdge = (edgeId: string, updates: Partial<Edge>) => {
    const index = edges.value.findIndex((e) => e.id === edgeId)
    if (index !== -1) {
      edges.value[index] = { ...edges.value[index], ...updates }
    }
  }

  const clearCanvas = () => {
    nodes.value = []
    edges.value = []
  }

  const setInitialNode = (nodeId: string) => {
    // 如果是 DFA 模式，只能有一个初始状态
    if (currentMode.value === 'dfa') {
      nodes.value.forEach((node) => {
        if (node.data) {
          ;(node.data as NodeData).isInitial = node.id === nodeId
        }
      })
    } else {
      // NFA 模式可以有多个初始状态
      const node = nodes.value.find((n) => n.id === nodeId)
      if (node && node.data) {
        ;(node.data as NodeData).isInitial = !(node.data as NodeData).isInitial
      }
    }
  }

  const setFinalNode = (nodeId: string, isFinal?: boolean) => {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node && node.data) {
      ;(node.data as NodeData).isFinal = isFinal ?? !(node.data as NodeData).isFinal
    }
  }

  const resetNodeStates = (nodeId: string) => {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node && node.data) {
      ;(node.data as NodeData).isInitial = false
      ;(node.data as NodeData).isFinal = false
    }
  }

  const toggleGridSnap = () => {
    isGridSnapEnabled.value = !isGridSnapEnabled.value
  }

  const setGridSize = (size: number) => {
    gridSize.value = Math.max(10, Math.min(50, size))
  }

  // 导出状态和方法
  return {
    // 状态
    currentMode,
    canvasConfig,
    nodes,
    edges,
    isGridSnapEnabled,
    gridSize,

    // 计算属性
    nodeCount,
    edgeCount,
    initialNodes,
    finalNodes,
    hasValidStructure,

    // 动作
    setMode,
    updateConfig,
    addNode,
    removeNode,
    updateNode,
    addEdge,
    removeEdge,
    updateEdge,
    clearCanvas,
    setInitialNode,
    setFinalNode,
    resetNodeStates,
    toggleGridSnap,
    setGridSize,
  }
})

/**
 * Flow 编辑器状态管理
 */
export const useFlowEditorStore = defineStore('flowEditor', () => {
  // 状态
  const selectedNodes = ref<string[]>([])
  const selectedEdges = ref<string[]>([])
  const clipboard = ref<{ nodes: Node[]; edges: Edge[] } | null>(null)
  const history = ref<{ nodes: Node[]; edges: Edge[] }[]>([])
  const historyIndex = ref(-1)
  const maxHistorySize = ref(50)

  // 计算属性
  const hasSelection = computed(
    () => selectedNodes.value.length > 0 || selectedEdges.value.length > 0,
  )

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.value.length - 1)

  // 动作
  const selectNode = (nodeId: string, multiple = false) => {
    if (multiple) {
      if (!selectedNodes.value.includes(nodeId)) {
        selectedNodes.value.push(nodeId)
      }
    } else {
      selectedNodes.value = [nodeId]
      selectedEdges.value = []
    }
  }

  const selectEdge = (edgeId: string, multiple = false) => {
    if (multiple) {
      if (!selectedEdges.value.includes(edgeId)) {
        selectedEdges.value.push(edgeId)
      }
    } else {
      selectedEdges.value = [edgeId]
      selectedNodes.value = []
    }
  }

  const deselectNode = (nodeId: string) => {
    const index = selectedNodes.value.indexOf(nodeId)
    if (index !== -1) {
      selectedNodes.value.splice(index, 1)
    }
  }

  const deselectEdge = (edgeId: string) => {
    const index = selectedEdges.value.indexOf(edgeId)
    if (index !== -1) {
      selectedEdges.value.splice(index, 1)
    }
  }

  const clearSelection = () => {
    selectedNodes.value = []
    selectedEdges.value = []
  }

  const selectAll = (nodes: Node[], edges: Edge[]) => {
    selectedNodes.value = nodes.map((n) => n.id)
    selectedEdges.value = edges.map((e) => e.id)
  }

  const copySelection = (nodes: Node[], edges: Edge[]) => {
    const selectedNodeIds = new Set(selectedNodes.value)
    const selectedEdgeIds = new Set(selectedEdges.value)

    const copiedNodes = nodes.filter((n) => selectedNodeIds.has(n.id))
    const copiedEdges = edges.filter(
      (e) =>
        selectedEdgeIds.has(e.id) ||
        (selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)),
    )

    clipboard.value = {
      nodes: JSON.parse(JSON.stringify(copiedNodes)),
      edges: JSON.parse(JSON.stringify(copiedEdges)),
    }
  }

  const pasteFromClipboard = (offset = { x: 50, y: 50 }) => {
    if (!clipboard.value) return { nodes: [], edges: [] }

    const idMapping = new Map<string, string>()
    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    // 复制节点并生成新ID
    clipboard.value.nodes.forEach((node) => {
      const newId = `${node.id}-copy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      idMapping.set(node.id, newId)

      newNodes.push({
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y,
        },
      })
    })

    // 复制边并更新ID映射
    clipboard.value.edges.forEach((edge) => {
      const newSourceId = idMapping.get(edge.source)
      const newTargetId = idMapping.get(edge.target)

      if (newSourceId && newTargetId) {
        const newEdgeId = `e${newSourceId}-${newTargetId}-${Date.now()}`

        newEdges.push({
          ...edge,
          id: newEdgeId,
          source: newSourceId,
          target: newTargetId,
        })
      }
    })

    return { nodes: newNodes, edges: newEdges }
  }

  const saveToHistory = (nodes: Node[], edges: Edge[]) => {
    // 移除当前位置之后的历史记录
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }

    // 添加新的历史记录
    history.value.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    })

    // 限制历史记录大小
    if (history.value.length > maxHistorySize.value) {
      history.value.shift()
    } else {
      historyIndex.value++
    }
  }

  const undo = () => {
    if (canUndo.value) {
      historyIndex.value--
      return history.value[historyIndex.value]
    }
    return null
  }

  const redo = () => {
    if (canRedo.value) {
      historyIndex.value++
      return history.value[historyIndex.value]
    }
    return null
  }

  const clearHistory = () => {
    history.value = []
    historyIndex.value = -1
  }

  return {
    // 状态
    selectedNodes,
    selectedEdges,
    clipboard,
    history,
    historyIndex,
    maxHistorySize,

    // 计算属性
    hasSelection,
    canUndo,
    canRedo,

    // 动作
    selectNode,
    selectEdge,
    deselectNode,
    deselectEdge,
    clearSelection,
    selectAll,
    copySelection,
    pasteFromClipboard,
    saveToHistory,
    undo,
    redo,
    clearHistory,
  }
})
