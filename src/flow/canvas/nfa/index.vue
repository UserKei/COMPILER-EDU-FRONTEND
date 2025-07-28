<template>
  <BaseCanvas
    title="NFA 编辑器"
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    :edge-types="edgeTypes"
    canvas-class="nfa-mode"
    :config="canvasConfig"
    :toolbar-buttons="toolbarButtons"
    @connect="onConnect"
    @node-click="onNodeClick"
    @edge-click="onEdgeClick"
    @pane-click="onPaneClick"
    @pane-double-click="onPaneDoubleClick"
    @pane-context-menu="onPaneContextMenu"
    @pane-ready="onPaneReady"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { Node, Edge, Connection, MouseTouchEvent } from '@vue-flow/core'

import BaseCanvas from '../base/index.vue'
import CircleNode from '../../nodes/circle/index.vue'
import CustomEdge from '../../edges/index.vue'
import type { NodeData, EdgeData } from '../../types'

// Vue Flow instance
const { findNode, findEdge, addNodes, addEdges, removeNodes, removeEdges } = useVueFlow()

// Canvas state
const nodes = ref<Node<NodeData>[]>([])
const edges = ref<Edge<EdgeData>[]>([])

// Node and edge types
const nodeTypes = {
  circle: CircleNode,
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
  // NFA-specific node click handling
  console.log('NFA Node clicked:', event.node)
}

const onEdgeClick = (event: { edge: Edge; event: MouseTouchEvent }) => {
  // NFA-specific edge click handling
  console.log('NFA Edge clicked:', event.edge)
}

const onPaneClick = (event: MouseEvent) => {
  // Handle pane click
}

const onConnect = (connection: Connection) => {
  // NFA-specific connection handling - allows epsilon transitions and multiple transitions
  console.log('NFA Connection:', connection)
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
    label: '添加状态',
    action: addState,
    variant: 'primary' as const,
  },
  {
    label: '设置初始',
    action: setInitialState,
    variant: 'secondary' as const,
    disabled: !hasSelectedNode.value,
  },
  {
    label: '设置终结',
    action: setFinalState,
    variant: 'success' as const,
    disabled: !hasSelectedNode.value,
  },
  {
    label: '验证NFA',
    action: validateNFA,
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
const addState = () => {
  const newNode = {
    id: `node-${Date.now()}`,
    type: 'circle',
    position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
    data: {
      label: `q${nodes.value.length}`,
      isInitial: false,
      isFinal: false,
    },
  }
  addNodes([newNode])
  nodes.value.push(newNode)
}

const setInitialState = () => {
  const selectedNode = nodes.value.find((node) => node.data?.isInitial)
  if (selectedNode) {
    // Remove initial state from other nodes
    nodes.value.forEach((node) => {
      if (node.data) {
        node.data.isInitial = false
      }
    })
    // Set current node as initial
    if (selectedNode.data) {
      selectedNode.data.isInitial = true
    }
  }
}

const setFinalState = () => {
  // Simplified - just toggle first node as example
  if (nodes.value.length > 0 && nodes.value[0].data) {
    nodes.value[0].data.isFinal = !nodes.value[0].data.isFinal
  }
}

const validateNFA = () => {
  const hasInitial = nodes.value.some((node) => node.data?.isInitial)
  const hasFinal = nodes.value.some((node) => node.data?.isFinal)

  if (!hasInitial) {
    alert('NFA 必须有一个初始状态')
    return
  }

  if (!hasFinal) {
    alert('NFA 必须至少有一个终结状态')
    return
  }

  alert('NFA 验证通过！')
}

const clearCanvas = () => {
  if (confirm('确定要清空画布吗？')) {
    removeNodes(nodes.value)
    removeEdges(edges.value)
    nodes.value = []
    edges.value = []
  }
}
</script>

<style scoped>
:deep(.nfa-mode) {
  background: #fef3c7;
}

:deep(.nfa-mode .vue-flow__node-circle) {
  border-color: #f59e0b;
}

:deep(.nfa-mode .vue-flow__edge-custom) {
  stroke: #f59e0b;
}
</style>

<style scoped>
:deep(.nfa-mode) {
  background: #f8fafc;
}

:deep(.nfa-mode .vue-flow__node-circle) {
  border-color: #3b82f6;
}

:deep(.nfa-mode .vue-flow__edge-custom) {
  stroke: #3b82f6;
}
</style>
