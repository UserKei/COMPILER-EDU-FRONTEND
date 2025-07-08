<template>
  <div
    ref="nodeRef"
    class="
      min-h-16 bg-white border-2 p-3
      transition-all duration-200
      relative cursor-default group
      hover:shadow-lg
    "
    :class="{
      'border-blue-500 ring-2 ring-blue-200': isSelected && !isEditing,
      'border-purple-500 ring-2 ring-purple-200 bg-purple-50': isEditing,
      'border-gray-300 hover:border-blue-400': !isSelected && !isEditing
    }"
  @click="handleNodeClick"
  :style="{
    width: dynamicWidth,
    '--arrow-icon': `url(${arrowIconDataUri})`
  }"
  >
    <!-- Node Content -->
    <div class="relative z-10" :class="{ 'pointer-events-none': !isEditing }">
      <div class="
        flex items-center justify-center
        text-sm font-medium text-gray-700
        min-h-8
      ">
        <div class="text-center relative">
          <input
            v-if="isEditing"
            ref="inputRef"
            v-model="nodeText"
            class="
              text-center bg-transparent
              border-none outline-none
              w-full
              text-xs
            "
            @blur="finishEditing"
            @keyup.enter="finishEditing"
            @keyup.escape="cancelEditing"
          />
          <span
            v-if="!isEditing"
            :class="{
              'italic opacity-50': !nodeText,
              'opacity-100': nodeText
            }"
            class="
              text-gray-700
              text-xs text-center
            "
          >
            {{ nodeText || 'Click' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Interactive Handle (右上角，用户可见可交互) - Handle中心在矩形右上角边框线上 -->
    <Handle
      id="top-right"
      type="source"
      :position="Position.Right"
      class="rectangle-handle-interactive"
      data-handleid="top-right"
    />

    <!-- Interactive Target Handle -->
    <Handle
      id="top-right-target"
      type="target"
      :position="Position.Right"
      class="rectangle-handle-interactive"
      data-handleid="top-right-target"
    />

    <!-- Hidden Central Handles (用于实际连线渲染，不可见) -->
    <Handle
      id="center-source"
      type="source"
      :position="Position.Top"
      class="center-handle"
    />
    <Handle
      id="center-target"
      type="target"
      :position="Position.Top"
      class="center-handle"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Handle, Position, useVueFlow, type NodeProps } from '@vue-flow/core'

// 直接使用SVG字符串作为data URI，fill设为white确保在蓝色/绿色背景下可见
const arrowIconDataUri = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="white" d="m11.93 5l2.83 2.83L5 17.59L6.42 19l9.76-9.75L19 12.07V5z"/></svg>')

interface NodeData {
  label?: string
  text?: string
  [key: string]: any
}

interface Props extends NodeProps {
  data: NodeData
}

const props = defineProps<Props>()

const { getSelectedNodes, updateNode } = useVueFlow()

const nodeRef = ref<HTMLElement>()
const inputRef = ref<HTMLInputElement>()
const isEditing = ref(false)
const originalText = ref('')

// 节点文本，同步到 data.text
const nodeText = computed({
  get: () => props.data.text || '',
  set: (value: string) => {
    updateNode(props.id, {
      data: { ...props.data, text: value }
    })
  }
})

// 检查节点是否被选中
const isSelected = computed(() => {
  const selectedNodes = getSelectedNodes.value
  return selectedNodes.some(node => node.id === props.id)
})

// 处理节点点击事件
const handleNodeClick = (event: MouseEvent) => {
  if (isEditing.value) {
    event.stopPropagation()
    return // 编辑状态下阻止所有点击事件
  }

  // 如果节点已经被选中，再次点击进入编辑模式
  if (isSelected.value) {
    event.stopPropagation()
    enterEditMode()
  }
  // 如果节点未被选中，不阻止事件，让 Vue Flow 处理选中逻辑
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
  // nodeText 的 setter 会自动更新数据
}

// 取消编辑
const cancelEditing = () => {
  nodeText.value = originalText.value
  isEditing.value = false
}

// 计算节点的动态宽度
const dynamicWidth = computed(() => {
  const text = nodeText.value
  // 如果没有实际文本内容，使用最小宽度
  if (!text || text.trim() === '') {
    return '80px' // 空状态最小宽度
  }
  // 基础宽度 + 字符数 * 每字符宽度，最小80px，最大240px
  const width = Math.max(80, Math.min(240, text.length * 8 + 32))
  return width + 'px'
})

// ...existing code...
watch(isSelected, (newSelected) => {
  if (!newSelected && isEditing.value) {
    finishEditing()
  }
})
</script>

<style scoped>
/* Rectangle Handle 交互样式 */
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
  background-color: rgba(59, 130, 246, 0.3); /* 蓝色半透明选中背景 */
  color: inherit;
}

input::-moz-selection {
  background-color: rgba(59, 130, 246, 0.3);
  color: inherit;
}

/* 右上角Handle样式 - 未选中状态 (使用灰色系) */
:deep(.vue-flow__handle[data-handleid="top-right"])::before,
:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  content: "";
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
.ring-2:deep(.vue-flow__handle[data-handleid="top-right"])::before {
  width: 16px;
  height: 16px;
  background: #374151; /* gray-700 */
}

.ring-2:deep(.vue-flow__handle[data-handleid="top-right"])::after {
  content: "";
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
:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  background: #9ca3af; /* gray-400 */
}

.ring-2:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  width: 16px;
  height: 16px;
  background: #6b7280; /* gray-500 */
}

/* Target Handle 选中时也显示图标 */
.ring-2:deep(.vue-flow__handle[data-handleid="top-right-target"])::after {
  content: "";
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
:deep(.vue-flow__handle[data-handleid="top-right"]:hover)::before,
:deep(.vue-flow__handle[data-handleid="top-right-target"]:hover)::before {
  transform: translate(-50%, -50%) scale(1.1);
}
</style>
