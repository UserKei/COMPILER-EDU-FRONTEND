<template>
  <div class="vue-flow-container">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :connect-on-click="false"
      :nodes-connectable="true"
      fit-view-on-init
      class="vue-flow"
      @connect="onConnect"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
    >
      <!-- Custom Controls -->
      <Controls position="top-right" />

      <!-- Custom Background -->
      <Background pattern="dots" :gap="20" />

      <!-- Custom Markers -->
      <svg>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="3"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#6b7280" />
          </marker>
        </defs>
      </svg>
    </VueFlow>

    <!-- Debug Panel -->
    <div v-if="showDebug" class="debug-panel">
      <h3>Debug Info</h3>
      <div>Nodes: {{ nodes.length }}</div>
      <div>Edges: {{ edges.length }}</div>
      <div>Edge Data Store: {{ edgeDataStore.size }}</div>
      <div>Selected: {{ selectedElements.length }}</div>
      <button
        @click="() => { console.log('Current edges:', edges); console.log('Edge data store:', edgeDataStore); }"
        class="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
      >
        Log Debug Info
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, watch } from 'vue'
import { VueFlow, useVueFlow, type Node, type Edge, type Connection } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { Background } from '@vue-flow/background'
import RectangleNode from '../flow/nodes/RectangleNode.vue'
import CircleNode from '../flow/nodes/CircleNode.vue'
import CustomEdge from '../flow/edges/CustomEdge.vue'

// Define custom node and edge types
const nodeTypes = {
  rectangle: markRaw(RectangleNode),
  circle: markRaw(CircleNode),
  custom: markRaw(RectangleNode), // Keep backward compatibility
}

const edgeTypes = {
  custom: markRaw(CustomEdge),
}

// Sample data
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'rectangle',
    position: { x: 100, y: 100 },
    data: { label: 'Node 1', text: 'Start' },
  },
  {
    id: '2',
    type: 'rectangle',
    position: { x: 300, y: 100 },
    data: { label: 'Node 2', text: 'Process' },
  },
  {
    id: '3',
    type: 'circle',
    position: { x: 500, y: 100 },
    data: { label: 'Node 3', text: 'End' },
  },
  {
    id: '4',
    type: 'circle',
    position: { x: 300, y: 250 },
    data: { label: 'Node 4', text: 'Loop' },
  },
]

const initialEdges: Edge[] = [
  // 测试用的边，使用正确的Handle ID
  {
    id: 'e2-4',
    type: 'custom',
    source: '2',
    target: '4',
    sourceHandle: 'center-source',
    targetHandle: 'center-target',
    data: { label: 'test' },
  },
]

// Manage nodes and edges separately (recommended approach)
const nodes = ref<Node[]>([...initialNodes])
const edges = ref<Edge[]>([...initialEdges])
const showDebug = ref(false)

const { getSelectedNodes, getSelectedEdges, removeEdges, onEdgesChange, updateEdge } = useVueFlow()

// 创建一个边数据存储，用于保存边的自定义数据
const edgeDataStore = ref<Map<string, any>>(new Map())

// 强制清理函数 - 确保边数据完全清理
const forceCleanEdgeData = (edgeId: string) => {
  // 从边列表中移除
  const edgeIndex = edges.value.findIndex(edge => edge.id === edgeId)
  if (edgeIndex >= 0) {
    edges.value.splice(edgeIndex, 1)
  }

  // 从数据存储中移除
  edgeDataStore.value.delete(edgeId)

  console.log(`Force cleaned all data for edge: ${edgeId}`)
}

// 监听边变化事件（推荐方式）- 捕获所有边删除场景
onEdgesChange((changes) => {
  changes.forEach((change) => {
    if (change.type === 'remove') {
      const edgeId = change.id
      // 强制清理所有相关数据
      forceCleanEdgeData(edgeId)
    }
  })
})

// 监听边的变化，当边被删除时清理对应的数据（备用方式）
watch(edges, (newEdges: Edge[], oldEdges: Edge[] | undefined) => {
  if (oldEdges) {
    // 找出被删除的边
    const newEdgeIds = new Set(newEdges.map((edge: Edge) => edge.id))
    const deletedEdges = oldEdges.filter((edge: Edge) => !newEdgeIds.has(edge.id))

    // 清理被删除边的数据
    deletedEdges.forEach((deletedEdge: Edge) => {
      const edgeId = deletedEdge.id

      // 清理边数据存储
      if (edgeDataStore.value.has(edgeId)) {
        edgeDataStore.value.delete(edgeId)
        console.log(`Cleaned data for deleted edge (via watch): ${edgeId}`)
      }

      // 如果边有自定义数据，也要清理
      if (deletedEdge.data?.controlOffset || deletedEdge.data?.labelT) {
        console.log(`Cleaned custom data for edge ${edgeId}:`, {
          controlOffset: deletedEdge.data.controlOffset,
          labelT: deletedEdge.data.labelT
        })
      }
    })
  }
}, { deep: true })

