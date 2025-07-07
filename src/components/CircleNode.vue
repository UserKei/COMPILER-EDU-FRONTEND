<template>
  <div
    class="circle-node bg-white border-2 rounded-full flex items-center justify-center transition-all duration-200 relative cursor-default group hover:shadow-lg"
    :class="{
      'border-blue-500 ring-2 ring-blue-200': isSelected && !isEditing,
      'border-purple-500 ring-2 ring-purple-200 bg-purple-50': isEditing,
      'border-gray-300 hover:border-blue-400': !isSelected && !isEditing
    }"
    @click="handleNodeClick"
    :style="nodeStyle"
  >
    <!-- Node Content -->
    <div class="relative z-10" :class="{ 'pointer-events-none': !isEditing }">
      <div class="flex items-center justify-center text-sm font-medium text-gray-700">
        <div class="text-center relative">
          <input
            v-if="isEditing"
            ref="inputRef"
            v-model="nodeText"
            class="text-center bg-transparent border-none outline-none text-sm absolute inset-0 w-full"
            @blur="finishEditing"
            @keyup.enter="finishEditing"
            @keyup.escape="cancelEditing"
          />
          <span
            :class="{ 'opacity-0': isEditing }"
            class="text-gray-700 text-xs"
          >
            {{ nodeText || 'Start typing...' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Interactive Handle (右上角，用户可见可交互) -->
    <Handle
      id="top-right"
      type="source"
      :position="Position.Right"
      class="handle-interactive handle-top-right"
      data-handleid="top-right"
    />

    <!-- Interactive Target Handle -->
    <Handle
      id="top-right-target"
      type="target"
      :position="Position.Right"
      class="handle-interactive handle-top-right"
      data-handleid="top-right-target"
    />

    <!-- Hidden Central Handle (用于实际连线渲染，不可见) -->
    <Handle
      id="center-source"
      type="source"
      :position="Position.Top"
      class="!absolute !w-1 !h-1 !bg-transparent !border-none !opacity-0 !pointer-events-none"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }"
    />
    <Handle
      id="center-target"
      type="target"
      :position="Position.Top"
      class="!absolute !w-1 !h-1 !bg-transparent !border-none !opacity-0 !pointer-events-none"
      :style="{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { Handle, Position, useVueFlow, type NodeProps } from '@vue-flow/core'

interface NodeData {
  label?: string
  text?: string
  size?: number // 节点尺寸（像素）
  [key: string]: any
}

interface Props extends NodeProps {
  data: NodeData
}

const props = defineProps<Props>()

const { getSelectedNodes, updateNode } = useVueFlow()

const inputRef = ref<HTMLInputElement>()
const isEditing = ref(false)
const originalText = ref('')

// 计算节点尺寸和Handle偏移 - 基于文本长度自适应
const nodeSize = computed(() => {
  const text = nodeText.value || 'Start typing...'
  // 基于文本长度计算圆形大小，最小80px，最大160px
  const baseSize = Math.max(80, Math.min(160, text.length * 10 + 60))
  return props.data.size || baseSize
})
const handleOffset = computed(() => Math.round(nodeSize.value / 2 * 0.707)) // 45度角偏移

// 动态样式
const nodeStyle = computed(() => ({
  '--node-size': `${nodeSize.value}px`,
  '--handle-offset': `${handleOffset.value}px`
}))

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

// 监听选中状态变化，当节点失去选中时退出编辑模式
watch(isSelected, (newSelected) => {
  if (!newSelected && isEditing.value) {
    finishEditing()
  }
})
</script>

<style scoped>
/* 圆形节点基础样式 */
.circle-node {
  width: var(--node-size, 96px);
  height: var(--node-size, 96px);
}

/* 基础Handle隐藏原始样式 */
.handle-interactive {
  background: transparent !important;
  border: none !important;
  width: 16px !important;
  height: 16px !important;
  pointer-events: auto !important;
}

/* 右上角Handle精确定位 */
.handle-top-right {
  position: absolute !important;
  top: calc(50% - var(--handle-offset, 34px)) !important;
  right: calc(50% - var(--handle-offset, 34px)) !important;
  transform: translate(50%, -50%) !important;
}

/* 右上角Handle样式 - 未选中状态 */
:deep(.vue-flow__handle[data-handleid="top-right"])::before,
:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #3b82f6;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: crosshair;
}

/* 选中状态下的Handle样式 */
.ring-2:deep(.vue-flow__handle[data-handleid="top-right"])::before {
  width: 16px;
  height: 16px;
  background: #2563eb;
}

.ring-2:deep(.vue-flow__handle[data-handleid="top-right"])::after {
  content: "↗";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  color: white;
  font-weight: bold;
  z-index: 1;
}

/* Target Handle (绿色) */
:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  background: #10b981;
}

.ring-2:deep(.vue-flow__handle[data-handleid="top-right-target"])::before {
  width: 16px;
  height: 16px;
  background: #059669;
}

/* Hover效果 */
:deep(.vue-flow__handle[data-handleid="top-right"]:hover)::before,
:deep(.vue-flow__handle[data-handleid="top-right-target"]:hover)::before {
  transform: translate(-50%, -50%) scale(1.1);
}
</style>


