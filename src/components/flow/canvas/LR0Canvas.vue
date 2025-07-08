<template>
  <div class="lr0-canvas">
    <!-- 工具栏 -->
    <div class="toolbar">
      <h3 class="text-lg font-semibold text-gray-800">LR0 项目集编辑器</h3>
      <div class="controls">
        <button
          @click="clearCanvas"
          class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          清空画布
        </button>
        <button
          @click="addProduction"
          class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          :disabled="selectedNodes.length !== 1"
        >
          添加产生式
        </button>
        <button
          @click="removeProduction"
          class="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
          :disabled="selectedNodes.length !== 1"
        >
          删除产生式
        </button>
        <button
          @click="validateItemSets"
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          验证项目集
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
        :nodes-draggable="false"
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
              id="lr0-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="3"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#dc2626" />
            </marker>
          </defs>
        </svg>
      </VueFlow>
    </div>

    <!-- 项目集信息面板 -->
    <div class="info-panel" v-if="selectedNodes.length === 1">
      <h4 class="font-semibold text-gray-800 mb-2">项目集信息</h4>
      <div class="text-sm text-gray-600">
        <p>项目集 ID: {{ selectedNodes[0].data.label }}</p>
        <p>产生式数量: {{ selectedNodes[0].data.pros?.length || 0 }}</p>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="help-text">
      <p class="text-sm text-gray-600">
        💡 提示：双击画布空白处创建项目集，点击节点可编辑产生式内容
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

const { getSelectedNodes, getSelectedEdges, onEdgesChange, updateEdge } = useVueFlow()

// 使用节点创建功能
const {
  handlePaneDoubleClick,
  clearAll
} = useNodeCreation(nodes, edges, {
  nodeType: 'rectangle',
  generateLabel: (id: string) => {
    const existingLabels = nodes.value
      .filter(node => node.type === 'rectangle')
      .map(node => node.data?.label || node.data?.text || '')
      .filter(label => /^I\d+$/.test(label))
      .map(label => parseInt(label.replace('I', '')))
      .filter(num => !isNaN(num))

    let newNumber = 0
    while (existingLabels.includes(newNumber)) {
      newNumber++
    }
    return `I${newNumber}`
  }
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
      label: 'GOTO',
      isEditing: true
    },
    markerEnd: 'lr0-arrow'
  }

  edges.value.push(newEdge)
}

const onNodeClick = (event: any) => {
  console.log('LR0 Node clicked:', event.node)
  // 可以在这里添加编辑项目集的逻辑
}

const onEdgeClick = (event: any) => {
  console.log('LR0 Edge clicked:', event.edge)
}

const onPaneClick = (event: MouseEvent) => {
  console.log('LR0 Pane clicked')
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

const addProduction = () => {
  if (selectedNodes.value.length === 1) {
    const node = selectedNodes.value[0]
    if (!node.data.pros) {
      node.data.pros = []
    }

    node.data.pros.push({
      id: `pro-${Date.now()}`,
      category: 'blank',
      check: 'normal',
      state: 'normal',
      text: ''
    })

    console.log('Added production to node:', node.id)
  }
}

const removeProduction = () => {
  if (selectedNodes.value.length === 1) {
    const node = selectedNodes.value[0]
    if (node.data.pros && node.data.pros.length > 0) {
      node.data.pros.pop()
      console.log('Removed production from node:', node.id)
    }
  }
}

const validateItemSets = () => {
  // 这里可以添加 LR0 项目集验证逻辑
  console.log('Validating LR0 item sets...')
  console.log('Nodes:', nodes.value)
  console.log('Edges:', edges.value)

  // 简单的验证示例
  const hasInitialItemSet = nodes.value.some(node =>
    node.data.label === 'I0' || node.data.label === 'I0'
  )

  if (!hasInitialItemSet) {
    alert('警告：缺少初始项目集 I0')
  } else {
    alert('项目集验证完成')
  }
}

// 生命周期 - 现在双击事件通过 useNodeCreation 中的 watch 自动绑定
const onPaneReady = (vueFlowInstance: any) => {
  console.log('LR0 Pane ready')
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
      console.log(`Removed LR0 edge: ${change.id}`)
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
  validateItemSets
})
</script>

<style scoped>
.lr0-canvas {
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
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
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
  background: #dc2626;
}

:deep(.vue-flow__handle-valid) {
  background: #ef4444;
}

:deep(.vue-flow__node.selected) {
  outline: none !important;
}

:deep(.vue-flow__edge.selected) {
  stroke: #dc2626 !important;
  stroke-width: 3 !important;
}
</style>
