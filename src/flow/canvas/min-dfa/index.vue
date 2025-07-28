<template>
  <BaseCanvas
    title="最小化 DFA 编辑器"
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    :edge-types="edgeTypes"
    canvas-class="min-dfa-mode"
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
      <div class="minimization-panel">
        <h4 class="text-lg font-semibold mb-4">最小化分析</h4>

        <div class="equivalence-classes mb-4">
          <h5 class="font-medium mb-2">等价类</h5>
          <div v-for="(group, index) in equivalenceClasses" :key="index" class="eq-class">
            <span class="text-sm font-medium">类 {{ index + 1 }}:</span>
            <span class="text-sm text-gray-600">{{ group.join(', ') }}</span>
          </div>
        </div>

        <div class="minimization-steps">
          <h5 class="font-medium mb-2">最小化步骤</h5>
          <div v-for="(step, index) in minimizationSteps" :key="index" class="step">
            <span class="step-number">{{ index + 1 }}.</span>
            <span class="step-description">{{ step }}</span>
          </div>
        </div>

        <button
          @click="performMinimization"
          class="w-full mt-4 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          执行最小化
        </button>
      </div>
    </template>
  </BaseCanvas>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { Node, Edge, Connection } from '@vue-flow/core'

import BaseCanvas from '../base/index.vue'
import CircleNode from '../../components/circleNode/index.vue'
import CustomEdge from '../../components/edges/index.vue'
import {
  useNodeCreation,
  useNodeState,
  useEdgeManagement,
  useCanvasEvents,
} from '../../composables'
import type { NodeData, EdgeData } from '../../types'

// Vue Flow instance
const { findNode, findEdge, addNodes, addEdges, removeNodes, removeEdges } = useVueFlow()

// Canvas state
const nodes = ref<Node<NodeData>[]>([])
const edges = ref<Edge<EdgeData>[]>([])

