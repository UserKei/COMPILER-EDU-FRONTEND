<template>
  <div class="fa-canvas">
    <!-- 工具栏 -->
    <div class="toolbar">
      <h3 class="text-lg font-semibold text-gray-800">
        {{ displayTitle }} 编辑器
      </h3>
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
        <button
          @click="deleteSelected"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          :disabled="selectedNodes.length === 0 && selectedEdges.length === 0"
        >
          删除选中
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
        class="vue-flow"
        :class="mode"
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
              :id="`${mode}-arrow`"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path
                d="M 0 0 L 10 5 L 0 10 z"
                :fill="mode === 'nfa' ? '#059669' : '#3b82f6'"
              />
            </marker>
          </defs>
        </svg>
      </VueFlow>
    </div>

    <!-- 提示信息 -->
    <div class="help-text">
      <p class="text-sm text-gray-600">
        💡 提示：双击画布空白处创建状态节点，拖拽节点连接线创建转换
        <span v-if="mode === 'dfa'">（DFA 只能有一个初态且每个状态的每个输入只能有一个转换）</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw, nextTick } from 'vue'
import { VueFlow, type Node, type Edge, type Connection, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { Background } from '@vue-flow/background'
import CircleNode from '../nodes/CircleNode.vue'
import CustomEdge from '../edges/CustomEdge.vue'
import { useNodeCreation } from '@/composables/flow/useNodeCreation'
import { gsap } from 'gsap'

// 定义 props
interface Props {
  mode?: 'nfa' | 'dfa'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'nfa',
  title: ''
})

// 计算标题
const displayTitle = computed(() => {
  if (props.title) return props.title
  return props.mode === 'nfa' ? 'NFA' : 'DFA'
})

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

const { getSelectedNodes, getSelectedEdges, onEdgesChange, onNodesChange, updateEdge, removeNodes, removeEdges } = useVueFlow()

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
  if (props.mode !== 'dfa') return true

  const existingEdges = edges.value.filter(edge =>
    edge.source === newConnection.source &&
    edge.sourceHandle === newConnection.sourceHandle
  )

  // 如果已经有相同源和源句柄的边，则不允许创建（DFA 确定性约束）
  return existingEdges.length === 0
}

// 事件处理
const onConnect = (connection: Connection) => {
  // 验证 DFA 规则（仅在 DFA 模式下）
  if (props.mode === 'dfa' && !validateDFAConnection(connection)) {
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
    markerEnd: `url(#${props.mode}-arrow)`
  }

  edges.value.push(newEdge)
}

const onNodeClick = (event: any) => {
  console.log(`${props.mode.toUpperCase()} Node clicked:`, event.node)
}

const onEdgeClick = (event: any) => {
  console.log(`${props.mode.toUpperCase()} Edge clicked:`, event.edge)
}

const onPaneClick = (event: MouseEvent) => {
  console.log(`${props.mode.toUpperCase()} Pane clicked`)
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
    // NFA 和 DFA 都只能有一个初态
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

const deleteSelected = () => {
  const selectedNodeIds = selectedNodes.value.map(node => node.id)
  const selectedEdgeIds = selectedEdges.value.map(edge => edge.id)

  // 先执行删除动画，然后删除数据
  if (selectedNodeIds.length > 0) {
    animateNodeDeletion(selectedNodeIds, () => {
      // 动画完成后使用VueFlow的删除方法
      removeNodes(selectedNodeIds)
      console.log(`Deleted ${selectedNodeIds.length} nodes and related edges`)
    })
  }

  // 使用VueFlow的方法删除选中的边
  if (selectedEdgeIds.length > 0) {
    removeEdges(selectedEdgeIds)
    console.log(`Deleted ${selectedEdgeIds.length} edges`)
  }
}

// 删除动画函数
const animateNodeDeletion = (nodeIds: string[], onComplete: () => void) => {
  const elements = nodeIds.map(nodeId => document.querySelector(`[data-id="${nodeId}"]`)).filter(Boolean)

  if (elements.length === 0) {
    onComplete()
    return
  }

  gsap.to(elements, {
    scale: 0,
    opacity: 0,
    duration: 0.3,
    ease: 'back.in(1.7)',
    stagger: 0.05,
    onComplete
  })
}

// 生命周期 - 现在双击事件通过 useNodeCreation 中的 watch 自动绑定
const onPaneReady = (vueFlowInstance: any) => {
  console.log(`${props.mode.toUpperCase()} Pane ready`)
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
      console.log(`Removed ${props.mode.toUpperCase()} edge: ${change.id}`)
      // VueFlow会自动处理边的移除，不需要手动操作数组
    }
  })
})

// 节点变化处理
onNodesChange((changes) => {
  changes.forEach((change) => {
    if (change.type === 'remove') {
      console.log(`Removed ${props.mode.toUpperCase()} node: ${change.id}`)
      // VueFlow会自动处理节点的移除，不需要手动操作数组
    }
    // 移除位置更新逻辑，让VueFlow自己处理位置同步
  })
})

// 暴露给父组件的方法
defineExpose({
  getNodes: () => nodes.value,
  getEdges: () => edges.value,
  clearCanvas,
  deleteSelected,
  addNode: (node: Node) => nodes.value.push(node),
  addEdge: (edge: Edge) => edges.value.push(edge)
})
</script>

<style scoped>
.fa-canvas {
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
}

/* NFA 模式样式 */
.vue-flow.nfa {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

/* DFA 模式样式 */
.vue-flow.dfa {
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

/* NFA 模式样式 */
:deep(.vue-flow.nfa .vue-flow__handle-connecting) {
  background: #059669;
}

:deep(.vue-flow.nfa .vue-flow__handle-valid) {
  background: #10b981;
}

:deep(.vue-flow.nfa .vue-flow__edge.selected) {
  stroke: #059669 !important;
  stroke-width: 3 !important;
}

/* DFA 模式样式 */
:deep(.vue-flow.dfa .vue-flow__handle-connecting) {
  background: #3b82f6;
}

:deep(.vue-flow.dfa .vue-flow__handle-valid) {
  background: #60a5fa;
}

:deep(.vue-flow.dfa .vue-flow__edge.selected) {
  stroke: #3b82f6 !important;
  stroke-width: 3 !important;
}

:deep(.vue-flow__node.selected) {
  outline: none !important;
}
</style>
