<template>
  <div
    ref="nodeRef"
    class="transition-all duration-200 relative cursor-default group hover:shadow-lg"
    :class="[baseNodeClasses, nodeClasses]"
    @click="handleNodeClick"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
    :style="nodeStyle"
    :data-id="props.id"
  >
    <!-- Slot for node content -->
    <slot
      :is-editing="isEditing"
      :node-text="nodeText"
      :finish-editing="finishEditing"
      :cancel-editing="cancelEditing"
      :input-ref="inputRef"
    />

    <!-- State Indicators -->
    <div v-if="isInitial" class="absolute -left-3 top-1/2 transform -translate-y-1/2">
      <div
        class="w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-green-500"
      ></div>
    </div>

    <div
      v-if="isFinal"
      class="absolute inset-1 border-2 border-orange-400 rounded-full pointer-events-none"
    ></div>

    <!-- Handles -->
    <Handle
      v-for="handle in handles"
      :key="handle.id"
      :id="handle.id"
      :type="handle.type"
      :position="handle.position"
      :class="handle.class"
      :data-handleid="handle.id"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { useNodeState, useNodeAnimation } from '../../composables'
import { NodeSizeCalculator, ColorUtils } from '../../utils'
import type { NodeData } from '../../types'

interface HandleConfig {
  id: string
  type: 'source' | 'target'
  position: Position
  class: string
}

interface Props extends NodeProps {
  data: NodeData
  nodeShape?: 'circle' | 'rectangle'
  handles?: HandleConfig[]
  size?: number | { width: number; height: number }
}

const props = withDefaults(defineProps<Props>(), {
  nodeShape: 'circle',
  handles: () => [
    {
      id: 'top-right',
      type: 'source',
      position: Position.Right,
      class:
        'handle-interactive handle-top-right !bg-transparent !border-0 !w-4 !h-4 !pointer-events-auto',
    },
    {
      id: 'top-right-target',
      type: 'target',
      position: Position.Right,
      class:
        'handle-interactive handle-top-right !bg-transparent !border-0 !w-4 !h-4 !pointer-events-auto',
    },
    {
      id: 'center-source',
      type: 'source',
      position: Position.Top,
      class: 'center-handle',
    },
    {
      id: 'center-target',
      type: 'target',
      position: Position.Top,
      class: 'center-handle',
    },
  ],
})

const emit = defineEmits<{
  'update:data': [data: NodeData]
  'node-click': [event: MouseEvent]
  'editing-start': []
  'editing-end': [text: string]
}>()

const nodeRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const isEditing = ref(false)
const originalText = ref('')
const isHovered = ref(false)

// 使用组合函数
const nodes = ref([]) // 这里需要从父组件或store获取
const { nodeData, isSelected, isInitial, isFinal, updateNodeData } = useNodeState(props.id, nodes)
const { animateNodeSelection } = useNodeAnimation()

// 节点文本，同步到 data.text
const nodeText = computed({
  get: () => props.data.text || '',
  set: (value: string) => {
    updateNodeData({ text: value })
    emit('update:data', { ...props.data, text: value })
  },
})

// 计算节点尺寸
const nodeSize = computed(() => {
  if (props.size) {
    if (typeof props.size === 'number') {
      return { width: props.size, height: props.size }
    }
    return props.size
  }

  const text = nodeText.value
  if (props.data.size && props.data.size > 0) {
    return { width: props.data.size, height: props.data.size }
  }

  if (props.nodeShape === 'circle') {
    const size = NodeSizeCalculator.calculateCircleSize(text)
    return { width: size, height: size }
  } else {
    const size = NodeSizeCalculator.calculateRectangleSize(1) // 默认项目数为1
    return { width: size.width, height: size.height }
  }
})

// 基础节点样式
const nodeStyle = computed(() => {
  const style: Record<string, string> = {
    '--state-color': ColorUtils.getStateColor(isInitial.value, isFinal.value),
  }

  if (props.nodeShape === 'circle') {
    style.width = `${nodeSize.value.width}px`
    style.height = `${nodeSize.value.height}px`
    const handleOffset = Math.round((nodeSize.value.width / 2) * 0.707)
    style['--handle-offset'] = `${handleOffset}px`
    style['--node-size'] = `${nodeSize.value.width}px`
  } else {
    style.width = `${nodeSize.value.width}px`
    style.minHeight = `${nodeSize.value.height}px`
  }

  // 添加箭头图标
  const arrowIconDataUri =
    'data:image/svg+xml;base64,' +
    btoa(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="m11.93 5l2.83 2.83L5 17.59L6.42 19l9.76-9.75L19 12.07V5z"/></svg>',
    )
  style['--arrow-icon'] = `url(${arrowIconDataUri})`

  return style
})