// Minimization state
const equivalenceClasses = ref<string[][]>([])
const minimizationSteps = ref<string[]>([])

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
    label: '分析等价性',
    action: analyzeEquivalence,
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
const addState = () => {
  const newNode = createNode({
    type: 'circle',
    position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
    data: {
      label: `q${nodes.value.length}`,
      isInitial: false,
      isFinal: false,
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

const setFinalState = () => {
  const selectedNode = nodes.value.find((node) => node.selected)
  if (selectedNode && selectedNode.data) {
    selectedNode.data.isFinal = !selectedNode.data.isFinal
  }
}

const analyzeEquivalence = () => {
  // Step 1: Initial partition (final vs non-final states)
  const finalStates = nodes.value
    .filter((node) => node.data?.isFinal)
    .map((node) => node.data?.label || '')
  const nonFinalStates = nodes.value
    .filter((node) => !node.data?.isFinal)
    .map((node) => node.data?.label || '')

  let partitions = [finalStates, nonFinalStates].filter((group) => group.length > 0)
  equivalenceClasses.value = [...partitions]
  minimizationSteps.value = [
    `初始分割: 终结状态 {${finalStates.join(', ')}} 和 非终结状态 {${nonFinalStates.join(', ')}}`,
  ]

  // Step 2: Iteratively refine partitions
  let iteration = 1
  let changed = true

  while (changed) {
    changed = false
    const newPartitions: string[][] = []

    for (const partition of partitions) {
      const subPartitions = refinePartition(partition, partitions)
      newPartitions.push(...subPartitions)

      if (subPartitions.length > 1) {
        changed = true
        minimizationSteps.value.push(
          `第${iteration}轮分割: {${partition.join(', ')}} → ${subPartitions.map((p) => `{${p.join(', ')}}`).join(', ')}`,
        )
      }
    }

    partitions = newPartitions
    iteration++
  }

  equivalenceClasses.value = partitions
  minimizationSteps.value.push(
    `最终等价类: ${partitions.map((p, i) => `类${i + 1}: {${p.join(', ')}}`).join(', ')}`,
  )
}

const refinePartition = (partition: string[], allPartitions: string[][]): string[][] => {
  if (partition.length <= 1) return [partition]

  const subgroups: { [key: string]: string[] } = {}

  for (const state of partition) {
    const signature = getTransitionSignature(state, allPartitions)
    if (!subgroups[signature]) {
      subgroups[signature] = []
    }
    subgroups[signature].push(state)
  }

  return Object.values(subgroups)
}

const getTransitionSignature = (state: string, partitions: string[][]): string => {
  const stateNode = nodes.value.find((node) => node.data?.label === state)
  if (!stateNode) return ''

  const symbols = Array.from(new Set(edges.value.map((edge) => edge.data?.label).filter(Boolean)))
  const signature: string[] = []

  for (const symbol of symbols) {
    const transition = edges.value.find(
      (edge) => edge.source === stateNode.id && edge.data?.label === symbol,
    )

    if (transition) {
      const targetNode = nodes.value.find((node) => node.id === transition.target)
      const targetState = targetNode?.data?.label || ''
      const partitionIndex = partitions.findIndex((partition) => partition.includes(targetState))
      signature.push(partitionIndex.toString())
    } else {
      signature.push('-1')
    }
  }

  return signature.join(',')
}

const performMinimization = () => {
  if (equivalenceClasses.value.length === 0) {
    analyzeEquivalence()
  }

  // Create minimized DFA
  const newNodes: Node<NodeData>[] = []
  const newEdges: Edge<EdgeData>[] = []

  equivalenceClasses.value.forEach((group, index) => {
    const representative = group[0]
    const originalNode = nodes.value.find((node) => node.data?.label === representative)

    if (originalNode) {
      const newNode = createNode({
        type: 'circle',
        position: { x: 100 + index * 150, y: 200 },
        data: {
          label: `{${group.join(',')}}`,
          isInitial: group.some((state) => {
            const node = nodes.value.find((n) => n.data?.label === state)
            return node?.data?.isInitial || false
          }),
          isFinal: group.some((state) => {
            const node = nodes.value.find((n) => n.data?.label === state)
            return node?.data?.isFinal || false
          }),
        },
      })
      newNodes.push(newNode)
    }
  })

  // Create transitions between equivalence classes
  const symbols = Array.from(new Set(edges.value.map((edge) => edge.data?.label).filter(Boolean)))

  for (let i = 0; i < equivalenceClasses.value.length; i++) {
    const sourceGroup = equivalenceClasses.value[i]
    const sourceNode = newNodes[i]
    const representative = sourceGroup[0]

    for (const symbol of symbols) {
      const originalEdge = edges.value.find((edge) => {
        const sourceOriginal = nodes.value.find((node) => node.data?.label === representative)
        return edge.source === sourceOriginal?.id && edge.data?.label === symbol
      })

      if (originalEdge) {
        const targetOriginal = nodes.value.find((node) => node.id === originalEdge.target)
        const targetState = targetOriginal?.data?.label || ''
        const targetGroupIndex = equivalenceClasses.value.findIndex((group) =>
          group.includes(targetState),
        )

        if (targetGroupIndex !== -1) {
          const targetNode = newNodes[targetGroupIndex]
          const newEdge = createEdge({
            source: sourceNode.id,
            target: targetNode.id,
            type: 'custom',
            data: {
              label: symbol,
              isEditing: false,
            },
          })
          newEdges.push(newEdge)
        }
      }
    }
  }

  // Replace current nodes and edges
  removeNodes(nodes.value)
  removeEdges(edges.value)
  addNodes(newNodes)
  addEdges(newEdges)
  nodes.value = newNodes
  edges.value = newEdges

  minimizationSteps.value.push('最小化完成！已生成最小DFA')
}

const clearCanvas = () => {
  if (confirm('确定要清空画布吗？')) {
    removeNodes(nodes.value)
    removeEdges(edges.value)
    nodes.value = []
    edges.value = []
    equivalenceClasses.value = []
    minimizationSteps.value = []
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
        type: 'circle',
        position,
        data: {
          label: `q${nodes.value.length}`,
          isInitial: false,
          isFinal: false,
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
  console.log('Min-DFA Canvas ready:', vueFlowInstance)
}
</script>

<style scoped>
:deep(.min-dfa-mode) {
  background: #fdf4ff;
}

:deep(.min-dfa-mode .vue-flow__node-circle) {
  border-color: #a855f7;
}

:deep(.min-dfa-mode .vue-flow__edge-custom) {
  stroke: #a855f7;
}

.minimization-panel {
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
}

.eq-class {
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: #f3f4f6;
  border-radius: 0.375rem;
}

.step {
  display: flex;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.step-number {
  font-weight: 600;
  margin-right: 0.5rem;
  color: #7c3aed;
}

.step-description {
  color: #4b5563;
  line-height: 1.4;
}
</style>
