<template>
  <div
    ref="nodeRef"
    class="min-w-24 min-h-16 bg-white border-2 border-gray-300 p-3 transition-all duration-200 relative cursor-default group hover:border-blue-400 hover:shadow-lg"
    :class="{
      'ring-2 ring-blue-500': isSelected,
      'ring-4 ring-purple-500': isEditing
    }"
    @click="handleNodeClick"
  >
    <!-- Node Content -->
    <div class="relative z-10" :class="{ 'pointer-events-none': !isEditing }">
      <div class="flex items-center justify-center text-sm font-medium text-gray-700 min-h-8">
        <input
          v-if="isEditing"
          ref="inputRef"
          v-model="nodeText"
          class="w-full text-center bg-transparent border-none outline-none"
          @blur="finishEditing"
          @keyup.enter="finishEditing"
          @keyup.escape="cancelEditing"
        />
        <div v-else class="text-center">
          {{ nodeText || id }}
        </div>
      </div>
    </div>

    <!-- Interactive Handle (右上角，用户可见可交互) -->
    <Handle
      id="top-right"
      type="source"
      :position="Position.Right"
      class="handle-interactive"
      :style="{
        position: 'absolute',
        top: '0px',
        right: '0px',
        transform: 'translate(50%, -50%)'
      }"
      data-handleid="top-right"
    />

    <!-- Interactive Target Handle -->
    <Handle
      id="top-right-target"
      type="target"
      :position="Position.Right"
      class="handle-interactive"
      :style="{
        position: 'absolute',
        top: '0px',
        right: '0px',
        transform: 'translate(50%, -50%)'
      }"
      data-handleid="top-right-target"
    />

    <!-- Hidden Central Handles (用于实际连线渲染，不可见) -->
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
  get: () => props.data.text || props.data.label || '',
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

// 双击计时器
let clickTimer: number | null = null

// 处理节点点击事件
const handleNodeClick = (event: MouseEvent) => {
  event.stopPropagation()

  if (isEditing.value) {
    return // 编辑状态下不处理点击
  }

  if (clickTimer) {
    // 双击：进入编辑模式
    clearTimeout(clickTimer)
    clickTimer = null

    if (isSelected.value) {
      enterEditMode()
    }
  } else {
    // 单击：选中节点
    clickTimer = setTimeout(() => {
      clickTimer = null
      // 单击逻辑由 Vue Flow 处理
    }, 300)
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
/* 基础Handle隐藏原始样式 */
.handle-interactive {
  background: transparent !important;
  border: none !important;
  width: 16px !important;
  height: 16px !important;
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
