<template>
  <div class="fa-canvas">
    <!-- 工具栏 -->
    <div class="toolbar">
      <h3 class="text-lg font-semibold text-gray-800">{{ displayTitle }} 编辑器</h3>
      <div class="controls">
        <button
          v-for="button in toolbarButtons"
          :key="button.label"
          @click="button.action"
          :disabled="button.disabled"
          class="px-3 py-1 rounded transition-colors text-white"
          :class="getButtonClasses(button.variant)"
        >
          {{ button.label }}
        </button>
      </div>
    </div>

    <!-- 画布区域 -->
    <div class="canvas-container">
      <VueFlow
        :nodes="canvasNodes"
        :edges="canvasEdges"
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :default-viewport="defaultViewport"
        :min-zoom="canvasConfig.minZoom"
        :max-zoom="canvasConfig.maxZoom"
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
        @pane-double-click="onPaneDoubleClick"
      >
        <!-- 控制器 -->
        <Controls v-if="canvasConfig.showControls" position="top-right" />

        <!-- 背景 -->
        <Background
          v-if="canvasConfig.showBackground"
          :pattern="canvasConfig.backgroundPattern"
          :gap="canvasConfig.backgroundGap"
        />

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
              <path d="M 0 0 L 10 5 L 0 10 z" :fill="themeColor" />
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

    <!-- 验证错误提示 -->
    <div v-if="validationErrors.length > 0" class="validation-errors">
      <div class="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
        <h4 class="text-sm font-medium text-red-800 mb-2">验证错误：</h4>
        <ul class="text-xs text-red-700 space-y-1">
          <li v-for="error in validationErrors" :key="error">• {{ error }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, markRaw } from 'vue'
import { VueFlow, type Node, type Edge, type Connection } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { Background } from '@vue-flow/background'
import CircleNode from '../components/circleNode/index.vue'
import CustomEdge from '../components/edges/index.vue'
import { useNodeCreation, useCanvasEvents, useValidation, useNodeState } from '../composables'
import { useFlowCanvasStore, useFlowEditorStore } from '../stores'
import { ColorUtils } from '../utils'
import type { CanvasMode, ToolbarButton } from '../types'

// 定义 props
interface Props {
  mode?: CanvasMode
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'nfa',
  title: '',
})

// 使用 stores
const canvasStore = useFlowCanvasStore()
const editorStore = useFlowEditorStore()

// 初始化模式
onMounted(() => {
  canvasStore.setMode(props.mode)
})

// 计算属性
const displayTitle = computed(() => {
  if (props.title) return props.title
  return props.mode === 'nfa' ? 'NFA' : 'DFA'
})

const themeColor = computed(() => ColorUtils.getThemeColor(props.mode))

const canvasConfig = computed(() => canvasStore.canvasConfig)
const canvasNodes = computed(() => canvasStore.nodes)
const canvasEdges = computed(() => canvasStore.edges)

const defaultViewport = computed(() => ({
  zoom: canvasConfig.value.defaultZoom || 1,
}))

// 定义节点和边类型
const nodeTypes = {
  circle: markRaw(CircleNode),
}

const edgeTypes = {
  custom: markRaw(CustomEdge),
}

// 使用组合函数
const { handlePaneDoubleClick, clearAll, setNodeAsInitial, setNodeAsFinal, resetNodeState } =
  useNodeCreation(canvasNodes, canvasEdges, {
    nodeType: 'circle',
  })

const {
  onConnect: handleConnect,
  deleteSelected,
  clearCanvas,
} = useCanvasEvents(canvasNodes, canvasEdges, ref(props.mode))

const { validateCanvas } = useValidation(ref(props.mode))

// 验证错误
const validationErrors = computed(() => {
  const result = validateCanvas(canvasNodes.value, canvasEdges.value)
  return result.errors
})

// 工具栏按钮配置
const toolbarButtons = computed((): ToolbarButton[] => [
  {
    label: '清空画布',
    action: () => clearCanvas(),
    variant: 'danger',
  },
  {
    label: '设为初态',
    action: () => setSelectedAsInitial(),
    disabled: editorStore.selectedNodes.length !== 1,
    variant: 'primary',
  },
  {
    label: '设为终态',
    action: () => setSelectedAsFinal(),
    disabled: editorStore.selectedNodes.length === 0,
    variant: 'secondary',
  },
  {
    label: '重置状态',
    action: () => resetSelectedState(),
    disabled: editorStore.selectedNodes.length === 0,
    variant: 'secondary',
  },
  {
    label: '删除选中',
    action: () => deleteSelected(),
    disabled: !editorStore.hasSelection,
    variant: 'danger',
  },
])

// 工具栏按钮样式
const getButtonClasses = (variant: string = 'primary') => {
  const baseClasses = 'px-3 py-1 rounded transition-colors text-white'
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400',
    secondary: 'bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400',
    danger: 'bg-red-500 hover:bg-red-600 disabled:bg-gray-400',
  }
  return `${baseClasses} ${variantClasses[variant] || variantClasses.primary}`
}

// 事件处理函数
const onConnect = (connection: Connection) => {
  const success = handleConnect(connection, {
    markerEnd: `url(#${props.mode}-arrow)`,
  })

  if (success) {
    // 保存到历史记录
    editorStore.saveToHistory(canvasNodes.value, canvasEdges.value)
  }
}

const onNodeClick = (event: MouseEvent, node: Node) => {
  editorStore.selectNode(node.id, event.ctrlKey || event.metaKey)
}

const onEdgeClick = (event: MouseEvent, edge: Edge) => {
  editorStore.selectEdge(edge.id, event.ctrlKey || event.metaKey)
}

const onPaneClick = () => {
  editorStore.clearSelection()
}

const onPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  // 可以在这里实现右键菜单
}

const onPaneReady = () => {
  console.log('FA Canvas ready')
}

const onPaneDoubleClick = (event: MouseEvent) => {
  handlePaneDoubleClick(event)
  // 保存到历史记录
  editorStore.saveToHistory(canvasNodes.value, canvasEdges.value)
}

// 工具栏操作函数
const setSelectedAsInitial = () => {
  const selectedNodeId = editorStore.selectedNodes[0]
  if (selectedNodeId) {
    canvasStore.setInitialNode(selectedNodeId)
    editorStore.saveToHistory(canvasNodes.value, canvasEdges.value)
  }
}

const setSelectedAsFinal = () => {
  editorStore.selectedNodes.forEach((nodeId) => {
    canvasStore.setFinalNode(nodeId, true)
  })
  editorStore.saveToHistory(canvasNodes.value, canvasEdges.value)
}

const resetSelectedState = () => {
  editorStore.selectedNodes.forEach((nodeId) => {
    canvasStore.resetNodeStates(nodeId)
  })
  editorStore.saveToHistory(canvasNodes.value, canvasEdges.value)
}
</script>

<style scoped>
.fa-canvas {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.canvas-container {
  flex: 1;
  position: relative;
}

.vue-flow {
  height: 100%;
  background: #f9fafb;
}

.help-text {
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-top: 1px solid #e5e7eb;
}

.validation-errors {
  padding: 0 1rem;
  background: #f3f4f6;
}

/* 模式特定样式 */
.vue-flow.nfa {
  --flow-theme: #059669;
}

.vue-flow.dfa {
  --flow-theme: #3b82f6;
}
</style>