// 基础节点CSS类
const baseNodeClasses = computed(() => ({
  'bg-white border-2': true,
  'rounded-full': props.nodeShape === 'circle',
  'rounded-lg': props.nodeShape === 'rectangle',
  'border-blue-500 ring-2 ring-blue-200': isSelected.value && !isEditing.value,
  'border-purple-500 ring-2 ring-purple-200 bg-purple-50': isEditing.value,
  'border-gray-300 hover:border-blue-400': !isSelected.value && !isEditing.value,
  'border-green-500': isInitial.value && !isSelected.value,
  'border-orange-500': isFinal.value && !isSelected.value && !isInitial.value,
}))

// 供子组件覆写的节点类
const nodeClasses = computed(() => ({}))

// 处理节点点击事件
const handleNodeClick = (event: MouseEvent) => {
  if (isEditing.value) {
    event.stopPropagation()
    return
  }

  emit('node-click', event)

  if (isSelected.value) {
    event.stopPropagation()
    startEditing()
  } else {
    animateNodeSelection(props.id)
  }
}

// 开始编辑
const startEditing = () => {
  if (isEditing.value) return

  originalText.value = nodeText.value
  isEditing.value = true
  emit('editing-start')

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
      inputRef.value.select()
    }
  })
}

// 完成编辑
const finishEditing = () => {
  if (!isEditing.value) return

  isEditing.value = false
  emit('editing-end', nodeText.value)
}

// 取消编辑
const cancelEditing = () => {
  if (!isEditing.value) return

  nodeText.value = originalText.value
  isEditing.value = false
}

// 鼠标事件
const onMouseEnter = () => {
  isHovered.value = true
}

const onMouseLeave = () => {
  isHovered.value = false
}

// 导出供子组件使用的属性和方法
defineExpose({
  nodeRef,
  inputRef,
  isEditing,
  isHovered,
  nodeText,
  startEditing,
  finishEditing,
  cancelEditing,
  isSelected,
  isInitial,
  isFinal,
})
</script>

<style scoped>
.center-handle {
  opacity: 0 !important;
  pointer-events: none !important;
  position: absolute !important;
  width: 4px !important;
  height: 4px !important;
  background: transparent !important;
  border: none !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
}

.handle-interactive {
  transition: opacity 200ms !important;
}

.handle-interactive:hover {
  opacity: 1 !important;
}

/* 右上角Handle精确定位 - Handle中心在圆的边界线上 */
.handle-top-right {
  position: absolute !important;
  top: calc(50% - var(--handle-offset, 34px)) !important;
  right: calc(50% - var(--handle-offset, 34px)) !important;
  transform: translate(50%, -50%) !important;
}

/* 右上角Handle样式 - 未选中状态 (使用灰色系) */
:deep(.vue-flow__handle[data-handleid='top-right'])::before,
:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #6b7280; /* gray-500 */
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: crosshair;
}

/* 选中状态下的Handle样式 - 深灰色 */
.ring-2:deep(.vue-flow__handle[data-handleid='top-right'])::before {
  width: 16px;
  height: 16px;
  background: #374151; /* gray-700 */
}

/* 选中状态下显示箭头图标 */
.ring-2:deep(.vue-flow__handle[data-handleid='top-right'])::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background-image: var(--arrow-icon);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 1;
}

/* Target Handle 样式 (浅灰色) */
:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  background: #9ca3af; /* gray-400 */
}

.ring-2:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  width: 16px;
  height: 16px;
  background: #6b7280; /* gray-500 */
}

/* Target Handle 选中时也显示图标 */
.ring-2:deep(.vue-flow__handle[data-handleid='top-right-target'])::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background-image: var(--arrow-icon);
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  z-index: 1;
}

/* Hover效果 */
:deep(.vue-flow__handle[data-handleid='top-right']:hover)::before,
:deep(.vue-flow__handle[data-handleid='top-right-target']:hover)::before {
  transform: translate(-50%, -50%) scale(1.1);
}

/* 矩形节点Handle样式 */
.rectangle-handle-interactive {
  position: absolute !important;
  top: -8px !important;
  right: -8px !important;
  background: transparent !important;
  border: none !important;
  width: 16px !important;
  height: 16px !important;
  pointer-events: auto !important;
  transform: translate(0%, 0%) !important;
}

/* 输入框文本选中样式优化 */
input::selection {
  background-color: rgba(59, 130, 246, 0.3); /* 蓝色半透明选中背景 */
  color: inherit;
}

input::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}
</style>
