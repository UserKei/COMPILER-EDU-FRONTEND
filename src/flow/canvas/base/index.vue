<template>
  <div class="base-canvas">
    <!-- 工具栏 -->
    <div class="toolbar">
      <h3 class="text-lg font-semibold text-gray-800">{{ title }}</h3>
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
        :nodes="nodes"
        :edges="edges"
        :node-types="nodeTypes"
        :edge-types="edgeTypes"
        :default-viewport="defaultViewport"
        :min-zoom="config.minZoom"
        :max-zoom="config.maxZoom"
        :connect-on-click="false"
        :nodes-connectable="true"
        :nodes-draggable="true"
        :selection-on-drag="false"
        :pan-on-drag="[2]"
        :zoom-on-double-click="false"
        :fit-view-on-init="config.fitViewOnInit"
        class="vue-flow"
        :class="canvasClass"
        @connect="onConnect"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @pane-click="onPaneClick"
        @pane-context-menu="onPaneContextMenu"
        @pane-ready="onPaneReady"
        @pane-double-click="onPaneDoubleClick"
      >
        <!-- 控制器 -->
        <Controls v-if="config.showControls" position="top-right" />

        <!-- 背景 -->
        <Background
          v-if="config.showBackground"
          :pattern="config.backgroundPattern"
          :gap="config.backgroundGap"
          :size="config.backgroundSize"
          :color="config.backgroundColor"
        />
      </VueFlow>
    </div>

    <!-- 侧边栏插槽 -->
    <div v-if="$slots.sidebar" class="sidebar">
      <slot name="sidebar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { Background } from '@vue-flow/background'
import type { Node, Edge, Connection, MouseTouchEvent } from '@vue-flow/core'

// Props
interface Props {
  title: string
  nodes: Node[]
  edges: Edge[]
  nodeTypes?: Record<string, any>
  edgeTypes?: Record<string, any>
  canvasClass?: string
  config?: {
    minZoom?: number
    maxZoom?: number
    fitViewOnInit?: boolean
    showControls?: boolean
    showBackground?: boolean
    backgroundPattern?: 'dots' | 'lines' | 'cross'
    backgroundGap?: number
    backgroundSize?: number
    backgroundColor?: string
  }
  toolbarButtons?: Array<{
    label: string
    action: () => void
    disabled?: boolean
    variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning'
  }>
}

const props = withDefaults(defineProps<Props>(), {
  nodeTypes: () => ({}),
  edgeTypes: () => ({}),
  canvasClass: '',
  config: () => ({
    minZoom: 0.1,
    maxZoom: 2,
    fitViewOnInit: true,
    showControls: true,
    showBackground: true,
    backgroundPattern: 'dots',
    backgroundGap: 20,
    backgroundSize: 1,
    backgroundColor: '#e5e7eb',
  }),
  toolbarButtons: () => [],
})

// Emits
const emit = defineEmits<{
  connect: [connection: Connection]
  nodeClick: [event: { node: Node; event: MouseTouchEvent }]
  edgeClick: [event: { edge: Edge; event: MouseTouchEvent }]
  paneClick: [event: MouseEvent]
  paneContextMenu: [event: MouseEvent]
  paneReady: [vueFlowInstance: any]
  paneDoubleClick: [event: MouseEvent]
}>()

// Default viewport
const defaultViewport = ref({ x: 0, y: 0, zoom: 1 })

// Event handlers
const onConnect = (connection: Connection) => {
  emit('connect', connection)
}

const onNodeClick = (event: { node: Node; event: MouseTouchEvent }) => {
  emit('nodeClick', event)
}

const onEdgeClick = (event: { edge: Edge; event: MouseTouchEvent }) => {
  emit('edgeClick', event)
}

const onPaneClick = (event: MouseEvent) => {
  emit('paneClick', event)
}

const onPaneContextMenu = (event: MouseEvent) => {
  emit('paneContextMenu', event)
}

const onPaneReady = (vueFlowInstance: any) => {
  emit('paneReady', vueFlowInstance)
}

const onPaneDoubleClick = (event: MouseEvent) => {
  emit('paneDoubleClick', event)
}

// Button classes
const getButtonClasses = (variant: string = 'primary'): string => {
  const classes: Record<string, string> = {
    primary: 'bg-blue-500 hover:bg-blue-600',
    secondary: 'bg-gray-500 hover:bg-gray-600',
    success: 'bg-green-500 hover:bg-green-600',
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
  }
  return classes[variant] || classes.primary
}
</script>

<style scoped>
.base-canvas {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  z-index: 10;
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.vue-flow {
  height: 100%;
  width: 100%;
}

.sidebar {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  width: 300px;
  background: white;
  border-left: 1px solid #e5e7eb;
  z-index: 5;
}
</style>
