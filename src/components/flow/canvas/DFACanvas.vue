<template>
  <div class="dfa-canvas">
    <!-- 工具栏 -->
    <div class="toolbar">
      <h3 class="text-lg font-semibold text-gray-800">DFA 编辑器</h3>
      <div class="controls">
        <button
          @click="clearCanvas"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          清空画布
        </button>
        <button
          @click="setSelectedAsInitial"
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          :disabled="selectedNodes.length !== 1"
        >
          设为初态
        </button>
        <button
          @click="setSelectedAsFinal"
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          :disabled="selectedNodes.length === 0"
        >
          设为终态
        </button>
        <button
          @click="resetSelectedState"
          class="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          :disabled="selectedNodes.length === 0"
        >
          重置状态
        </button>
      </div>
    </div>

    <!-- 画布区域 -->
    <div class="canvas-container">
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
        :nodes-draggable="true"
        :selection-on-drag="false"
        :pan-on-drag="[2]"
        :zoom-on-double-click="false"
        fit-view-on-init
        class="vue-flow"
        @connect="onConnect"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @pane-click="onPaneClick"
        @pane-context-menu="onPaneContextMenu"
        @pane-ready="onPaneReady"
      >
        <!-- 控制器 -->
        <Controls position="top-right" />

        <!-- 背景 -->
        <Background pattern="dots" :gap="20" />

        <!-- 自定义标记 -->
        <svg>
          <defs>
            <marker
              id="dfa-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
            </marker>
          </defs>
        </svg>
      </VueFlow>
    </div>

    <!-- 提示信息 -->
    <div class="help-text">
      <p class="text-sm text-gray-600">
        💡 提示：双击画布空白处创建状态节点，DFA 只能有一个初态且每个状态的每个输入只能有一个转换
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, onMounted } from 'vue'
import { VueFlow, useVueFlow, type Node, type Edge, type Connection } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { Background } from '@vue-flow/background'
import CircleNode from '../nodes/CircleNode.vue'
import CustomEdge from '../edges/CustomEdge.vue'
import { useNodeCreation } from '@/composables/flow/useNodeCreation'

// 定义节点和边类型
const nodeTypes = {
  circle: markRaw(CircleNode),
}

const edgeTypes = {
  custom: markRaw(CustomEdge),
}

// 节点和边数据
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

const { getSelectedNodes, getSelectedEdges, onEdgesChange, updateEdge } = useVueFlow()

// 使用节点创建功能
const {
  handlePaneDoubleClick,
  clearAll,
  setNodeAsInitial,
  setNodeAsFinal,
  resetNodeState
} = useNodeCreation(nodes, edges, {
  nodeType: 'circle'
})

// 计算属性
const selectedNodes = computed(() => getSelectedNodes.value)
const selectedEdges = computed(() => getSelectedEdges.value)

// 检查 DFA 规则：每个状态的每个输入只能有一个转换
const validateDFAConnection = (newConnection: Connection): boolean => {
  const existingEdges = edges.value.filter(edge =>
    edge.source === newConnection.source &&
    edge.sourceHandle === newConnection.sourceHandle
  )

  // 如果已经有相同源和源句柄的边，则不允许创建（DFA 确定性约束）
  return existingEdges.length === 0
}

// 事件处理
const onConnect = (connection: Connection) => {
  // 验证 DFA 规则
  if (!validateDFAConnection(connection)) {
    console.warn('DFA 约束：每个状态的每个输入只能有一个转换')
    return
  }

  const newEdge: Edge = {
    id: `e${connection.source}-${connection.target}-${Date.now()}`,
    type: 'custom',
    source: connection.source!,
    target: connection.target!,
    sourceHandle: connection.sourceHandle || 'center-source',
    targetHandle: connection.targetHandle || 'center-target',
    data: {
      label: '',
      isEditing: true
    },
    markerEnd: 'url(#dfa-arrow)'
  }

  edges.value.push(newEdge)
}

const onNodeClick = (event: any) => {
  console.log('DFA Node clicked:', event.node)
}

const onEdgeClick = (event: any) => {
  console.log('DFA Edge clicked:', event.edge)
}

const onPaneClick = (event: MouseEvent) => {
  console.log('DFA Pane clicked')
}

const onPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  // 可以在这里添加右键菜单功能
}

// 工具栏操作
const clearCanvas = () => {
  if (confirm('确定要清空画布吗？此操作不可撤销。')) {
    clearAll()
  }
}

const setSelectedAsInitial = () => {
  if (selectedNodes.value.length === 1) {
    // DFA 只能有一个初态
    nodes.value.forEach(node => {
      if (node.data) {
        node.data.isInitial = false
      }
    })
    setNodeAsInitial(selectedNodes.value[0].id)
  }
}

const setSelectedAsFinal = () => {
  selectedNodes.value.forEach(node => {
    setNodeAsFinal(node.id)
  })
}

const resetSelectedState = () => {
  selectedNodes.value.forEach(node => {
    resetNodeState(node.id)
  })
}

// 生命周期 - 现在双击事件通过 useNodeCreation 中的 watch 自动绑定
const onPaneReady = (vueFlowInstance: any) => {
  console.log('DFA Pane ready')
  // watch 会自动处理双击事件绑定，这里不需要手动绑定
}
onMounted(() => {
  // 额外的防护：禁用整个文档的双击选择文本行为
  document.addEventListener('selectstart', (e) => {
    if ((e.target as HTMLElement).closest('.vue-flow')) {
      e.preventDefault()
    }
  })
})

// 边变化处理
onEdgesChange((changes) => {
  changes.forEach((change) => {
    if (change.type === 'remove') {
      console.log(`Removed DFA edge: ${change.id}`)
    }
  })
})

// 暴露给父组件的方法
defineExpose({
  getNodes: () => nodes.value,
  getEdges: () => edges.value,
  clearCanvas,
  addNode: (node: Node) => nodes.value.push(node),
  addEdge: (edge: Edge) => edges.value.push(edge)
})
</script>

<style scoped>
.dfa-canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f8fafc;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #9ca3af;
}

.canvas-container {
  flex: 1;
  position: relative;
}

.vue-flow {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.help-text {
  padding: 0.75rem 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

/* 自定义 VueFlow 样式 */
:deep(.vue-flow__node) {
  z-index: 10;
}

:deep(.vue-flow__edge) {
  z-index: 1;
}

:deep(.vue-flow__edge.selected) {
  z-index: 5;
}

:deep(.vue-flow__handle-connecting) {
  background: #3b82f6;
}

:deep(.vue-flow__handle-valid) {
  background: #60a5fa;
}

:deep(.vue-flow__node.selected) {
  outline: none !important;
}

:deep(.vue-flow__edge.selected) {
  stroke: #3b82f6 !important;
  stroke-width: 3 !important;
}
</style>
