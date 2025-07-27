<template>
  <div
    class="bg-white border-2 rounded-full flex items-center justify-center transition-all duration-200 relative cursor-default group hover:shadow-lg"
    :class="nodeClasses"
    @click="handleNodeClick"
    :style="nodeStyle"
    :data-id="props.id"
  >
    <!-- Node Content -->
    <div class="relative z-10" :class="{ 'pointer-events-none': !isEditing }">
      <div class="flex items-center justify-center text-sm font-medium text-gray-700">
        <div class="text-center relative">
          <input
            v-if="isEditing"
            ref="inputRef"
            v-model="nodeText"
            class="text-center bg-transparent border-none outline-none w-full text-xs"
            @blur="finishEditing"
            @keyup.enter="finishEditing"
            @keyup.escape="cancelEditing"
          />
          <span v-if="!isEditing" :class="textClasses" class="text-gray-700 text-xs text-center">
            {{ nodeText || 'Click' }}
          </span>
        </div>
      </div>
    </div>

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

    <!-- Interactive Handle (右上角，用户可见可交互) -->
    <Handle
      id="top-right"
      type="source"
      :position="Position.Right"
      class="handle-interactive handle-top-right !bg-transparent !border-0 !w-4 !h-4 !pointer-events-auto"
      data-handleid="top-right"
    />

    <!-- Interactive Target Handle -->
    <Handle
      id="top-right-target"
      type="target"
      :position="Position.Right"
      class="handle-interactive handle-top-right !bg-transparent !border-0 !w-4 !h-4 !pointer-events-auto"
      data-handleid="top-right-target"
    />

    <!-- Hidden Central Handles (用于实际连线渲染，不可见) -->
    <Handle id="center-source" type="source" :position="Position.Top" class="center-handle" />
    <Handle id="center-target" type="target" :position="Position.Top" class="center-handle" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Handle, Position, type NodeProps } from '@vue-flow/core'
import { useNodeState, useNodeAnimation } from '../../composables'
import { NodeSizeCalculator, ColorUtils } from '../../utils'
import type { NodeData } from '../../types'

// 直接使用SVG字符串作为data URI
const arrowIconDataUri =
  'data:image/svg+xml;base64,' +
  btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
      '<path fill="white" d="m11.93 5l2.83 2.83L5 17.59L6.42 19l9.76-9.75L19 12.07V5z"/>' +
      '</svg>',
  )

interface Props extends NodeProps {
  data: NodeData
}

const props = defineProps<Props>()

const inputRef = ref<HTMLInputElement>()
const isEditing = ref(false)
const originalText = ref('')

// 使用组合函数
const nodes = ref([]) // 这里需要从父组件或store获取
const { nodeData, isSelected, isInitial, isFinal, updateNodeData } = useNodeState(props.id, nodes)
const { animateNodeSelection } = useNodeAnimation()

// 计算节点尺寸
const nodeSize = computed(() => {
  const text = nodeText.value
  if (props.data.size && props.data.size > 0) {
    return props.data.size
  }
  return NodeSizeCalculator.calculateCircleSize(text)
})

// Handle偏移量
const handleOffset = computed(() => Math.round((nodeSize.value / 2) * 0.707))

// 动态样式
const nodeStyle = computed(() => ({
  '--node-size': `${nodeSize.value}px`,
  '--handle-offset': `${handleOffset.value}px`,
  '--arrow-icon': `url(${arrowIconDataUri})`,
  '--state-color': ColorUtils.getStateColor(isInitial.value, isFinal.value),
  width: `${nodeSize.value}px`,
  height: `${nodeSize.value}px`,
}))

// 节点CSS类
const nodeClasses = computed(() => ({
  'border-blue-500 ring-2 ring-blue-200': isSelected.value && !isEditing.value,
  'border-purple-500 ring-2 ring-purple-200 bg-purple-50': isEditing.value,
  'border-gray-300 hover:border-blue-400': !isSelected.value && !isEditing.value,
  'border-green-500': isInitial.value && !isSelected.value,
  'border-orange-500': isFinal.value && !isSelected.value && !isInitial.value,
}))

// 文本CSS类
const textClasses = computed(() => ({
  'italic opacity-50': !nodeText.value,
  'opacity-100': nodeText.value,
  'font-bold': isInitial.value || isFinal.value,
}))

// 节点文本，同步到 data.text
const nodeText = computed({
  get: () => props.data.text || '',
  set: (value: string) => {
    updateNodeData({ text: value })
  },
})

// 处理节点点击事件
const handleNodeClick = (event: MouseEvent) => {
  if (isEditing.value) {
    event.stopPropagation()
    return
  }

  if (isSelected.value) {
    event.stopPropagation()
    enterEditMode()
  } else {
    animateNodeSelection(props.id)
  }
}

// 进入编辑模式
const enterEditMode = async () => {
  isEditing.value = true
  originalText.value = nodeText.value

  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

// 完成编辑
const finishEditing = () => {
  isEditing.value = false
}

// 取消编辑
const cancelEditing = () => {
  nodeText.value = originalText.value
  isEditing.value = false
}
</script>

<style scoped>
/* Hidden Central Handle 样式 */
.center-handle {
  position: absolute !important;
  width: 4px !important;
  height: 4px !important;
  background: transparent !important;
  border: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
}

/* 输入框文本选中样式优化 */
input::selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

input::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

/* 右上角Handle精确定位 */
.handle-top-right {
  position: absolute !important;
  top: calc(50% - var(--handle-offset, 34px)) !important;
  right: calc(50% - var(--handle-offset, 34px)) !important;
  transform: translate(50%, -50%) !important;
}

/* 右上角Handle样式 - 未选中状态 */
:deep(.vue-flow__handle[data-handleid='top-right'])::before,
:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #6b7280;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: crosshair;
}

/* 选中状态下的Handle样式 */
.ring-2:deep(.vue-flow__handle[data-handleid='top-right'])::before {
  width: 16px;
  height: 16px;
  background: #374151;
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

/* Target Handle 样式 */
:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  background: #9ca3af;
}

.ring-2:deep(.vue-flow__handle[data-handleid='top-right-target'])::before {
  width: 16px;
  height: 16px;
  background: #6b7280;
}

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
</style>
