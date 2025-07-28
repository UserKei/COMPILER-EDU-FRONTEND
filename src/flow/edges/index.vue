<template>
  <g>
    <!-- Main edge path -->
    <BaseEdge
      :id="id"
      :style="edgeStyle"
      :path="edgePath"
      :marker-end="markerEnd"
      class="stroke-2 fill-none transition-all duration-200"
      :class="edgeClasses"
    />

    <!-- Label on curve - draggable to control shape, clickable to edit -->
    <EdgeLabelRenderer>
      <div
        ref="labelRef"
        :style="labelStyle"
        class="edge-label px-2 py-1 bg-white border border-gray-300 rounded text-xs font-medium shadow-sm select-none transition-all duration-200"
        :class="labelClasses"
        @mousedown="onLabelMouseDown"
        @click="onLabelClick"
      >
        <div class="relative w-8">
          <input
            v-if="isEditing"
            ref="inputRef"
            v-model="labelText"
            class="text-center bg-transparent border-none outline-none w-8 h-4 text-xs"
            @blur="finishEditing"
            @keyup.enter="finishEditing"
            @keyup.escape="cancelEditing"
            @mousedown.stop
          />
          <span
            v-if="!isEditing"
            :class="labelTextClasses"
            class="text-xs text-center block w-8 h-4 leading-4 truncate"
          >
            {{ labelText || 'Click' }}
          </span>
        </div>
      </div>
    </EdgeLabelRenderer>
  </g>
</template>

<script setup lang="ts">
import { computed, ref, watch, onUnmounted, onMounted, nextTick } from 'vue'
import { BaseEdge, EdgeLabelRenderer, useVueFlow, type EdgeProps } from '@vue-flow/core'
import { useEdgeManagement } from '../composables'
import type { EdgeData } from '../types'

interface Props extends EdgeProps<EdgeData> {}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  markerEnd: 'url(#arrow)',
})

// 从 props 中获取路径数据
const edgePath = computed(() => {
  // 简单的路径计算，从源到目标的直线
  if (
    props.sourceX !== undefined &&
    props.sourceY !== undefined &&
    props.targetX !== undefined &&
    props.targetY !== undefined
  ) {
    const controlX = (props.sourceX + props.targetX) / 2
    const controlY = (props.sourceY + props.targetY) / 2

    // 应用偏移
    const offset = edgeData.value.controlOffset || { x: 0, y: 0 }
    const adjustedControlX = controlX + offset.x
    const adjustedControlY = controlY + offset.y

    return `M ${props.sourceX} ${props.sourceY} Q ${adjustedControlX} ${adjustedControlY} ${props.targetX} ${props.targetY}`
  }

  return ''
})

const { findEdge, edges } = useVueFlow()

// 辅助函数：更新边数据
const updateCurrentEdgeData = (newData: Partial<EdgeData>) => {
  const edgeIndex = edges.value.findIndex((e) => e.id === props.id)
  if (edgeIndex !== -1) {
    edges.value[edgeIndex] = {
      ...edges.value[edgeIndex],
      data: { ...edges.value[edgeIndex].data, ...newData },
    }
  }
}

// 响应式状态
const labelRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const isEditing = ref(false)
const isDragging = ref(false)
const originalText = ref('')

// 拖拽相关状态
const dragStartPos = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

// 计算属性
const edgeData = computed(() => props.data || {})

const labelText = computed({
  get: () => edgeData.value.label || '',
  set: (value: string) => {
    updateCurrentEdgeData({ label: value })
  },
})

const isSelected = computed(() => props.selected)

// 标签位置计算
const labelPosition = computed(() => {
  const defaultT = 0.5 // 默认在边的中点
  const t = edgeData.value.labelT || defaultT

  // 基于路径的位置计算
  // 这里使用简化的计算，实际项目中可能需要更复杂的路径解析
  if (
    props.sourceX !== undefined &&
    props.sourceY !== undefined &&
    props.targetX !== undefined &&
    props.targetY !== undefined
  ) {
    const x = props.sourceX + (props.targetX - props.sourceX) * t
    const y = props.sourceY + (props.targetY - props.sourceY) * t

    // 添加控制偏移
    const offset = edgeData.value.controlOffset || { x: 0, y: 0 }
    return {
      x: x + offset.x,
      y: y + offset.y,
    }
  }

  return { x: 0, y: 0 }
})

// 样式计算
const edgeStyle = computed(() => ({}))

const edgeClasses = computed(() => ({
  'stroke-blue-500': isSelected.value,
  'stroke-gray-400': !isSelected.value,
}))

const labelStyle = computed(() => ({
  transform: `translate(-50%, -50%) translate(${labelPosition.value.x}px, ${labelPosition.value.y}px)`,
  cursor: isDragging.value ? 'move' : isEditing.value ? 'text' : 'pointer',
}))

const labelClasses = computed(() => ({
  'border-blue-500 text-blue-700 shadow-md bg-blue-50': isSelected.value && !isEditing.value,
  'border-purple-500 text-purple-700 shadow-md bg-purple-50': isEditing.value,
  'text-gray-700 hover:border-gray-400': !isSelected.value && !isEditing.value,
}))

const labelTextClasses = computed(() => ({
  'text-gray-500 italic opacity-50': !labelText.value,
  'text-gray-700 opacity-100': labelText.value,
}))

// 事件处理函数
const onLabelClick = (event: MouseEvent) => {
  if (isDragging.value) return

  event.stopPropagation()
  enterEditMode()
}

const onLabelMouseDown = (event: MouseEvent) => {
  if (isEditing.value) return

  isDragging.value = true
  dragStartPos.value = { x: event.clientX, y: event.clientY }
  dragOffset.value = edgeData.value.controlOffset || { x: 0, y: 0 }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  event.preventDefault()
}

const onMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  const dx = event.clientX - dragStartPos.value.x
  const dy = event.clientY - dragStartPos.value.y

  const newOffset = {
    x: dragOffset.value.x + dx,
    y: dragOffset.value.y + dy,
  }

  updateCurrentEdgeData({ controlOffset: newOffset })
}

const onMouseUp = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
}

// 编辑模式函数
const enterEditMode = async () => {
  isEditing.value = true
  originalText.value = labelText.value

  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

const finishEditing = () => {
  isEditing.value = false
}

const cancelEditing = () => {
  labelText.value = originalText.value
  isEditing.value = false
}

// 生命周期
onMounted(() => {
  // 组件挂载时的初始化
})

onUnmounted(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', onMouseMove)
  document.removeEventListener('mouseup', onMouseUp)
})

// 监听选中状态变化
watch(isSelected, (newSelected) => {
  if (!newSelected && isEditing.value) {
    finishEditing()
  }
})
</script>

<style scoped>
.edge-label {
  position: absolute;
  pointer-events: auto;
  user-select: none;
}

/* 输入框选中样式 */
input::selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

input::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

/* 标签悬停效果 */
.edge-label:hover {
  transform: scale(1.05);
}

/* 拖拽状态样式 */
.edge-label.dragging {
  cursor: move !important;
  z-index: 1000;
}
</style>
