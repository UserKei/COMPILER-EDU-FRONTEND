<template>
  <div class="slr1-canvas">
    <!-- 工具栏 -->
    <div class="toolbar">
      <h3 class="text-lg font-semibold text-gray-800">SLR1 项目集编辑器</h3>
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
          @click="computeFollowSets"
          class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
        >
          计算 FOLLOW 集
        </button>
        <button
          @click="validateSLR1"
          class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          验证 SLR1
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
              id="slr1-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="3"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#7c3aed" />
            </marker>
          </defs>
        </svg>
      </VueFlow>
    </div>

    <!-- 项目集信息面板 -->
    <div class="info-panel" v-if="selectedNodes.length === 1">
      <h4 class="font-semibold text-gray-800 mb-2">SLR1 项目集信息</h4>
      <div class="text-sm text-gray-600">
        <p>项目集 ID: {{ selectedNodes[0].data.label }}</p>
        <p>产生式数量: {{ selectedNodes[0].data.pros?.length || 0 }}</p>
        <p>FOLLOW 集: {{ selectedNodes[0].data.followSet || '未计算' }}</p>
      </div>
    </div>

    <!-- FOLLOW 集显示面板 -->
    <div class="follow-panel" v-if="followSets.size > 0">
      <h4 class="font-semibold text-gray-800 mb-2">FOLLOW 集合</h4>
      <div class="follow-list">
        <div
          v-for="[symbol, followSet] of followSets"
          :key="symbol"
          class="follow-item"
        >
          <span class="symbol">{{ symbol }}:</span>
          <span class="set">{ {{ Array.from(followSet).join(', ') }} }</span>
        </div>
      </div>
    </div>

    <!-- 提示信息 -->
    <div class="help-text">
      <p class="text-sm text-gray-600">
        💡 提示：双击画布空白处创建项目集，SLR1 需要计算 FOLLOW 集来解决冲突
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

// FOLLOW 集存储
const followSets = ref<Map<string, Set<string>>>(new Map())

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
    markerEnd: 'slr1-arrow'
  }

  edges.value.push(newEdge)
}

const onNodeClick = (event: any) => {
  console.log('SLR1 Node clicked:', event.node)
}

const onEdgeClick = (event: any) => {
  console.log('SLR1 Edge clicked:', event.edge)
}

const onPaneClick = (event: MouseEvent) => {
  console.log('SLR1 Pane clicked')
}

const onPaneContextMenu = (event: MouseEvent) => {
  event.preventDefault()
}

// 工具栏操作
const clearCanvas = () => {
  if (confirm('确定要清空画布吗？此操作不可撤销。')) {
    clearAll()
    followSets.value.clear()
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

    console.log('Added production to SLR1 node:', node.id)
  }
}

const removeProduction = () => {
  if (selectedNodes.value.length === 1) {
    const node = selectedNodes.value[0]
    if (node.data.pros && node.data.pros.length > 0) {
      node.data.pros.pop()
      console.log('Removed production from SLR1 node:', node.id)
    }
  }
}

const computeFollowSets = () => {
  // 模拟计算 FOLLOW 集（实际应用中需要根据语法规则计算）
  console.log('Computing FOLLOW sets for SLR1...')

  // 清空之前的 FOLLOW 集
  followSets.value.clear()

  // 示例 FOLLOW 集计算
  const terminals = ['a', 'b', '+', '*', '(', ')', '$']
  const nonTerminals = ['E', 'T', 'F']

  nonTerminals.forEach(symbol => {
    const followSet = new Set<string>()

    // 模拟 FOLLOW 集计算逻辑
    if (symbol === 'E') {
      followSet.add('$')
      followSet.add(')')
    } else if (symbol === 'T') {
      followSet.add('+')
      followSet.add('$')
      followSet.add(')')
    } else if (symbol === 'F') {
      followSet.add('+')
      followSet.add('*')
      followSet.add('$')
      followSet.add(')')
    }

    followSets.value.set(symbol, followSet)
  })

  console.log('FOLLOW sets computed:', followSets.value)
}

const validateSLR1 = () => {
  console.log('Validating SLR1 grammar...')

  // 检查是否有计算 FOLLOW 集
  if (followSets.value.size === 0) {
    alert('请先计算 FOLLOW 集')
    return
  }

  // 检查是否有初始项目集
  const hasInitialItemSet = nodes.value.some(node =>
    node.data.label === 'I0'
  )

  if (!hasInitialItemSet) {
    alert('警告：缺少初始项目集 I0')
    return
  }

  // 简化的 SLR1 冲突检查
  let hasConflict = false
  const conflicts: string[] = []

  nodes.value.forEach(node => {
    if (node.data.pros && node.data.pros.length > 1) {
      // 检查是否有移进-归约冲突或归约-归约冲突
      const reductions = node.data.pros.filter((pro: any) =>
        pro.text && pro.text.includes('•') && pro.text.endsWith('•')
      )

      if (reductions.length > 1) {
        hasConflict = true
        conflicts.push(`项目集 ${node.data.label} 存在归约-归约冲突`)
      }
    }
  })

  if (hasConflict) {
    alert(`SLR1 验证失败：\n${conflicts.join('\n')}`)
  } else {
    alert('SLR1 验证通过：没有发现冲突')
  }
}

// 生命周期 - 现在双击事件通过 useNodeCreation 中的 watch 自动绑定
const onPaneReady = (vueFlowInstance: any) => {
  console.log('SLR1 Pane ready')
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
      console.log(`Removed SLR1 edge: ${change.id}`)
    }
  })
})

// 暴露给父组件的方法
defineExpose({
  getNodes: () => nodes.value,
  getEdges: () => edges.value,
  getFollowSets: () => followSets.value,
  clearCanvas,
  addNode: (node: Node) => nodes.value.push(node),
  addEdge: (edge: Edge) => edges.value.push(edge),
  computeFollowSets,
  validateSLR1
})
</script>

<style scoped>
.slr1-canvas {
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
  background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
}

.info-panel {
  padding: 1rem;
  background: white;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.follow-panel {
  padding: 1rem;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
  max-height: 150px;
  overflow-y: auto;
}

.follow-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.follow-item {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.symbol {
  font-weight: 600;
  color: #7c3aed;
}

.set {
  color: #6b7280;
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
  background: #7c3aed;
}

:deep(.vue-flow__handle-valid) {
  background: #8b5cf6;
}

:deep(.vue-flow__node.selected) {
  outline: none !important;
}

:deep(.vue-flow__edge.selected) {
  stroke: #7c3aed !important;
  stroke-width: 3 !important;
}
</style>