// Computed properties
const selectedElements = computed(() => [...getSelectedNodes.value, ...getSelectedEdges.value])

// Event handlers
const onConnect = (connection: Connection) => {
  console.log('Connection attempt:', connection)
  console.log('Source handle:', connection.sourceHandle)
  console.log('Target handle:', connection.targetHandle)

  // 事件拦截：将交互Handle的连接转换为中心Handle
  let sourceHandle = connection.sourceHandle
  let targetHandle = connection.targetHandle

  console.log('Before mapping - Source:', sourceHandle, 'Target:', targetHandle)

  // 如果连接来自交互Handle，转换为中心Handle
  if (sourceHandle === 'top-right') {
    sourceHandle = 'center-source'
    console.log('Mapped source handle to center-source')
  }
  if (targetHandle === 'top-right-target') {
    targetHandle = 'center-target'
    console.log('Mapped target handle to center-target')
  }

  console.log('After mapping - Source:', sourceHandle, 'Target:', targetHandle)

  // 生成真正唯一的边 ID，包含时间戳和随机数
  const uniqueId = `e${connection.source}-${connection.target}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // 确保新边ID不会与现有边冲突
  const existingEdgeIds = new Set(edges.value.map(edge => edge.id))
  let finalId = uniqueId
  let counter = 1
  while (existingEdgeIds.has(finalId)) {
    finalId = `${uniqueId}-${counter}`
    counter++
  }

  // 创建全新的边数据对象，确保没有任何残留数据
  const newEdge: Edge = {
    id: finalId,
    type: 'custom',
    source: connection.source!,
    target: connection.target!,
    sourceHandle: sourceHandle || 'center-source',
    targetHandle: targetHandle || 'center-target',
    data: {
      label: '',
      // 确保所有自定义数据字段都是全新的
      controlOffset: undefined,
      labelT: undefined,
      isEditing: true // 新建边自动进入编辑模式
    },
  }

  // 清理可能存在的旧数据（虽然ID是唯一的，但保险起见）
  edgeDataStore.value.delete(finalId)

  // 确保所有现有边都退出编辑模式
  edges.value.forEach(edge => {
    if (edge.data?.isEditing) {
      edge.data.isEditing = false
    }
  })

  edges.value.push(newEdge)
  console.log(`Created new edge with unique ID: ${finalId}`, newEdge)
  console.log(`Total edges after creation: ${edges.value.length}`)
  console.log(`New edge data:`, newEdge.data)
  console.log(`New edge isEditing:`, newEdge.data.isEditing)
}

const onNodeClick = (event: any) => {
  console.log('Node clicked:', event)
}

const onEdgeClick = (event: any) => {
  console.log('Edge clicked:', event)
}

// Expose methods for external use
defineExpose({
  addNode: (node: Node) => nodes.value.push(node),
  addEdge: (edge: Edge) => edges.value.push(edge),
  getNodes: () => nodes.value,
  getEdges: () => edges.value,
  getEdgeDataStore: () => edgeDataStore.value, // 用于调试
  clearEdgeDataStore: () => edgeDataStore.value.clear(), // 用于手动清理
  forceCleanEdgeData, // 强制清理特定边的数据
  clearSelection: () => {
    // Implementation would depend on VueFlow's selection API
  }
})
</script>

<style scoped>
.vue-flow-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.vue-flow {
  width: 100%;
  height: 100%;
  background-color: rgb(249 250 251);
}

.debug-panel {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: white;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  font-size: 0.875rem;
  z-index: 1000;
}

.debug-panel h3 {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.debug-panel div {
  margin-bottom: 0.25rem;
}

/* Global VueFlow styles */
:deep(.vue-flow__node) {
  z-index: 10;
}

:deep(.vue-flow__edge) {
  z-index: 1;
}

:deep(.vue-flow__edge.selected) {
  z-index: 5;
}

/* Hide default connection dots */
:deep(.vue-flow__handle-connecting) {
  background: #3b82f6;
}

:deep(.vue-flow__handle-valid) {
  background: #10b981;
}

/* Customize selection styling */
:deep(.vue-flow__node.selected) {
  outline: none !important;
}

:deep(.vue-flow__edge.selected) {
  stroke: #3b82f6 !important;
  stroke-width: 3 !important;
}
</style>
