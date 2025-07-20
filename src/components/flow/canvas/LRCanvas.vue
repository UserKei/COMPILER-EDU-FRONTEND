<template>
  <div class="lr-canvas">
    <!-- 工具栏 -->
    <div class="toolbar">
      <h3 class="text-lg font-semibold text-gray-800">LR 项目集编辑器</h3>
      <div class="controls">
        <button
          @click="addItemSet"
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          添加项目集
        </button>
        <button
          @click="connectItemSets"
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          :disabled="selectedNodes.length !== 2"
        >
          连接项目集
        </button>
        <button
          @click="generateDFA"
          class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          生成DFA
        </button>
        <button
          @click="clearCanvas"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          清空画布
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
              id="lr-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
            </marker>
          </defs>
        </svg>
      </VueFlow>
    </div>

    <!-- 项目集信息面板 -->
    <div class="info-panel" v-if="selectedNodes.length === 1">
      <h4 class="font-semibold text-gray-800 mb-2">项目集信息</h4>
      <div class="text-sm text-gray-600">
        <p>项目集 ID: {{ selectedNodes[0].data.title || selectedNodes[0].data.label }}</p>
        <p>LR项目数量: {{ selectedNodes[0].data.items?.length || 0 }}</p>
        <div v-if="selectedNodes[0].data.items?.length" class="mt-2">
          <p class="font-medium">包含的LR项目:</p>
          <ul class="list-disc list-inside ml-2">
            <li v-for="item in selectedNodes[0].data.items" :key="item.id" class="text-xs">
              {{ item.text || '空项目' }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="help-text">
      <p class="text-sm text-gray-600">
        💡 提示：双击画布空白处创建项目集，点击节点可编辑LR项目内容，选择两个节点后可连接
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, onMounted } from 'vue'
import { VueFlow, useVueFlow, type Node, type Edge, type Connection } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { Background } from '@vue-flow/background'
import RectangleNode from '../nodes/RectangleNode.vue'
import CustomEdge from '../edges/CustomEdge.vue'
import { useNodeCreation } from '@/composables/flow/useNodeCreation'

// 定义节点和边类型
const nodeTypes = {
  rectangle: markRaw(RectangleNode),
}

const edgeTypes = {
  custom: markRaw(CustomEdge),
}

// 节点和边数据
const nodes = ref<Node[]>([])
const edges = ref<Edge[]>([])

const { getSelectedNodes, getSelectedEdges, onEdgesChange, updateNode } = useVueFlow()

// 使用节点创建功能
const {
  handlePaneDoubleClick,
  clearAll
} = useNodeCreation(nodes, edges, {
  nodeType: 'rectangle',
  generateLabel: (id: string) => {
    const existingLabels = nodes.value
      .filter(node => node.type === 'rectangle')
      .map(node => node.data?.title || node.data?.label || '')
      .filter(label => /^I\d+$/.test(label))
      .map(label => parseInt(label.replace('I', '')))
      .filter(num => !isNaN(num))

    let newNumber = 0
    while (existingLabels.includes(newNumber)) {
      newNumber++
    }
    return `I${newNumber}`
  },
  generateNodeData: (label: string) => ({
    title: label,
    items: [
      {
        id: `item-${Date.now()}`,
        text: ''
      }
    ]
  })
})

// 计算属性
const selectedNodes = computed(() => getSelectedNodes.value)
const selectedEdges = computed(() => getSelectedEdges.value)

// 事件处理
const onConnect = (connection: Connection) => {
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
    markerEnd: 'url(#lr-arrow)'
  }

  edges.value.push(newEdge)
}

const onNodeClick = (event: any) => {
  console.log('LR Node clicked:', event.node)
}

const onEdgeClick = (event: any) => {
  console.log('LR Edge clicked:', event.edge)
}

const onPaneClick = (event: MouseEvent) => {
  console.log('LR Pane clicked')
}

const onPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault()
}

// 工具栏操作
const addItemSet = () => {
  const newNumber = nodes.value.length
  const newNode: Node = {
    id: `node-${Date.now()}`,
    type: 'rectangle',
    position: { x: Math.random() * 400 + 50, y: Math.random() * 300 + 50 },
    data: {
      title: `I${newNumber}`,
      items: [
        {
          id: `item-${Date.now()}`,
          text: ''
        }
      ]
    }
  }

  nodes.value.push(newNode)
}

const connectItemSets = () => {
  if (selectedNodes.value.length === 2) {
    const source = selectedNodes.value[0]
    const target = selectedNodes.value[1]

    const newEdge: Edge = {
      id: `e${source.id}-${target.id}-${Date.now()}`,
      type: 'custom',
      source: source.id,
      target: target.id,
      sourceHandle: 'center-source',
      targetHandle: 'center-target',
      data: {
        label: '',
        isEditing: true
      },
      markerEnd: 'url(#lr-arrow)'
    }

    edges.value.push(newEdge)
  }
}

const generateDFA = () => {
  // 这里可以添加自动生成DFA的逻辑
  console.log('Generating DFA...')
  console.log('Current nodes:', nodes.value)
  console.log('Current edges:', edges.value)

  // 简单示例：检查是否有初始项目集
  const hasInitialItemSet = nodes.value.some(node =>
    node.data.title === 'I0'
  )

  if (!hasInitialItemSet) {
    alert('提示：建议先创建初始项目集 I0')
  } else {
    alert('DFA 结构验证完成')
  }
}

const clearCanvas = () => {
  if (confirm('确定要清空画布吗？此操作不可撤销。')) {
    clearAll()
  }
}

// 生命周期
const onPaneReady = (vueFlowInstance: any) => {
  console.log('LR Canvas ready')
}

onMounted(() => {
  // 禁用双击选择文本
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
      console.log(`Removed LR edge: ${change.id}`)
    }
  })
})

// 暴露给父组件的方法
defineExpose({
  getNodes: () => nodes.value,
  getEdges: () => edges.value,
  clearCanvas,
  addNode: (node: Node) => nodes.value.push(node),
  addEdge: (edge: Edge) => edges.value.push(edge),
  generateDFA,
  addItemSet
})
</script>

<style scoped>
.lr-canvas {
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
  background: linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%);
}

.info-panel {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
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
  background: #6366f1;
}

:deep(.vue-flow__handle-valid) {
  background: #8b5cf6;
}

:deep(.vue-flow__node.selected) {
  outline: none !important;
}

:deep(.vue-flow__edge.selected) {
  stroke: #6366f1 !important;
  stroke-width: 3 !important;
}
</style>
