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
  } else {
    style.width = `${nodeSize.value.width}px`
    style.minHeight = `${nodeSize.value.height}px`
  }

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
}

.handle-interactive {
  transition: opacity 200ms !important;
}

.handle-interactive:hover {
  opacity: 1 !important;
}

.handle-top-right {
  top: 10px;
  right: 10px;
}
</style>
